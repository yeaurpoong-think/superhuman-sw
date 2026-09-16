import { ROUTE_TITLES, pathForRoute, type Route } from '../router'

type Props = {
  route: Route
  onNavigate: (route: Route) => void
}

const ITEMS: { route: Route; label: string }[] = [
  { route: 'home', label: 'Home' },
  { route: 'library', label: 'Library' },
]

/** 두 페이지 모두 어두운 바탕 위에 놓이므로 밝은 글씨로 고정한다. */
export function SiteNav({ route, onNavigate }: Props) {

  const go = (to: Route) => (e: React.MouseEvent) => {
    // 새 탭으로 열려는 클릭은 브라우저에 맡긴다.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
    e.preventDefault()
    onNavigate(to)
  }

  return (
    <nav
      aria-label="사이트 메뉴"
      className="flex items-center justify-between gap-6 px-1 py-4 text-paper/70"
    >
      <a
        href={pathForRoute('home')}
        onClick={go('home')}
        className="font-display text-[15px] tracking-tight whitespace-nowrap text-paper"
      >
        SW Project Library
      </a>

      <ul className="flex items-center gap-1">
        {ITEMS.map((item) => {
          const current = item.route === route
          return (
            <li key={item.route}>
              <a
                href={pathForRoute(item.route)}
                onClick={go(item.route)}
                aria-current={current ? 'page' : undefined}
                title={ROUTE_TITLES[item.route]}
                className={`label flex min-h-11 items-center border-b-2 px-3 ${
                  current ? 'border-paper text-paper' : 'border-transparent hover:text-paper'
                }`}
              >
                {item.label}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
