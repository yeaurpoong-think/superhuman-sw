import { describe, expect, it } from 'vitest'
import {
  MIN_HEIGHT,
  MIN_WIDTH,
  bringToFront,
  clampPosition,
  closeWindow,
  defaultSize,
  fitToViewport,
  frontWindow,
  moveWindow,
  openWindow,
  resizeFrom,
  resizeWindow,
  type WindowState,
} from './windows'

const VIEW = { width: 1440, height: 900 }

const open = (ids: string[]): WindowState[] =>
  ids.reduce<WindowState[]>((list, id) => openWindow(list, id, VIEW), [])

describe('openWindow', () => {
  it('여러 장을 동시에 펼쳐 둘 수 있다', () => {
    expect(open(['a', 'b', 'c']).map((w) => w.id)).toEqual(['a', 'b', 'c'])
  })

  it('나중에 연 창이 앞에 온다', () => {
    expect(frontWindow(open(['a', 'b']))?.id).toBe('b')
  })

  it('창끼리 정확히 겹치지 않게 어긋나 놓는다', () => {
    const [a, b] = open(['a', 'b'])
    expect(a.x === b.x && a.y === b.y).toBe(false)
  })

  it('이미 열린 카드를 또 누르면 새로 열지 않고 앞으로만 끌어올린다', () => {
    const list = openWindow(open(['a', 'b']), 'a', VIEW)
    expect(list).toHaveLength(2)
    expect(frontWindow(list)?.id).toBe('a')
  })

  it('많이 열어도 첫 창 자리로 돌아와 화면 밖으로 흘러가지 않는다', () => {
    const list = open(['1', '2', '3', '4', '5', '6', '7'])
    expect(list[6].x).toBe(list[0].x)
    expect(list[6].y).toBe(list[0].y)
  })
})

describe('defaultSize', () => {
  it('넓은 화면에서는 읽기 좋은 기본 크기로 연다', () => {
    expect(defaultSize(VIEW)).toEqual({ w: 760, h: 640 })
  })

  it('좁은 화면에서는 화면에 맞춰 줄여서 연다', () => {
    const { w } = defaultSize({ width: 500, height: 700 })
    expect(w).toBe(452)
  })

  it('아무리 좁아도 최소 크기 아래로는 안 간다', () => {
    expect(defaultSize({ width: 200, height: 200 })).toEqual({ w: MIN_WIDTH, h: MIN_HEIGHT })
  })
})

describe('resizeFrom', () => {
  const start = { x: 200, y: 100, w: 600, h: 400 }

  it('오른쪽을 끌면 폭만 늘고 자리는 그대로다', () => {
    expect(resizeFrom(start, { right: true }, 150, 0, VIEW)).toEqual({
      x: 200,
      y: 100,
      w: 750,
      h: 400,
    })
  })

  it('아래를 끌면 높이만 는다', () => {
    expect(resizeFrom(start, { bottom: true }, 0, 120, VIEW).h).toBe(520)
  })

  it('왼쪽을 끌면 자리도 같이 움직여 오른쪽 모서리가 제자리에 있는다', () => {
    const box = resizeFrom(start, { left: true }, -100, 0, VIEW)
    expect(box).toMatchObject({ x: 100, w: 700 })
    expect(box.x + box.w).toBe(start.x + start.w)
  })

  it('위쪽을 끌면 아래 모서리가 제자리에 있는다', () => {
    const box = resizeFrom(start, { top: true }, 0, -80, VIEW)
    expect(box.y + box.h).toBe(start.y + start.h)
  })

  it('모서리를 끌면 두 방향이 함께 바뀐다', () => {
    const box = resizeFrom(start, { right: true, bottom: true }, 100, 100, VIEW)
    expect(box).toMatchObject({ w: 700, h: 500 })
  })

  it('최소 크기 아래로는 줄지 않는다 — 글이 읽히지 않게 되는 지점', () => {
    expect(resizeFrom(start, { right: true }, -9999, 0, VIEW).w).toBe(MIN_WIDTH)
    expect(resizeFrom(start, { bottom: true }, 0, -9999, VIEW).h).toBe(MIN_HEIGHT)
  })

  it('최소 크기에 닿으면 자리도 더는 밀리지 않는다', () => {
    const box = resizeFrom(start, { left: true }, 9999, 0, VIEW)
    expect(box.w).toBe(MIN_WIDTH)
    expect(box.x).toBe(start.x + start.w - MIN_WIDTH)
  })

  it('화면보다 크게는 못 키운다', () => {
    expect(resizeFrom(start, { right: true }, 9999, 0, VIEW).w).toBe(VIEW.width)
  })
})

describe('resizeWindow', () => {
  it('바꾼 크기를 창에 반영한다', () => {
    const list = resizeWindow(open(['a']), 'a', { x: 100, y: 50, w: 900, h: 700 }, VIEW)
    expect(list[0]).toMatchObject({ x: 100, y: 50, w: 900, h: 700 })
  })

  it('다른 창은 건드리지 않는다', () => {
    const before = open(['a', 'b'])
    const after = resizeWindow(before, 'a', { x: 0, y: 0, w: 500, h: 500 }, VIEW)
    expect(after[1]).toEqual(before[1])
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
    expect(frontWindow(bringToFront(open(['a', 'b', 'c']), 'a'))?.id).toBe('a')
  })
})

describe('moveWindow / clampPosition', () => {
  it('끌면 그 자리로 간다', () => {
    expect(moveWindow(open(['a']), 'a', 300, 200, VIEW)[0]).toMatchObject({ x: 300, y: 200 })
  })

  it('왼쪽으로 아무리 끌어도 일부는 화면에 남는다', () => {
    expect(clampPosition(-9999, 100, VIEW, 760).x).toBe(-(760 - 180))
  })

  it('제목줄이 화면 위로 숨지 않는다 — 숨으면 다시 끌 수가 없다', () => {
    expect(clampPosition(100, -500, VIEW, 760).y).toBe(0)
  })
})

describe('fitToViewport', () => {
  it('화면이 줄면 창도 같이 줄여 화면 안에 넣는다', () => {
    const list = fitToViewport(open(['a']), { width: 600, height: 500 })
    expect(list[0].w).toBeLessThanOrEqual(600)
    expect(list[0].h).toBeLessThanOrEqual(500)
  })

  it('줄여도 최소 크기는 지킨다', () => {
    const list = fitToViewport(open(['a']), { width: 200, height: 200 })
    expect(list[0].w).toBe(MIN_WIDTH)
  })
})

describe('frontWindow', () => {
  it('아무것도 없으면 null', () => {
    expect(frontWindow([])).toBeNull()
  })
})
