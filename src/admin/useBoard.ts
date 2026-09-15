import { useCallback, useEffect, useMemo, useState } from 'react'
import { API_BASE, PROJECTS_DIR, isEditingConfigured } from '../config'
import { contentErrors, projects as baked, type ProjectRecord } from '../content'
import { ApiClient, login as requestSession } from '../lib/api'
import { buildFile, patchFrontmatter, splitFile } from '../lib/markdown'
import { clearedByMove, patchForMove, rankBetween } from '../lib/move'
import { sortByRank, stageOf, type Category, type Stage } from '../lib/schema'
import { applyOverlay, pruneOverlay, readOverlay, writeOverlay, type Overlay } from './overlay'
import { clearSession, readSession, writeSession } from './session'

export type SaveState =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'deploying' }
  | { kind: 'error'; message: string }

export type Admin = { token: string }

export type CardChanges = {
  title?: string
  body?: string
  post_url?: string | null
  tags?: string[]
  category?: Category | null
  researched_at?: string
  executed_at?: string | null
  published_at?: string | null
}

/** 저장 결과가 배포될 때까지 대략 이 정도 걸린다. 사용자에게 보여줄 안내용. */
const DEPLOY_HINT_MS = 120_000

export function useBoard() {
  const [overlay, setOverlay] = useState<Overlay>(() =>
    pruneOverlay(readOverlay(), baked, __BUILD_SHA__),
  )
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [save, setSave] = useState<SaveState>({ kind: 'idle' })

  useEffect(() => writeOverlay(overlay), [overlay])

  const client = useMemo(() => (admin ? new ApiClient(API_BASE, admin.token) : null), [admin])

  const projects = useMemo(() => applyOverlay(baked, overlay), [overlay])

  const signIn = useCallback(async (password: string, remember: boolean) => {
    if (!isEditingConfigured()) throw new Error('편집 서버 주소가 아직 설정되지 않았다')
    const session = await requestSession(API_BASE, password)
    writeSession(session, remember)
    setAdmin({ token: session.token })
  }, [])

  const signOut = useCallback(() => {
    clearSession()
    setAdmin(null)
  }, [])

  /** 새로고침해도 편집 모드가 유지되게, 저장된 세션을 한 번 확인한다. */
  useEffect(() => {
    if (!isEditingConfigured()) return
    const session = readSession()
    if (!session) return
    let alive = true
    new ApiClient(API_BASE, session.token)
      .verify()
      .then((ok) => {
        if (!alive) return
        if (ok) setAdmin({ token: session.token })
        else clearSession()
      })
      .catch(() => clearSession())
    return () => {
      alive = false
    }
  }, [])

  const commit = useCallback(
    async (id: string, next: ProjectRecord, file: string, transform: (cur: string | null) => string, message: string) => {
      if (!client) return
      const previous = overlay[id]
      setOverlay((o) => ({ ...o, [id]: { record: next, commitSha: null, at: Date.now() } }))
      setSave({ kind: 'saving' })
      try {
        const res = await client.updateFile(file, transform, message)
        setOverlay((o) => ({ ...o, [id]: { record: next, commitSha: res.commitSha, at: Date.now() } }))
        setSave({ kind: 'deploying' })
        setTimeout(() => setSave((s) => (s.kind === 'deploying' ? { kind: 'idle' } : s)), DEPLOY_HINT_MS)
      } catch (e) {
        setOverlay((o) => {
          const next = { ...o }
          if (previous) next[id] = previous
          else delete next[id]
          return next
        })
        setSave({ kind: 'error', message: e instanceof Error ? e.message : '저장에 실패했다' })
      }
    },
    [client, overlay],
  )

  const moveCard = useCallback(
    async (id: string, to: Stage, index: number) => {
      const card = projects.find((p) => p.id === id)
      if (!card || !client) return

      const column = sortByRank(projects.filter((p) => stageOf(p) === to && p.id !== id))
      const rank = rankBetween(column[index - 1]?.rank ?? null, column[index]?.rank ?? null)

      const lost = clearedByMove(card, to)
      if (lost.length > 0) {
        const ok = window.confirm(`${lost.join(', ')} 기록이 지워진다. 계속할까?`)
        if (!ok) return
      }

      const patch = patchForMove(card, to, rank)
      await commit(
        id,
        { ...card, ...patch },
        card.file,
        (cur) => patchFrontmatter(cur ?? buildFile({ ...card }, card.body), patch),
        `move: ${card.title}`,
      )
    },
    [projects, client, commit],
  )

  /**
   * 제목·본문·분류·날짜·발행 링크를 고친다.
   * 날짜를 직접 고치면 칸도 따라 움직인다 — 칸은 날짜에서 유도되기 때문이다.
   */
  const saveCard = useCallback(
    async (id: string, changes: CardChanges) => {
      const card = projects.find((p) => p.id === id)
      if (!card || !client) return

      const meta: Record<string, unknown> = {}
      if (changes.title !== undefined) meta.title = changes.title.trim()
      if (changes.post_url !== undefined) meta.post_url = changes.post_url || null
      if (changes.tags !== undefined) meta.tags = changes.tags
      if (changes.category !== undefined) meta.category = changes.category
      // 리서치 날짜는 비울 수 없다. 카드가 존재한다는 건 리서치가 끝났다는 뜻이다.
      if (changes.researched_at) meta.researched_at = changes.researched_at
      if (changes.executed_at !== undefined) meta.executed_at = changes.executed_at
      if (changes.published_at !== undefined) meta.published_at = changes.published_at
      const body = changes.body ?? card.body

      await commit(
        id,
        { ...card, ...meta, body } as ProjectRecord,
        card.file,
        (cur) => {
          const { frontmatter } = splitFile(cur ?? buildFile({ ...card }, card.body))
          return buildFile({ ...frontmatter, ...meta }, body)
        },
        `edit: ${changes.title?.trim() ?? card.title}`,
      )
    },
    [projects, client, commit],
  )

  const createCard = useCallback(
    async (input: { title: string; url?: string }) => {
      if (!client) return
      const now = new Date()
      const stamp = now.toISOString().slice(0, 10).replaceAll('-', '')
      const id = `p-${stamp}-${Math.random().toString(36).slice(2, 6)}`
      const first = sortByRank(projects.filter((p) => stageOf(p) === 'research'))[0]

      const frontmatter = {
        id,
        title: input.title.trim(),
        rank: rankBetween(null, first?.rank ?? null),
        tags: [] as string[],
        sources: input.url ? [{ url: input.url, type: 'link' }] : [],
        post_url: null,
        category: null,
        researched_at: now.toISOString(),
        executed_at: null,
        published_at: null,
      }
      const body = input.url ? `- 원본: ${input.url}\n\n리서치 정리 예정.` : '리서치 정리 예정.'
      const file = `${PROJECTS_DIR}/${id}.md`
      const text = buildFile(frontmatter, body)

      await commit(
        id,
        { ...frontmatter, body, file } as unknown as ProjectRecord,
        file,
        () => text,
        `add: ${frontmatter.title}`,
      )
    },
    [client, projects, commit],
  )

  return {
    projects,
    contentErrors,
    admin,
    signIn,
    signOut,
    save,
    dismissError: () => setSave({ kind: 'idle' }),
    moveCard,
    createCard,
    saveCard,
  }
}
