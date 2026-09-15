import { generateKeyBetween } from 'fractional-indexing'
import { STAGE_LABELS, type Stage } from './schema'

/**
 * 카드를 옮길 때 무엇을 고칠지 계산한다.
 *
 * 컬럼을 따로 저장하지 않으므로, '옮긴다'는 곧 타임스탬프를 찍거나 지우는 일이다.
 * 없는 시각을 지어내지는 않는다 — 실행을 건너뛰고 발행했다면 그대로 기록에 남긴다.
 */

type Timestamps = {
  executed_at: string | null
  published_at: string | null
}

export type MovePatch = {
  rank: string
  executed_at: string | null
  published_at: string | null
}

export function patchForMove(
  card: Timestamps,
  to: Stage,
  rank: string,
  now: Date = new Date(),
): MovePatch {
  const at = now.toISOString()
  if (to === 'research') return { rank, executed_at: null, published_at: null }
  if (to === 'execution') {
    return { rank, executed_at: card.executed_at ?? at, published_at: null }
  }
  return { rank, executed_at: card.executed_at, published_at: card.published_at ?? at }
}

/** 뒤로 끌 때 지워질 기록. 확인을 받기 위해 미리 보여준다. */
export function clearedByMove(card: Timestamps, to: Stage): string[] {
  const lost: string[] = []
  if (card.executed_at && to === 'research') lost.push(STAGE_LABELS.execution)
  if (card.published_at && to !== 'content') lost.push(STAGE_LABELS.content)
  return lost
}

/** 형제 카드를 다시 쓰지 않고 사이에 끼워 넣는 정렬 키. */
export function rankBetween(before: string | null, after: string | null): string {
  return generateKeyBetween(before, after)
}
