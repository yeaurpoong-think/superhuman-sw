import type { ProjectRecord } from '../content'
import { tie } from '../lib/korean'
import { sortByRank } from '../lib/schema'
import { Card } from './Card'

type Props = {
  projects: ProjectRecord[]
  onOpen: (id: string) => void
}

/**
 * 참고 자료 서가. 리서치→실행→콘텐츠 칸반을 타지 않는 카드들을 그냥 쌓아 둔다.
 * 순서를 굳이 드래그로 바꿀 이유가 없어서 (칸이 하나뿐이라 옮길 데가 없다) 정적으로 rank 정렬만 한다.
 */
export function ReferenceShelf({ projects, onOpen }: Props) {
  if (projects.length === 0) return null
  const sorted = sortByRank(projects)

  return (
    <section className="mt-14">
      <header className="flex items-center justify-between gap-3 border border-white/40 bg-leaf/60 px-4 py-3">
        <h2 className="font-display text-[17px] leading-none text-ink md:text-lg">레퍼런스</h2>
        <span className="font-display text-xl leading-none text-accent tabular-nums">
          {sorted.length}
        </span>
      </header>
      <p className="mt-3 text-[13px] leading-relaxed text-muted">
        {tie('리서치 자료로 만든 것들을 실행 여부와 무관하게 쭉 보관해 두는 곳입니다.')}
      </p>
      <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((p) => (
          <Card key={p.id} project={p} onOpen={() => onOpen(p.id)} />
        ))}
      </div>
    </section>
  )
}
