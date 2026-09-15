import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiClient, login } from './api'
import { decodeBase64Utf8, encodeUtf8Base64 } from './base64'

const BASE = 'https://api.example.workers.dev'

/** 편집 서버를 흉내 낸다. sha가 어긋나면 진짜처럼 409를 준다. */
function fakeServer(initial: Record<string, string> = {}) {
  const files = new Map(Object.entries(initial))
  const shas = new Map<string, string>()
  let seq = 0
  const bump = (path: string) => {
    seq += 1
    shas.set(path, `sha${seq}`)
  }
  for (const path of files.keys()) bump(path)

  const hooks: { beforePut?: () => void } = {}

  /** 다른 작성자(에이전트, 다른 탭)가 먼저 커밋한 상황을 만든다. 내용과 sha가 같이 바뀐다. */
  const externalWrite = (path: string, text: string) => {
    files.set(path, text)
    bump(path)
  }

  const handler = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    const href = typeof url === 'string' ? url : url.toString()
    const path = decodeURIComponent(href.split('/contents/')[1]?.split('?')[0] ?? '')
    const method = init?.method ?? 'GET'
    const json = (status: number, body: unknown) =>
      new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

    if (href.endsWith('/me')) return json(200, { ok: true })

    if (method === 'GET') {
      if (!files.has(path)) return json(404, { error: 'not found' })
      return json(200, { content: encodeUtf8Base64(files.get(path)!), sha: shas.get(path) })
    }

    if (method === 'PUT') {
      hooks.beforePut?.()
      const body = JSON.parse(String(init?.body))
      if (shas.get(path) !== body.sha) return json(409, { error: 'sha does not match' })
      files.set(path, decodeBase64Utf8(body.content))
      bump(path)
      return json(200, { content: { sha: shas.get(path) }, commit: { sha: `commit${seq}` } })
    }

    return json(500, { error: 'unexpected' })
  })

  return {
    handler,
    files,
    hooks,
    externalWrite,
    putCount: () =>
      handler.mock.calls.filter((c) => (c[1] as RequestInit | undefined)?.method === 'PUT').length,
  }
}

const client = (server: ReturnType<typeof fakeServer>) =>
  new ApiClient(BASE, 'session-token', {
    fetch: server.handler as unknown as typeof fetch,
    minWriteIntervalMs: 0,
  })

describe('updateFile', () => {
  let server: ReturnType<typeof fakeServer>

  beforeEach(() => {
    server = fakeServer({ 'content/projects/a.md': '원본' })
  })

  it('없는 파일은 sha 없이 만든다', async () => {
    await client(server).updateFile(
      'content/projects/new.md',
      (cur) => {
        expect(cur).toBeNull()
        return '새 카드'
      },
      '생성',
    )
    expect(server.files.get('content/projects/new.md')).toBe('새 카드')
  })

  it('있는 파일은 현재 내용을 변환에 넘긴다', async () => {
    await client(server).updateFile('content/projects/a.md', (cur) => `${cur}+추가`, '수정')
    expect(server.files.get('content/projects/a.md')).toBe('원본+추가')
  })

  it('읽은 뒤 에이전트가 먼저 쓰면, 그 최신 본문 위에 내 변경을 다시 얹는다', async () => {
    let injected = false
    server.hooks.beforePut = () => {
      if (injected) return
      injected = true
      server.externalWrite('content/projects/a.md', '헤르메스가 다시 쓴 본문')
    }

    await client(server).updateFile('content/projects/a.md', (cur) => `${cur}+내 수정`, '수정')

    // 남의 글을 덮어쓰지 않고 그 위에 얹혔다는 것이 핵심이다.
    expect(server.files.get('content/projects/a.md')).toBe('헤르메스가 다시 쓴 본문+내 수정')
    expect(server.putCount()).toBe(2)
  })

  it('충돌이 계속되면 조용히 실패하지 않고 예외를 던진다', async () => {
    server.hooks.beforePut = () => {
      server.externalWrite('content/projects/a.md', `계속 바뀜 ${Math.random()}`)
    }

    await expect(
      client(server).updateFile('content/projects/a.md', (cur) => `${cur}!`, '수정'),
    ).rejects.toThrow(/충돌/)
  })

  it('1MB를 넘기면 쓰지 않고 막는다', async () => {
    await expect(
      client(server).updateFile('content/projects/a.md', () => '가'.repeat(400_000), '거대'),
    ).rejects.toThrow(/1MB/)
  })

  it('쓰기를 동시에 걸어도 한 줄로 직렬화한다', async () => {
    const gh = client(server)
    await Promise.all([
      gh.updateFile('content/projects/a.md', (cur) => `${cur}|1`, 'a'),
      gh.updateFile('content/projects/a.md', (cur) => `${cur}|2`, 'b'),
      gh.updateFile('content/projects/a.md', (cur) => `${cur}|3`, 'c'),
    ])
    expect(server.files.get('content/projects/a.md')).toBe('원본|1|2|3')
  })

  it('세션을 Bearer로 보낸다', async () => {
    await client(server).verify()
    const headers = server.handler.mock.calls[0][1]?.headers as Record<string, string>
    expect(headers.Authorization).toBe('Bearer session-token')
  })
})

describe('login', () => {
  it('비밀번호를 세션으로 바꾼다', async () => {
    const fetchImpl = vi.fn(
      async (_url: string | URL | Request, _init?: RequestInit) =>
        new Response(JSON.stringify({ token: 't', expiresAt: 123 }), { status: 200 }),
    )
    const s = await login(BASE, 'hunter2', fetchImpl as unknown as typeof fetch)
    expect(s.token).toBe('t')
    expect(JSON.parse(String(fetchImpl.mock.calls[0][1]?.body)).password).toBe('hunter2')
  })

  it('틀리면 서버가 준 이유를 그대로 올린다', async () => {
    const fetchImpl = vi.fn(
      async (_url: string | URL | Request, _init?: RequestInit) =>
        new Response(JSON.stringify({ error: '비밀번호가 다르다' }), { status: 401 }),
    )
    await expect(login(BASE, 'x', fetchImpl as unknown as typeof fetch)).rejects.toThrow(
      '비밀번호가 다르다',
    )
  })
})

describe('전역 fetch 바인딩', () => {
  it('window 바인딩을 잃지 않는다 — 잃으면 브라우저에서 Illegal invocation이 난다', async () => {
    const seenThis: unknown[] = []
    const spy = vi.spyOn(globalThis, 'fetch').mockImplementation(function (this: unknown) {
      seenThis.push(this)
      return Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 }))
    } as unknown as typeof fetch)

    await new ApiClient(BASE, 'session').verify()

    expect(seenThis[0]).toBe(globalThis)
    spy.mockRestore()
  })
})
