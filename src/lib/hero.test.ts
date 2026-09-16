import { describe, expect, it } from 'vitest'
import { HERO_BEATS } from '../config'
import { heroCues, ramp } from './hero'

describe('ramp', () => {
  it('구간 밖은 0과 1로 붙는다', () => {
    expect(ramp(0, 0.4, 0.6)).toBe(0)
    expect(ramp(1, 0.4, 0.6)).toBe(1)
  })

  it('구간 한가운데는 0.5다', () => {
    expect(ramp(0.5, 0.4, 0.6)).toBeCloseTo(0.5)
  })
})

describe('heroCues', () => {
  it('맨 처음에는 표제만 보인다', () => {
    const c = heroCues(0)
    expect(c.title).toBe(1)
    expect(c.line).toBe(0)
  })

  it('책이 스쳐 지나가는 순간까지 표제가 남아 있다', () => {
    expect(heroCues(HERO_BEATS.passBy).title).toBe(1)
  })

  it('통로 구간에서는 표제가 빠지고 문장이 들어온다', () => {
    const [start, end] = HERO_BEATS.calm
    const mid = (start + end) / 2
    expect(heroCues(mid).title).toBe(0)
    expect(heroCues(mid).line).toBe(1)
  })

  it('마지막 책이 다가오기 시작하면 문장이 물러난다', () => {
    expect(heroCues(HERO_BEATS.finaleStarts).line).toBe(1)
    expect(heroCues(0.64).line).toBe(0)
  })

  it('종이가 화면을 덮는 구간에는 글자가 하나도 없다', () => {
    const c = heroCues(HERO_BEATS.covered)
    expect(c.title).toBe(0)
    expect(c.line).toBe(0)
  })

  it('어두운 막은 종이가 덮이기 전에 완전히 걷힌다 — 남으면 배경으로 넘어갈 때 밝기가 튄다', () => {
    expect(heroCues(HERO_BEATS.finaleStarts).overlay).toBe(1)
    expect(heroCues(HERO_BEATS.covered).overlay).toBe(0)
    expect(heroCues(1).overlay).toBe(0)
  })

  it('끝에서는 화면에 아무것도 얹히지 않는다 — 정지 배경과 같아야 한다', () => {
    const c = heroCues(1)
    expect(c.title).toBe(0)
    expect(c.line).toBe(0)
    expect(c.overlay).toBe(0)
  })

  it('모든 값이 0과 1 사이를 벗어나지 않는다', () => {
    for (let p = 0; p <= 1.0001; p += 0.02) {
      const c = heroCues(p)
      for (const v of [c.title, c.line, c.overlay]) {
        expect(v).toBeGreaterThanOrEqual(0)
        expect(v).toBeLessThanOrEqual(1)
      }
    }
  })
})
