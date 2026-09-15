import { z } from 'zod'

/**
 * 프로젝트 파일의 frontmatter 계약.
 * 이 파일이 유일한 정의다. 앱과 CI 검증, 에이전트용 문서가 모두 여기서 파생된다.
 */

/** YAML은 따옴표 없는 날짜를 Date 객체로 파싱한다. 어느 쪽으로 들어와도 ISO 문자열로 맞춘다. */
const instant = z.preprocess(
  (v) => (v instanceof Date ? v.toISOString() : v),
  z.iso.datetime({ offset: true }),
)

export const SourceSchema = z.looseObject({
  url: z.url(),
  type: z.enum(['reel', 'carousel', 'article', 'video', 'link']).default('link'),
  title: z.string().optional(),
})

/** 계약에 없는 키는 버리지 않고 그대로 보존한다. 에이전트가 남긴 메모를 앱이 삼키면 안 된다. */
export const ProjectSchema = z.looseObject({
  id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/, 'id는 소문자·숫자·하이픈만 쓴다'),
  title: z.string().min(1),
  rank: z.string().min(1),
  tags: z.array(z.string()).default([]),
  sources: z.array(SourceSchema).default([]),
  post_url: z.url().nullable().default(null),
  researched_at: instant,
  executed_at: instant.nullable().default(null),
  published_at: instant.nullable().default(null),
})

export type Project = z.infer<typeof ProjectSchema>

export type ParseResult =
  | { ok: true; value: Project }
  | { ok: false; file: string; issues: string[] }

/** 절대 예외를 던지지 않는다. 깨진 파일 하나가 보드 전체를 죽이면 안 된다. */
export function parseProject(raw: unknown, file: string): ParseResult {
  const result = ProjectSchema.safeParse(raw)
  if (result.success) return { ok: true, value: result.data }
  return {
    ok: false,
    file,
    issues: result.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`),
  }
}

export type Stage = 'research' | 'execution' | 'content'

export const STAGES: readonly Stage[] = ['research', 'execution', 'content']

export const STAGE_LABELS: Record<Stage, string> = {
  research: '리서치 완료',
  execution: '실행 완료',
  content: '콘텐츠 완료',
}

type Timestamps = Pick<Project, 'researched_at' | 'executed_at' | 'published_at'>

/**
 * 컬럼은 저장하지 않고 타임스탬프에서 유도한다.
 * 상태 문자열을 따로 두면 언젠가 타임스탬프와 어긋나고, 그 순간 평균 소요일이 거짓말을 한다.
 */
export function stageOf(p: Timestamps): Stage {
  if (p.published_at) return 'content'
  if (p.executed_at) return 'execution'
  return 'research'
}

export function countsByStage(list: Timestamps[]): Record<Stage, number> {
  const counts: Record<Stage, number> = { research: 0, execution: 0, content: 0 }
  for (const p of list) counts[stageOf(p)] += 1
  return counts
}

/** 아직 콘텐츠로 끝맺지 못한 것 전부. 지금 지고 가는 짐의 크기다. */
export function inFlightCount(list: Timestamps[]): number {
  return list.filter((p) => !p.published_at).length
}

const DAY_MS = 86_400_000

/** 리서치 완료부터 콘텐츠 발행까지 평균 며칠. 끝낸 게 없으면 null. */
export function averageLeadTimeDays(list: Timestamps[]): number | null {
  const spans = list
    .filter((p) => p.published_at)
    .map((p) => (Date.parse(p.published_at!) - Date.parse(p.researched_at)) / DAY_MS)
    .filter((d) => Number.isFinite(d))
  if (spans.length === 0) return null
  const mean = spans.reduce((a, b) => a + b, 0) / spans.length
  return Math.round(mean * 10) / 10
}

/** rank가 없거나 같을 때도 순서가 흔들리지 않게 id로 갈라준다. */
export function sortByRank<T extends { rank?: string; id: string }>(list: T[]): T[] {
  return [...list].sort((a, b) => {
    const ra = a.rank || '￿'
    const rb = b.rank || '￿'
    if (ra !== rb) return ra < rb ? -1 : 1
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
  })
}
