/**
 * 열어 둔 카드 창들의 자리와 겹침 순서.
 *
 * 카드를 여러 장 동시에 펼쳐 놓고 견주어 보려면, 창이 서로를 완전히 가리지 않아야 하고
 * 화면 밖으로 끌려 나가 사라져서도 안 된다. 그 두 가지를 여기서 지킨다.
 */

export type WindowState = { id: string; x: number; y: number; z: number }

export type Viewport = { width: number; height: number }

/** 새 창이 앞 창을 정확히 덮지 않게 조금씩 어긋나 놓는 간격. */
const CASCADE = 34

/** 몇 장까지 어긋나게 놓고 다시 처음 자리로 돌아올지. */
const CASCADE_CYCLE = 6

/** 끌어도 이만큼은 화면 안에 남긴다. 완전히 사라지면 되찾을 방법이 없다. */
const KEEP_VISIBLE = 180

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max)

export function topZ(list: WindowState[]): number {
  return list.reduce((max, w) => Math.max(max, w.z), 0)
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
export function openWindow(
  list: WindowState[],
  id: string,
  viewport: Viewport,
  width: number,
): WindowState[] {
  if (list.some((w) => w.id === id)) return bringToFront(list, id)

  const step = (list.length % CASCADE_CYCLE) * CASCADE
  const base = Math.max(24, (viewport.width - width) / 2 - CASCADE * 2)
  const { x, y } = clampPosition(base + step, 40 + step, viewport, width)
  return [...list, { id, x, y, z: topZ(list) + 1 }]
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
  width: number,
): WindowState[] {
  const position = clampPosition(x, y, viewport, width)
  return list.map((w) => (w.id === id ? { ...w, ...position } : w))
}

/** 맨 앞 창. Esc는 이 창에만 듣는다. */
export function frontWindow(list: WindowState[]): WindowState | null {
  if (list.length === 0) return null
  return list.reduce((front, w) => (w.z > front.z ? w : front))
}

/** 창 하나의 너비. 자리 계산과 화면 밖으로 못 나가게 막는 데 함께 쓴다. */
export const WINDOW_WIDTH = 760
