import { describe, expect, it } from 'vitest'
import {
  bringToFront,
  clampPosition,
  closeWindow,
  frontWindow,
  moveWindow,
  openWindow,
  type WindowState,
} from './windows'

const VIEW = { width: 1440, height: 900 }
const W = 760

const open = (ids: string[]): WindowState[] =>
  ids.reduce<WindowState[]>((list, id) => openWindow(list, id, VIEW, W), [])

describe('openWindow', () => {
  it('여러 장을 동시에 펼쳐 둘 수 있다', () => {
    expect(open(['a', 'b', 'c']).map((w) => w.id)).toEqual(['a', 'b', 'c'])
  })

  it('나중에 연 창이 앞에 온다', () => {
    const list = open(['a', 'b'])
    expect(frontWindow(list)?.id).toBe('b')
  })

  it('창끼리 정확히 겹치지 않게 어긋나 놓는다', () => {
    const [a, b] = open(['a', 'b'])
    expect(a.x === b.x && a.y === b.y).toBe(false)
  })

  it('이미 열린 카드를 또 누르면 새로 열지 않고 앞으로만 끌어올린다', () => {
    const list = openWindow(open(['a', 'b']), 'a', VIEW, W)
    expect(list).toHaveLength(2)
    expect(frontWindow(list)?.id).toBe('a')
  })

  it('많이 열어도 첫 창 자리로 돌아와 화면 밖으로 흘러가지 않는다', () => {
    const list = open(['1', '2', '3', '4', '5', '6', '7'])
    expect(list[6].x).toBe(list[0].x)
    expect(list[6].y).toBe(list[0].y)
  })
})

describe('closeWindow', () => {
  it('하나만 닫고 나머지는 그대로 둔다', () => {
    expect(closeWindow(open(['a', 'b', 'c']), 'b').map((w) => w.id)).toEqual(['a', 'c'])
  })

  it('없는 걸 닫아도 터지지 않는다', () => {
    expect(closeWindow(open(['a']), 'zzz')).toHaveLength(1)
  })
})

describe('bringToFront', () => {
  it('이미 맨 앞이면 아무것도 바꾸지 않는다 — 불필요한 다시 그리기를 막는다', () => {
    const list = open(['a', 'b'])
    expect(bringToFront(list, 'b')).toBe(list)
  })

  it('뒤에 있던 창을 앞으로 올린다', () => {
    const list = bringToFront(open(['a', 'b', 'c']), 'a')
    expect(frontWindow(list)?.id).toBe('a')
  })
})

describe('moveWindow / clampPosition', () => {
  it('끌면 그 자리로 간다', () => {
    const list = moveWindow(open(['a']), 'a', 300, 200, VIEW, W)
    expect(list[0]).toMatchObject({ x: 300, y: 200 })
  })

  it('왼쪽으로 아무리 끌어도 일부는 화면에 남는다', () => {
    const { x } = clampPosition(-9999, 100, VIEW, W)
    expect(x).toBe(-(W - 180))
  })

  it('오른쪽으로 끌어도 붙잡을 자리가 남는다', () => {
    const { x } = clampPosition(9999, 100, VIEW, W)
    expect(x).toBe(VIEW.width - 180)
  })

  it('제목줄이 화면 위로 숨지 않는다 — 숨으면 다시 끌 수가 없다', () => {
    expect(clampPosition(100, -500, VIEW, W).y).toBe(0)
  })

  it('아래로도 완전히 빠지지 않는다', () => {
    expect(clampPosition(100, 9999, VIEW, W).y).toBe(VIEW.height - 56)
  })
})

describe('frontWindow', () => {
  it('아무것도 없으면 null', () => {
    expect(frontWindow([])).toBeNull()
  })
})
