import { averageLeadTimeDays, inFlightCount } from '../lib/schema'
import type { ProjectRecord } from '../content'

export function Metrics({ projects }: { projects: ProjectRecord[] }) {
  const inFlight = inFlightCount(projects)
  const avg = averageLeadTimeDays(projects)

  return (
    <dl className="flex flex-wrap gap-x-12 gap-y-6">
      <div>
        <dt className="text-xs font-medium tracking-wide text-neutral-500">진행 중</dt>
        <dd className="mt-1 text-4xl font-semibold tabular-nums tracking-tight text-neutral-900">
          {inFlight}
          <span className="ml-1 text-base font-normal text-neutral-400">건</span>
        </dd>
      </div>
      <div>
        <dt className="text-xs font-medium tracking-wide text-neutral-500">리서치 → 콘텐츠 평균</dt>
        <dd className="mt-1 text-4xl font-semibold tabular-nums tracking-tight text-neutral-900">
          {avg === null ? (
            <span className="text-2xl font-normal text-neutral-300">아직 없음</span>
          ) : (
            <>
              {avg}
              <span className="ml-1 text-base font-normal text-neutral-400">일</span>
            </>
          )}
        </dd>
      </div>
    </dl>
  )
}
