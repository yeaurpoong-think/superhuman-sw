const KEY = 'superhuman-sw:token'

/**
 * 금고에서 꺼낸 깃허브 토큰을 보관한다.
 *
 * 매번 비밀번호를 치고 600,000회 키 유도를 기다리지 않기 위한 것이다.
 * '기억하기'를 끄면 창을 닫을 때 같이 사라진다.
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
    localStorage.removeItem(KEY)
    sessionStorage.removeItem(KEY)
  } catch {
    // 무시
  }
}
