import type { ProjectRecord } from '../content'
import { CATEGORIES, CATEGORY_LABELS, type Category } from '../lib/schema'

export type CategoryFilterValue = Category | 'all' | 'none'

type Props = {
  projects: ProjectRecord[]
  value: CategoryFilterValue
  onChange: (value: CategoryFilterValue) => void
}

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
    <div className="mb-5 flex flex-wrap gap-1.5">
      {items.map(({ key, label }) => {
        const count = countOf(key)
        const selected = value === key
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={`rounded-full border px-3 py-1 text-xs whitespace-nowrap transition ${
              selected
                ? 'border-neutral-900 bg-neutral-900 text-white'
                : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
            } ${count === 0 && !selected ? 'opacity-40' : ''}`}
          >
            {label}
            <span className={`ml-1.5 tabular-nums ${selected ? 'text-neutral-400' : 'text-neutral-400'}`}>
              {count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
