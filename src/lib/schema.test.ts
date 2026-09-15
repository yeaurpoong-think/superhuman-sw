import { describe, expect, it } from 'vitest'
import {
  averageLeadTimeDays,
  countsByStage,
  inFlightCount,
  parseProject,
  sortByRank,
  stageOf,
} from './schema'

const base = {
  id: 'hook-teardown',
  title: '인스타 훅 구조 분해',
  rank: 'a0',
  researched_at: '2026-09-01T00:00:00Z',
}

const ok = (over: Record<string, unknown> = {}) => parseProject({ ...base, ...over }, 'x.md')

describe('parseProject', () => {
  it('최소 필드만 있어도 통과하고 나머지는 기본값으로 채운다', () => {
    const r = ok()
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.value.tags).toEqual([])
    expect(r.value.sources).toEqual([])
    expect(r.value.post_url).toBeNull()
    expect(r.value.executed_at).toBeNull()
    expect(r.value.published_at).toBeNull()
  })

  it('YAML이 Date로 파싱한 타임스탬프를 ISO 문자열로 정규화한다', () => {
    const r = ok({ researched_at: new Date('2026-09-01T00:00:00Z') })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.value.researched_at).toBe('2026-09-01T00:00:00.000Z')
  })

  it('id에 대문자나 공백이 있으면 거부한다', () => {
    expect(ok({ id: 'Hook Teardown' }).ok).toBe(false)
  })

  it('researched_at이 없으면 거부한다', () => {
    const r = parseProject({ id: 'a', title: 'b', rank: 'a0' }, 'x.md')
    expect(r.ok).toBe(false)
  })

  it('실패해도 예외를 던지지 않고 파일명과 사유를 돌려준다', () => {
    const r = parseProject({ id: 'Bad Id' }, 'content/projects/bad.md')
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.file).toBe('content/projects/bad.md')
    expect(r.issues.length).toBeGreaterThan(0)
  })

  it('계약에 없는 키는 버리지 않고 보존한다', () => {
    const r = ok({ note: '헤르메스가 남긴 메모' })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect((r.value as Record<string, unknown>).note).toBe('헤르메스가 남긴 메모')
  })
})

describe('stageOf', () => {
  const p = (over: Record<string, unknown>) => {
    const r = ok(over)
    if (!r.ok) throw new Error('fixture invalid')
    return r.value
  }

  it('executed_at이 없으면 리서치 완료', () => {
    expect(stageOf(p({}))).toBe('research')
  })

  it('executed_at만 있으면 실행 완료', () => {
    expect(stageOf(p({ executed_at: '2026-09-04T00:00:00Z' }))).toBe('execution')
  })

  it('published_at이 있으면 executed_at이 비어 있어도 콘텐츠 완료', () => {
    expect(stageOf(p({ published_at: '2026-09-09T00:00:00Z' }))).toBe('content')
  })
})

describe('지표', () => {
  const p = (over: Record<string, unknown>) => {
    const r = ok(over)
    if (!r.ok) throw new Error('fixture invalid')
    return r.value
  }

  const sample = [
    p({ id: 'a' }),
    p({ id: 'b', executed_at: '2026-09-04T00:00:00Z' }),
    p({
      id: 'c',
      executed_at: '2026-09-04T00:00:00Z',
      published_at: '2026-09-06T00:00:00Z',
    }),
  ]

  it('컬럼별로 개수를 센다', () => {
    expect(countsByStage(sample)).toEqual({ research: 1, execution: 1, content: 1 })
  })

  it('진행 중은 콘텐츠 완료가 아닌 전부다', () => {
    expect(inFlightCount(sample)).toBe(2)
  })

  it('리서치→콘텐츠 평균을 일 단위로 낸다', () => {
    expect(averageLeadTimeDays(sample)).toBe(5)
  })

  it('완료된 게 하나도 없으면 null을 준다', () => {
    expect(averageLeadTimeDays([p({ id: 'a' })])).toBeNull()
  })
})

describe('sortByRank', () => {
  const p = (over: Record<string, unknown>) => {
    const r = ok(over)
    if (!r.ok) throw new Error('fixture invalid')
    return r.value
  }

  it('rank 사전순으로 정렬한다', () => {
    const sorted = sortByRank([p({ id: 'c', rank: 'a2' }), p({ id: 'a', rank: 'a0' }), p({ id: 'b', rank: 'a1' })])
    expect(sorted.map((x) => x.id)).toEqual(['a', 'b', 'c'])
  })

  it('rank가 같으면 id로 갈라 순서를 안정시킨다', () => {
    const sorted = sortByRank([p({ id: 'b', rank: 'a0' }), p({ id: 'a', rank: 'a0' })])
    expect(sorted.map((x) => x.id)).toEqual(['a', 'b'])
  })
})
