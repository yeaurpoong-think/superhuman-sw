import { decodeBase64Utf8, encodeUtf8Base64, utf8ByteLength } from './base64'

/**
 * 편집 서버(Cloudflare Worker) 클라이언트.
 *
 * 깃허브 토큰은 서버에만 있다. 브라우저가 들고 있는 건 비밀번호로 받은 세션뿐이다.
 *
 * 설계상 지키는 세 가지:
 *  1) 쓰기는 한 줄로 직렬화한다. 드래그와 자동저장이 같은 sha로 동시에 PUT 하면 스스로 충돌한다.
 *  2) 변경 요청 사이에 최소 간격을 둔다. 깃허브 2차 rate limit이 분당 80건, 같은 레포는 1초 간격 권고다.
 *  3) 충돌(409/422)은 최신 내용을 다시 읽어 변환을 재적용하고 재시도한다.
 *     에이전트가 본문을 고치는 사이 내가 타임스탬프만 바꿨다면 둘 다 살아남는다.
 */

/** Contents API가 받아주는 본문 상한. */
const MAX_BYTES = 1_000_000

export type FileEntry = { path: string; sha: string }
export type FileContent = { path: string; text: string; sha: string }
export type WriteResult = { path: string; contentSha: string; commitSha: string }

/** 현재 내용을 받아 새 내용을 돌려준다. 파일이 없으면 null이 들어온다. */
export type Transform = (current: string | null) => string

/** 전역 fetch는 window에 묶여 있다. 속성으로 꺼내 부르면 Illegal invocation이 난다. */
const globalFetch = (): typeof fetch => fetch.bind(globalThis)

/** 서버가 주는 상태 코드를 사람이 읽을 말로 바꾼다. */
function explain(status: number): string {
  if (status === 401) return '로그인이 풀렸다. 비밀번호를 다시 넣어라'
  if (status === 403) return '이 경로에는 쓸 수 없다'
  if (status === 404) return '파일을 찾을 수 없다'
  if (status >= 500) return '서버 쪽 문제다. 잠시 뒤 다시 시도해라'
  return `응답 코드 ${status}`
}

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export type Session = { token: string; expiresAt: number }

/** 비밀번호를 세션으로 바꾼다. 비밀번호는 여기서 한 번 쓰이고 저장되지 않는다. */
export async function login(
  apiBase: string,
  password: string,
  fetchImpl: typeof fetch = globalFetch(),
): Promise<Session> {
  const res = await fetchImpl(`${apiBase}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    throw new ApiError(body.error ?? explain(res.status), res.status)
  }
  return (await res.json()) as Session
}

export class ApiClient {
  private apiBase: string
  private session: string
  private opts: { minWriteIntervalMs?: number; fetch?: typeof fetch }

  private shaCache = new Map<string, string>()
  private queue: Promise<unknown> = Promise.resolve()
  private lastWriteAt = 0

  constructor(
    apiBase: string,
    session: string,
    opts: { minWriteIntervalMs?: number; fetch?: typeof fetch } = {},
  ) {
    this.apiBase = apiBase
    this.session = session
    this.opts = opts
  }

  private get http(): typeof fetch {
    return this.opts.fetch ?? globalFetch()
  }

  private async request(path: string, init: RequestInit = {}): Promise<Response> {
    return this.http(`${this.apiBase}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.session}`,
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
      },
    })
  }

  private async json<T>(res: Response, what: string): Promise<T> {
    if (!res.ok) {
      await res.text().catch(() => '')
      throw new ApiError(`${what} 실패 — ${explain(res.status)}`, res.status)
    }
    return (await res.json()) as T
  }

  /** 세션이 아직 살아 있는지 확인한다. */
  async verify(): Promise<boolean> {
    const res = await this.request('/me')
    return res.ok
  }

  /**
   * 디렉터리를 한 번에 읽는다. 구워 넣은 JSON에는 sha가 없으므로,
   * 쓰기 전에 반드시 이걸로 sha를 확보해야 한다.
   */
  async listDir(dir: string): Promise<FileEntry[]> {
    const res = await this.request(`/contents/${dir}`)
    if (res.status === 404) return []
    const items = await this.json<{ path: string; sha: string; type: string }[]>(res, '목록 읽기')
    const files = items.filter((i) => i.type === 'file')
    for (const f of files) this.shaCache.set(f.path, f.sha)
    return files.map(({ path, sha }) => ({ path, sha }))
  }

  async getFile(path: string): Promise<FileContent | null> {
    const res = await this.request(`/contents/${path}`)
    if (res.status === 404) return null
    const file = await this.json<{ content: string; sha: string }>(res, '파일 읽기')
    this.shaCache.set(path, file.sha)
    return { path, text: decodeBase64Utf8(file.content), sha: file.sha }
  }

  /** 쓰기는 전부 이 큐를 통과한다. 동시에 두 개가 날아가는 일이 없다. */
  private enqueue<T>(job: () => Promise<T>): Promise<T> {
    const run = this.queue.then(async () => {
      const gap = (this.opts.minWriteIntervalMs ?? 1000) - (Date.now() - this.lastWriteAt)
      if (gap > 0) await new Promise((r) => setTimeout(r, gap))
      try {
        return await job()
      } finally {
        this.lastWriteAt = Date.now()
      }
    })
    this.queue = run.catch(() => undefined)
    return run
  }

  /**
   * 파일을 변환해 커밋한다. 충돌하면 최신 내용으로 변환을 다시 돌려 재시도한다.
   * `transform`은 반드시 순수해야 한다 — 여러 번 불릴 수 있다.
   */
  updateFile(path: string, transform: Transform, message: string): Promise<WriteResult> {
    return this.enqueue(async () => {
      for (let attempt = 0; attempt < 3; attempt += 1) {
        // 항상 최신 내용을 읽고 변환한다. GET 한 번 값으로 sha 불일치와 덮어쓰기를 동시에 막는다.
        const file = await this.getFile(path)
        const sha = file?.sha
        const current = file?.text ?? null

        const next = transform(current)
        if (utf8ByteLength(next) > MAX_BYTES) {
          throw new ApiError(`본문이 1MB를 넘는다: ${path}`, 413)
        }

        const res = await this.request(`/contents/${path}`, {
          method: 'PUT',
          body: JSON.stringify({
            message,
            content: encodeUtf8Base64(next),
            ...(sha ? { sha } : {}),
          }),
        })

        // 다른 쪽(에이전트나 다른 탭)이 먼저 썼다. 최신 내용으로 다시 시도한다.
        if (res.status === 409 || res.status === 422) {
          this.shaCache.delete(path)
          continue
        }

        const body = await this.json<{ content: { sha: string }; commit: { sha: string } }>(
          res,
          '커밋',
        )
        this.shaCache.set(path, body.content.sha)
        return { path, contentSha: body.content.sha, commitSha: body.commit.sha }
      }
      throw new ApiError(`충돌이 반복돼 저장하지 못했다: ${path}`, 409)
    })
  }

  deleteFile(path: string, message: string): Promise<void> {
    return this.enqueue(async () => {
      const file = await this.getFile(path)
      if (!file) return
      const res = await this.request(`/contents/${path}`, {
        method: 'DELETE',
        body: JSON.stringify({ message, sha: file.sha }),
      })
      await this.json(res, '삭제')
      this.shaCache.delete(path)
    })
  }
}
