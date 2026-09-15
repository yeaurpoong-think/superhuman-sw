/**
 * superhuman-sw 편집 서버.
 *
 * 깃허브 토큰은 여기에만 있고 브라우저로는 절대 나가지 않는다.
 * 사이트는 비밀번호로 세션을 받고, 그 세션으로 이 서버에 글을 맡긴다.
 *
 * 쓰기는 content/ 아래 마크다운으로만 제한한다.
 * 세션이 새더라도 사이트 코드나 배포 설정을 건드릴 수는 없어야 한다.
 */

type Env = {
  GITHUB_TOKEN: string
  ADMIN_PASSWORD: string
  SESSION_SECRET: string
  GITHUB_OWNER: string
  GITHUB_REPO: string
  GITHUB_BRANCH: string
  ALLOWED_ORIGIN: string
}

const SESSION_TTL_MS = 90 * 24 * 60 * 60 * 1000
const WRITABLE = /^content\/[A-Za-z0-9가-힣._\-/]+\.md$/

const enc = new TextEncoder()

async function hmac(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message))
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

/** 길이와 내용 어느 쪽으로도 시간 차가 새지 않게 비교한다. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

async function issueSession(env: Env): Promise<{ token: string; expiresAt: number }> {
  const expiresAt = Date.now() + SESSION_TTL_MS
  const token = `${expiresAt}.${await hmac(env.SESSION_SECRET, String(expiresAt))}`
  return { token, expiresAt }
}

async function sessionValid(env: Env, token: string | null): Promise<boolean> {
  if (!token) return false
  const [expRaw, sig] = token.split('.')
  const exp = Number(expRaw)
  if (!Number.isFinite(exp) || exp < Date.now() || !sig) return false
  return timingSafeEqual(sig, await hmac(env.SESSION_SECRET, expRaw))
}

function cors(env: Env, extra: HeadersInit = {}): HeadersInit {
  return {
    'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, PUT, DELETE, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
    ...extra,
  }
}

const json = (env: Env, body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: cors(env, { 'Content-Type': 'application/json' }),
  })

const bearer = (req: Request) => req.headers.get('Authorization')?.replace(/^Bearer /, '') ?? null

async function github(env: Env, path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}${path}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      'User-Agent': 'superhuman-sw-worker',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    },
  })
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors(env) })
    }

    if (url.pathname === '/login' && request.method === 'POST') {
      const { password } = (await request.json().catch(() => ({}))) as { password?: string }
      const given = await hmac(env.SESSION_SECRET, password ?? '')
      const expected = await hmac(env.SESSION_SECRET, env.ADMIN_PASSWORD)
      if (!timingSafeEqual(given, expected)) {
        // 무차별 대입을 느리게 만든다. Workers 무료 플랜에는 상태 저장 제한 장치가 없다.
        await new Promise((r) => setTimeout(r, 1000))
        return json(env, { error: '비밀번호가 다르다' }, 401)
      }
      return json(env, await issueSession(env))
    }

    if (url.pathname === '/me') {
      const ok = await sessionValid(env, bearer(request))
      return json(env, { ok }, ok ? 200 : 401)
    }

    if (url.pathname.startsWith('/contents/')) {
      if (!(await sessionValid(env, bearer(request)))) {
        return json(env, { error: '로그인이 필요하다' }, 401)
      }

      const path = decodeURIComponent(url.pathname.slice('/contents/'.length))
      const ref = url.searchParams.get('ref') ?? env.GITHUB_BRANCH

      if (request.method === 'GET') {
        const res = await github(env, `/contents/${path}?ref=${encodeURIComponent(ref)}`)
        return new Response(res.body, { status: res.status, headers: cors(env, { 'Content-Type': 'application/json' }) })
      }

      if (request.method === 'PUT' || request.method === 'DELETE') {
        if (!WRITABLE.test(path)) {
          return json(env, { error: `이 경로에는 쓸 수 없다: ${path}` }, 403)
        }
        const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
        const res = await github(env, `/contents/${path}`, {
          method: request.method,
          body: JSON.stringify({ ...body, branch: env.GITHUB_BRANCH }),
        })
        return new Response(res.body, { status: res.status, headers: cors(env, { 'Content-Type': 'application/json' }) })
      }
    }

    return json(env, { error: 'not found' }, 404)
  },
}
