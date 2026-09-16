/**
 * 열어 둔 카드 창들의 자리, 크기, 겹침 순서.
 *
 * 카드를 여러 장 동시에 펼쳐 놓고 견주어 보려면 세 가지가 필요하다.
 * 창이 서로를 완전히 가리지 않을 것, 화면 밖으로 끌려 나가 사라지지 않을 것,
 * 그리고 글이 읽히는 크기로 바꿀 수 있을 것.
 */

export type WindowState = { id: string; x: number; y: number; z: number; w: number; h: number }

export type Viewport = { width: number; height: number }

export type Box = { x: number; y: number; w: number; h: number }

/** 어느 가장자리를 잡아 끄는지. 모서리는 두 방향이 함께 켜진다. */
export type ResizeEdge = { left?: boolean; right?: boolean; top?: boolean; bottom?: boolean }

/** 새 창이 앞 창을 정확히 덮지 않게 조금씩 어긋나 놓는 간격. */
const CASCADE = 34

/** 몇 장까지 어긋나게 놓고 다시 처음 자리로 돌아올지. */
const CASCADE_CYCLE = 6

/** 끌어도 이만큼은 화면 안에 남긴다. 완전히 사라지면 되찾을 방법이 없다. */
const KEEP_VISIBLE = 180

/** 이보다 작아지면 글이 한 줄에 두세 글자씩 끊겨 읽을 수 없다. */
export const MIN_WIDTH = 340
export const MIN_HEIGHT = 240

const DEFAULT_WIDTH = 760
const DEFAULT_HEIGHT = 640

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max)

export function topZ(list: WindowState[]): number {
  return list.reduce((max, w) => Math.max(max, w.z), 0)
}

/** 처음 열 때의 크기. 화면이 작으면 화면에 맞춰 줄인다. */
export function defaultSize(viewport: Viewport): { w: number; h: number } {
  return {
    w: clamp(viewport.width - 48, MIN_WIDTH, DEFAULT_WIDTH),
    h: clamp(viewport.height - 80, MIN_HEIGHT, DEFAULT_HEIGHT),
  }
}

export function clampPosition(
  x: number,
  y: number,
  viewport: Viewport,
  width: number,
): { x: number; y: number } {
  return {
    x: clamp(x, -(width - KEEP_VISIBLE), viewport.width - KEEP_VISIBLE),
    y: clamp(y, 0, Math.max(0, viewport.height - 56)),
  }
}

/** 이미 열려 있으면 새로 열지 않고 앞으로만 끌어올린다. */
export function openWindow(list: WindowState[], id: string, viewport: Viewport): WindowState[] {
  if (list.some((w) => w.id === id)) return bringToFront(list, id)

  const { w, h } = defaultSize(viewport)
  const step = (list.length % CASCADE_CYCLE) * CASCADE
  const base = Math.max(24, (viewport.width - w) / 2 - CASCADE * 2)
  const { x, y } = clampPosition(base + step, 40 + step, viewport, w)
  return [...list, { id, x, y, w, h, z: topZ(list) + 1 }]
}

export function closeWindow(list: WindowState[], id: string): WindowState[] {
  return list.filter((w) => w.id !== id)
}

export function bringToFront(list: WindowState[], id: string): WindowState[] {
  const target = list.find((w) => w.id === id)
  if (!target || target.z === topZ(list)) return list
  const next = topZ(list) + 1
  return list.map((w) => (w.id === id ? { ...w, z: next } : w))
}

export function moveWindow(
  list: WindowState[],
  id: string,
  x: number,
  y: number,
  viewport: Viewport,
): WindowState[] {
  return list.map((w) => (w.id === id ? { ...w, ...clampPosition(x, y, viewport, w.w) } : w))
}

/**
 * 가장자리를 끌었을 때의 새 상자.
 *
 * 왼쪽·위쪽을 끌면 자리도 같이 움직여야 반대편 모서리가 제자리에 붙어 있는 것처럼 보인다.
 * 최소 크기에 닿으면 더 줄지 않고, 자리도 더 밀리지 않는다.
 */
export function resizeFrom(
  start: Box,
  edge: ResizeEdge,
  dx: number,
  dy: number,
  viewport: Viewport,
): Box {
  let { x, y, w, h } = start

  if (edge.right) w = clamp(start.w + dx, MIN_WIDTH, viewport.width)
  if (edge.bottom) h = clamp(start.h + dy, MIN_HEIGHT, viewport.height)

  if (edge.left) {
    w = clamp(start.w - dx, MIN_WIDTH, viewport.width)
    x = start.x + (start.w - w)
  }
  if (edge.top) {
    h = clamp(start.h - dy, MIN_HEIGHT, viewport.height)
    y = Math.max(0, start.y + (start.h - h))
  }

  return { x, y, w, h }
}

export function resizeWindow(
  list: WindowState[],
  id: string,
  box: Box,
  viewport: Viewport,
): WindowState[] {
  return list.map((win) => {
    if (win.id !== id) return win
    const w = clamp(box.w, MIN_WIDTH, viewport.width)
    const h = clamp(box.h, MIN_HEIGHT, viewport.height)
    return { ...win, w, h, ...clampPosition(box.x, box.y, viewport, w) }
  })
}

/** 맨 앞 창. Esc는 이 창에만 듣는다. */
export function frontWindow(list: WindowState[]): WindowState | null {
  if (list.length === 0) return null
  return list.reduce((front, w) => (w.z > front.z ? w : front))
}

/** 화면이 줄었을 때 창을 다시 화면 안으로 끌어당긴다. */
export function fitToViewport(list: WindowState[], viewport: Viewport): WindowState[] {
  return list.map((win) => {
    const w = clamp(win.w, MIN_WIDTH, Math.max(MIN_WIDTH, viewport.width))
    const h = clamp(win.h, MIN_HEIGHT, Math.max(MIN_HEIGHT, viewport.height))
    return { ...win, w, h, ...clampPosition(win.x, win.y, viewport, w) }
  })
}
