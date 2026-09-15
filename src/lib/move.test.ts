import { describe, expect, it } from 'vitest'
import { clearedByMove, patchForMove, rankBetween } from './move'

const NOW = '2026-09-15T10:00:00.000Z'
const now = () => new Date(NOW)

const card = {
  researched_at: '2026-09-01T00:00:00Z',
  executed_at: null as string | null,
  published_at: null as string | null,
}

describe('patchForMove', () => {
  it('실행 완료로 옮기면 실행 시각이 지금으로 찍힌다', () => {
    expect(patchForMove(card, 'execution', 'a1', now())).toEqual({
      rank: 'a1',
      executed_at: NOW,
      published_at: null,
    })
  })

  it('이미 찍힌 시각은 덮어쓰지 않는다', () => {
    const done = { ...card, executed_at: '2026-09-04T00:00:00Z' }
    expect(patchForMove(done, 'execution', 'a1', now()).executed_at).toBe('2026-09-04T00:00:00Z')
  })

  it('콘텐츠 완료로 옮기면 발행 시각이 찍힌다', () => {
    const p = patchForMove({ ...card, executed_at: '2026-09-04T00:00:00Z' }, 'content', 'a1', now())
    expect(p.published_at).toBe(NOW)
    expect(p.executed_at).toBe('2026-09-04T00:00:00Z')
  })

  it('실행을 건너뛰고 콘텐츠로 가도 실행 시각을 지어내지 않는다', () => {
    expect(patchForMove(card, 'content', 'a1', now()).executed_at).toBeNull()
  })

  it('리서치로 되돌리면 뒤쪽 시각이 전부 지워진다', () => {
    const done = { ...card, executed_at: '2026-09-04T00:00:00Z', published_at: '2026-09-09T00:00:00Z' }
    expect(patchForMove(done, 'research', 'a1', now())).toEqual({
      rank: 'a1',
      executed_at: null,
      published_at: null,
    })
  })

  it('같은 칸 안에서 순서만 바꾸면 시각은 그대로다', () => {
    const done = { ...card, executed_at: '2026-09-04T00:00:00Z' }
    expect(patchForMove(done, 'execution', 'a5', now())).toEqual({
      rank: 'a5',
      executed_at: '2026-09-04T00:00:00Z',
      published_at: null,
    })
  })
})

describe('clearedByMove', () => {
  it('되돌릴 때 사라질 값을 미리 알려준다 — 확인창에 쓴다', () => {
    const done = { ...card, executed_at: '2026-09-04T00:00:00Z', published_at: '2026-09-09T00:00:00Z' }
    expect(clearedByMove(done, 'research')).toEqual(['실행 완료', '콘텐츠 완료'])
  })

  it('앞으로 갈 때는 사라지는 게 없다', () => {
    expect(clearedByMove(card, 'execution')).toEqual([])
  })
})

describe('rankBetween', () => {
  it('두 키 사이에 들어가는 키를 만든다', () => {
    const mid = rankBetween('a0', 'a1')
    expect(mid > 'a0').toBe(true)
    expect(mid < 'a1').toBe(true)
  })

  it('맨 앞과 맨 뒤도 처리한다', () => {
    expect(rankBetween(null, 'a1') < 'a1').toBe(true)
    expect(rankBetween('a1', null) > 'a1').toBe(true)
    expect(typeof rankBetween(null, null)).toBe('string')
  })
})
