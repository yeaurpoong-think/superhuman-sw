import { useCallback, useEffect, useState } from 'react'
import { SiteNav } from './components/SiteNav'
import { Home } from './pages/Home'
import { Library } from './pages/Library'
import { ROUTE_TITLES, pathForRoute, routeFromPath, type Route } from './router'

export default function App() {
  const [route, setRoute] = useState<Route>(() => routeFromPath(window.location.pathname))

  /** 뒤로 가기·앞으로 가기에 따라간다. */
  useEffect(() => {
    const sync = () => setRoute(routeFromPath(window.location.pathname))
    window.addEventListener('popstate', sync)
    return () => window.removeEventListener('popstate', sync)
  }, [])

  useEffect(() => {
    document.title = ROUTE_TITLES[route]
  }, [route])

  const navigate = useCallback((to: Route) => {
    window.history.pushState(null, '', pathForRoute(to))
    setRoute(to)
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:border focus:border-rule focus:bg-leaf focus:px-3 focus:py-2 focus:text-sm focus:text-ink"
      >
        본문으로 건너뛰기
      </a>

      {/*
        메뉴는 두 페이지에서 같은 자리에 있어야 한다.
        아래 종이(sheet)와 같은 바깥 여백·같은 최대폭을 써서 좌우 끝을 맞춘다.
        홈에서는 영상 위에 떠 있고, 서고에서는 종이 위에 놓인다는 것만 다르다.
      */}
      <div className={route === 'home' ? 'fixed inset-x-0 top-0 z-40' : ''}>
        <div className="px-3 md:px-6">
          <div className="mx-auto max-w-6xl">
            <SiteNav route={route} onNavigate={navigate} />
          </div>
        </div>
      </div>

      {route === 'home' ? <Home onNavigate={navigate} /> : <Library />}
    </div>
  )
}
