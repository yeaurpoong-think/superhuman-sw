import type { ProjectRecord } from '../content'
import { CATEGORIES, CATEGORY_LABELS, type Category } from '../lib/schema'

export type CategoryFilterValue = Category | 'all' | 'none'

type Props = {
  projects: ProjectRecord[]
  value: CategoryFilterValue
  onChange: (value: CategoryFilterValue) => void
}

/** 목록 서랍. 분류 하나를 골라 그 칸만 꺼내 본다. */
export function CategoryFilter({ projects, value, onChange }: Props) {
  const countOf = (key: CategoryFilterValue) => {
    if (key === 'all') return projects.length
    if (key === 'none') return projects.filter((p) => !p.category).length
    return projects.filter((p) => p.category === key).length
  }

  const items: { key: CategoryFilterValue; label: string }[] = [
    { key: 'all', label: '전체' },
    ...CATEGORIES.map((c) => ({ key: c as CategoryFilterValue, label: CATEGORY_LABELS[c] })),
    { key: 'none', label: '미분류' },
  ]

  return (
    <div className="-mx-1 flex flex-wrap items-center">
      {items.map(({ key, label }) => {
        const count = countOf(key)
        const selected = value === key
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={`mx-1 border-b-2 px-1.5 py-2 whitespace-nowrap transition-colors ${
              selected ? 'border-accent text-ink' : 'border-transparent text-muted hover:text-ink'
            } ${count === 0 && !selected ? 'opacity-40' : ''}`}
          >
            <span className="font-serif text-sm">{label}</span>
            <span className="label ml-1.5 align-middle">{count}</span>
          </button>
        )
      })}
    </div>
  )
}
