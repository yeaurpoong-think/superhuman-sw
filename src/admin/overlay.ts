import type { ProjectRecord } from '../content'

/**
 * 저장은 커밋이고, 커밋이 사이트에 반영되기까지 1~2분 걸린다.
 * 그 사이를 메우는 임시 덮개. 배포가 따라잡으면 스스로 사라진다.
 */

export type OverlayEntry = {
  /** null이면 삭제됨 */
  record: ProjectRecord | null
  commitSha: string | null
  at: number
}

export type Overlay = Record<string, OverlayEntry>

const KEY = 'superhuman-sw:overlay'
/** 저장이 끝내 실패했더라도 오버레이가 영원히 화면을 속이지는 못하게 한다. */
const MAX_AGE_MS = 6 * 60 * 60 * 1000

/** 오버레이와 구워진 내용이 같은지 볼 때 쓰는 필드. 본문과 순서, 시각이면 충분하다. */
const SIGNIFICANT = ['title', 'rank', 'body', 'executed_at', 'published_at', 'post_url'] as const

const sameAsBaked = (a: ProjectRecord, b: ProjectRecord) =>
  SIGNIFICANT.every((k) => a[k] === b[k])

export function applyOverlay(baked: ProjectRecord[], overlay: Overlay): ProjectRecord[] {
  const byId = new Map(baked.map((p) => [p.id, p]))
  for (const [id, entry] of Object.entries(overlay)) {
    if (entry.record === null) byId.delete(id)
    else byId.set(id, entry.record)
  }
  return [...byId.values()]
}

export function pruneOverlay(
  overlay: Overlay,
  baked: ProjectRecord[],
  buildSha: string,
  now: number = Date.now(),
): Overlay {
  const byId = new Map(baked.map((p) => [p.id, p]))
  const kept: Overlay = {}

  for (const [id, entry] of Object.entries(overlay)) {
    if (now - entry.at > MAX_AGE_MS) continue
    if (entry.commitSha && entry.commitSha === buildSha) continue

    const bakedRecord = byId.get(id)
    if (entry.record === null) {
      if (!bakedRecord) continue
    } else if (bakedRecord && sameAsBaked(entry.record, bakedRecord)) {
      continue
    }
    kept[id] = entry
  }
  return kept
}

export function readOverlay(): Overlay {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Overlay) : {}
  } catch {
    return {}
  }
}

export function writeOverlay(overlay: Overlay): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(overlay))
  } catch {
    // 사생활 보호 모드 등에서 저장이 막혀도 앱은 계속 돌아가야 한다.
  }
}
