import type { ProjectRecord } from '../content'
import { tie } from '../lib/korean'
import { sortByRank } from '../lib/schema'
import { Card } from './Card'

type Props = {
  projects: ProjectRecord[]
  onOpen: (id: string) => void
}

/**
 * 뷰티 인사이트 서가. 서고 맨 아래, 레퍼런스 섹션보다도 아래에 둔다.
 * 뷰티/화장품 업계 트렌드·마케팅·시장 인사이트만 따로 모아 두는 곳이라
 * 칸반을 타지 않는다 — ReferenceShelf와 구조는 같고 범위만 다르다.
 */
export function BeautyInsightShelf({ projects, onOpen }: Props) {
  if (projects.length === 0) return null
  const sorted = sortByRank(projects)

  return (
    <section className="mt-14">
      <header className="flex items-center justify-between gap-3 border border-white/40 bg-leaf/60 px-4 py-3">
        <h2 className="font-display text-[17px] leading-none text-ink md:text-lg">
          Beauty Insight
        </h2>
        <span className="font-display text-xl leading-none text-accent tabular-nums">
          {sorted.length}
        </span>
      </header>
      <p className="mt-3 text-[13px] leading-relaxed text-muted">
        {tie('뷰티·화장품 업계의 트렌드와 마케팅 인사이트만 따로 모아 두는 곳입니다.')}
      </p>
      <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((p) => (
          <Card key={p.id} project={p} onOpen={() => onOpen(p.id)} />
        ))}
      </div>
    </section>
  )
}
