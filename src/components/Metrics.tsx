import { averageLeadTimeDays, inFlightCount } from '../lib/schema'
import type { ProjectRecord } from '../content'

export function Metrics({ projects }: { projects: ProjectRecord[] }) {
  const inFlight = inFlightCount(projects)
  const avg = averageLeadTimeDays(projects)

  return (
    <dl className="flex flex-wrap items-end gap-x-12 gap-y-5">
      <div>
        <dt className="label">프로젝트</dt>
        <dd className="mt-1.5 font-display text-4xl leading-none text-ink tabular-nums">
          {projects.length}
          <span className="ml-1.5 font-serif text-sm text-muted">권</span>
        </dd>
      </div>
      <div>
        <dt className="label">읽는 중</dt>
        <dd className="mt-1.5 font-display text-4xl leading-none text-ink tabular-nums">
          {inFlight}
          <span className="ml-1.5 font-serif text-sm text-muted">권</span>
        </dd>
      </div>
      <div>
        <dt className="label">리서치에서 발행까지</dt>
        <dd className="mt-1.5 font-display text-4xl leading-none text-ink tabular-nums">
          {avg === null ? (
            <span className="font-serif text-xl text-rule">아직 없음</span>
          ) : (
            <>
              {avg}
              <span className="ml-1.5 font-serif text-sm text-muted">일</span>
            </>
          )}
        </dd>
      </div>
    </dl>
  )
}
