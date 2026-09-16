/**
 * 두 페이지짜리 아주 작은 라우터.
 *
 * 깃허브 페이지스는 서버가 없으므로 어떤 주소로 들어와도 404.html이 뜨고,
 * 그 안에서 이 앱이 켜져 주소를 읽어 화면을 고른다. (vite.config.ts 에서 index.html을 404.html로 복사한다)
 */

export type Route = 'home' | 'library'

/** 사이트가 놓인 위치. vite.config.ts 의 base 와 같아야 한다. */
export const BASE = '/superhuman-sw/'

const strip = (path: string) => {
  const withoutBase = path.startsWith(BASE) ? path.slice(BASE.length) : path.replace(/^\//, '')
  return withoutBase.replace(/\/+$/, '')
}

export function routeFromPath(pathname: string): Route {
  return strip(pathname) === 'library' ? 'library' : 'home'
}

export function pathForRoute(route: Route): string {
  // 끝 슬래시를 붙여야 빌드가 뽑아 둔 library/index.html 과 주소가 맞는다.
  return route === 'library' ? `${BASE}library/` : BASE
}

export const ROUTE_TITLES: Record<Route, string> = {
  home: 'SW Project Library',
  library: '서고 · SW Project Library',
}
