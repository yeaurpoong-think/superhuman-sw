const KEY = 'superhuman-sw:token'

/**
 * 기본은 세션 저장이다.
 *
 * github.io 도메인의 localStorage는 경로가 아니라 오리진 단위라,
 * 같은 계정의 다른 Pages 사이트와 저장소를 공유한다. 기본값을 창 닫으면 사라지는 쪽으로 둔다.
 */
export function readToken(): string | null {
  try {
    return sessionStorage.getItem(KEY) ?? localStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function writeToken(token: string, remember: boolean): void {
  try {
    clearToken()
    ;(remember ? localStorage : sessionStorage).setItem(KEY, token)
  } catch {
    // 저장이 막혀도 이번 세션 동안은 메모리로 동작한다.
  }
}

export function clearToken(): void {
  try {
    sessionStorage.removeItem(KEY)
    localStorage.removeItem(KEY)
  } catch {
    // 무시
  }
}
