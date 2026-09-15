import type { ProjectRecord } from '../content'
import { STAGES, STAGE_LABELS, countsByStage, sortByRank, stageOf } from '../lib/schema'
import { Card } from './Card'

export function Board({ projects }: { projects: ProjectRecord[] }) {
  const counts = countsByStage(projects)

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {STAGES.map((stage) => {
        const cards = sortByRank(projects.filter((p) => stageOf(p) === stage))
        return (
          <section key={stage} className="rounded-xl bg-neutral-100/70 p-3">
            <header className="flex items-baseline justify-between px-1 pb-3">
              <h2 className="text-sm font-medium text-neutral-700">{STAGE_LABELS[stage]}</h2>
              <span className="text-sm tabular-nums text-neutral-400">{counts[stage]}</span>
            </header>
            <div className="flex flex-col gap-2.5">
              {cards.map((p) => (
                <Card key={p.id} project={p} />
              ))}
              {cards.length === 0 && (
                <p className="px-1 py-6 text-center text-xs text-neutral-400">비어 있음</p>
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}
