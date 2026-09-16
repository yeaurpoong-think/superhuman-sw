import { describe, expect, it } from 'vitest'
import { BASE, pathForRoute, routeFromPath } from './router'

describe('routeFromPath', () => {
  it('맨 위 주소는 홈이다', () => {
    expect(routeFromPath(BASE)).toBe('home')
    expect(routeFromPath('/superhuman-sw')).toBe('home')
  })

  it('/library 는 서고다', () => {
    expect(routeFromPath('/superhuman-sw/library')).toBe('library')
  })

  it('끝에 슬래시가 붙어도 같게 본다', () => {
    expect(routeFromPath('/superhuman-sw/library/')).toBe('library')
  })

  it('모르는 주소는 홈으로 보낸다 — 빈 화면을 보여주지 않는다', () => {
    expect(routeFromPath('/superhuman-sw/없는페이지')).toBe('home')
  })

  it('개발 서버처럼 base 가 빠진 주소도 읽는다', () => {
    expect(routeFromPath('/library')).toBe('library')
  })
})

describe('pathForRoute', () => {
  it('주소를 되돌려 만든다', () => {
    expect(pathForRoute('home')).toBe(BASE)
    expect(pathForRoute('library')).toBe(`${BASE}library/`)
  })

  it('만든 주소를 다시 읽으면 같은 화면이 나온다', () => {
    for (const route of ['home', 'library'] as const) {
      expect(routeFromPath(pathForRoute(route))).toBe(route)
    }
  })
})
