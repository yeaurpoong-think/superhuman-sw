import type { Session } from '../lib/api'

const KEY = 'superhuman-sw:session'

/**
 * 비밀번호로 받은 세션을 보관한다.
 *
 * 깃허브 토큰이 아니라 이 사이트 전용 세션이고 만료가 있으므로,
 * 기본값을 '이 기기에 기억'으로 둔다. 매번 비밀번호를 묻지 않기 위한 것이다.
 */
export function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(KEY) ?? sessionStorage.getItem(KEY)
    if (!raw) return null
    const session = JSON.parse(raw) as Session
    if (!session.token || session.expiresAt < Date.now()) return null
    return session
  } catch {
    return null
  }
}

export function writeSession(session: Session, remember: boolean): void {
  try {
    clearSession()
    ;(remember ? localStorage : sessionStorage).setItem(KEY, JSON.stringify(session))
  } catch {
    // 저장이 막혀도 이번 세션 동안은 메모리로 동작한다.
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(KEY)
    sessionStorage.removeItem(KEY)
  } catch {
    // 무시
  }
}
