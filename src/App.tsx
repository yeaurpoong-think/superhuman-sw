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

      {route === 'home' ? (
        <>
          {/* 히어로 위에 얹는다. 영상이 메뉴 뒤로 흘러가게 둔다. */}
          <div className="fixed inset-x-0 top-0 z-40 px-5 md:px-10">
            <div className="mx-auto max-w-6xl">
              <SiteNav route={route} onNavigate={navigate} />
            </div>
          </div>
          <Home onNavigate={navigate} />
        </>
      ) : (
        <div className="px-3 pt-2 md:px-6 md:pt-4">
          <div className="mx-auto max-w-6xl px-2 md:px-8">
            <SiteNav route={route} onNavigate={navigate} />
          </div>
          <Library />
        </div>
      )}
    </div>
  )
}
