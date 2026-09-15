import { describe, expect, it } from 'vitest'
import { fromDateInput, toDateInput } from './dates'

describe('날짜 입력 왕복', () => {
  it('고른 날짜가 그대로 다시 보인다', () => {
    expect(toDateInput(fromDateInput('2026-09-15'))).toBe('2026-09-15')
  })

  it('연말·연초에도 날짜가 하루 밀리지 않는다', () => {
    for (const day of ['2026-01-01', '2026-12-31', '2026-02-28']) {
      expect(toDateInput(fromDateInput(day))).toBe(day)
    }
  })

  it('비우면 null이 된다 — 그 단계를 지운다는 뜻', () => {
    expect(fromDateInput('')).toBeNull()
  })

  it('값이 없으면 빈 칸으로 보여준다', () => {
    expect(toDateInput(null)).toBe('')
    expect(toDateInput(undefined)).toBe('')
  })

  it('망가진 값에도 죽지 않는다', () => {
    expect(toDateInput('말도 안 되는 값')).toBe('')
    expect(fromDateInput('2026-13')).toBeNull()
  })

  it('자동으로 찍힌 시각도 같은 날짜로 읽는다', () => {
    const noon = new Date(2026, 8, 15, 12, 30).toISOString()
    expect(toDateInput(noon)).toBe('2026-09-15')
  })
})
