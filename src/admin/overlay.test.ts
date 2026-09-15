import { describe, expect, it } from 'vitest'
import type { ProjectRecord } from '../content'
import { applyOverlay, pruneOverlay, type Overlay } from './overlay'

const rec = (over: Partial<ProjectRecord> = {}): ProjectRecord =>
  ({
    id: 'a',
    title: '제목',
    rank: 'a0',
    tags: [],
    sources: [],
    post_url: null,
    researched_at: '2026-09-01T00:00:00Z',
    executed_at: null,
    published_at: null,
    body: '본문',
    file: 'content/projects/a.md',
    ...over,
  }) as ProjectRecord

const NOW = 1_800_000_000_000

describe('applyOverlay', () => {
  it('구워진 카드를 오버레이 값으로 덮는다', () => {
    const overlay: Overlay = {
      a: { record: rec({ executed_at: '2026-09-10T00:00:00Z' }), commitSha: 'c1', at: NOW },
    }
    expect(applyOverlay([rec()], overlay)[0].executed_at).toBe('2026-09-10T00:00:00Z')
  })

  it('아직 배포되지 않은 새 카드를 끼워 넣는다', () => {
    const overlay: Overlay = { b: { record: rec({ id: 'b' }), commitSha: 'c1', at: NOW } }
    expect(applyOverlay([rec()], overlay).map((p) => p.id).sort()).toEqual(['a', 'b'])
  })

  it('삭제 표시된 카드를 빼낸다', () => {
    const overlay: Overlay = { a: { record: null, commitSha: 'c1', at: NOW } }
    expect(applyOverlay([rec()], overlay)).toEqual([])
  })
})

describe('pruneOverlay', () => {
  it('내 커밋으로 빌드된 사이트를 받으면 오버레이를 버린다', () => {
    const overlay: Overlay = { a: { record: rec({ rank: 'z9' }), commitSha: 'abc', at: NOW } }
    expect(pruneOverlay(overlay, [rec()], 'abc', NOW)).toEqual({})
  })

  it('구워진 내용이 이미 같아졌으면 버린다', () => {
    const overlay: Overlay = { a: { record: rec({ rank: 'z9' }), commitSha: 'c1', at: NOW } }
    expect(pruneOverlay(overlay, [rec({ rank: 'z9' })], 'other', NOW)).toEqual({})
  })

  it('아직 반영 안 됐으면 남긴다', () => {
    const overlay: Overlay = { a: { record: rec({ rank: 'z9' }), commitSha: 'c1', at: NOW } }
    expect(Object.keys(pruneOverlay(overlay, [rec()], 'other', NOW))).toEqual(['a'])
  })

  it('오래된 오버레이는 버린다 — 실패한 저장이 영원히 화면을 속이면 안 된다', () => {
    const overlay: Overlay = { a: { record: rec({ rank: 'z9' }), commitSha: 'c1', at: NOW } }
    const muchLater = NOW + 7 * 60 * 60 * 1000
    expect(pruneOverlay(overlay, [rec()], 'other', muchLater)).toEqual({})
  })

  it('삭제 표시는 구워진 목록에서 사라지면 버린다', () => {
    const overlay: Overlay = { a: { record: null, commitSha: 'c1', at: NOW } }
    expect(pruneOverlay(overlay, [], 'other', NOW)).toEqual({})
  })
})
