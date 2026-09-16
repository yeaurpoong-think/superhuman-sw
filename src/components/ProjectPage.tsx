import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'
import type { CardChanges } from '../admin/useBoard'
import type { ProjectRecord } from '../content'
import { fromDateInput, toDateInput } from '../lib/dates'
import {
  CATEGORIES,
  CATEGORY_LABELS,
  KINDS,
  STAGE_LABELS,
  type Category,
  type Kind,
  stageOf,
} from '../lib/schema'

/** 편집기는 TipTap을 통째로 끌고 온다. 실제로 편집할 때만 받는다. */
const Editor = lazy(() => import('./Editor').then((m) => ({ default: m.Editor })))

type Props = {
  project: ProjectRecord
  editable: boolean
  onSave: (changes: CardChanges) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onUploadImage: (file: File) => Promise<string>
  onClose: () => void
}

const fmt = new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' })

const KIND_LABELS: Record<Kind, string> = {
  project: '프로젝트 (칸반 보드)',
  reference: '레퍼런스 (참고 자료 서가)',
}

const FIELD =
  'mt-1 w-full rounded border border-rule px-2 py-1.5 text-xs focus:border-accent'

export function ProjectPage({ project, editable, onSave, onDelete, onUploadImage, onClose }: Props) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(project.title)
  const [body, setBody] = useState(project.body)
  const [postUrl, setPostUrl] = useState(project.post_url ?? '')
  const [kind, setKind] = useState<Kind>(project.kind ?? 'project')
  const [category, setCategory] = useState<Category | ''>(project.category ?? '')
  const [researched, setResearched] = useState(toDateInput(project.researched_at))
  const [executed, setExecuted] = useState(toDateInput(project.executed_at))
  const [published, setPublished] = useState(toDateInput(project.published_at))
  const [raw, setRaw] = useState(false)
  const [busy, setBusy] = useState(false)

  const stage = stageOf(project)
  const panelRef = useRef<HTMLDivElement>(null)

  /** 열릴 때 포커스를 판 안으로 넣고, 닫히면 원래 있던 자리로 돌려놓는다. */
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    panelRef.current?.focus()
    const bodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = bodyOverflow
      opener?.focus?.()
    }
  }, [])

  /** 열린 동안 Tab은 판 안에서만 돌고, Esc로 물러난다. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        // 편집 중이라면 편집만 물린다. 쓰던 글을 한 번에 날리지 않는다.
        if (editing) cancelRef.current()
        else onClose()
        return
      }
      if (e.key !== 'Tab') return
      const items = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      if (!items || items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [editing, onClose])

  const cancelRef = useRef<() => void>(() => {})

  const cancel = () => {
    setTitle(project.title)
    setBody(project.body)
    setPostUrl(project.post_url ?? '')
    setKind(project.kind ?? 'project')
    setCategory(project.category ?? '')
    setResearched(toDateInput(project.researched_at))
    setExecuted(toDateInput(project.executed_at))
    setPublished(toDateInput(project.published_at))
    setEditing(false)
  }

  /** 되돌리려면 깃 히스토리를 봐야 한다. 실수로 누르는 일이 없게 한 번 묻는다. */
  const remove = async () => {
    if (!window.confirm(`'${project.title}' 카드를 지운다. 되돌리려면 깃 기록을 뒤져야 한다. 계속할까?`)) {
      return
    }
    setBusy(true)
    try {
      await onDelete(project.id)
      onClose()
    } finally {
      setBusy(false)
    }
  }

  const save = async () => {
    setBusy(true)
    try {
      await onSave({
        title,
        body,
        post_url: postUrl.trim() || null,
        kind,
        category: category || null,
        researched_at: fromDateInput(researched) ?? project.researched_at,
        executed_at: fromDateInput(executed),
        published_at: fromDateInput(published),
      })
      setEditing(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 overflow-y-auto bg-shell/70 p-3 md:p-10"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-title"
        tabIndex={-1}
        className="sheet mx-auto max-w-3xl focus:outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="border-b border-rule px-6 py-6 md:px-9">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
                <span className="label border border-rule px-1.5 py-0.5">
                  {project.kind === 'reference' ? '레퍼런스' : STAGE_LABELS[stage]}
                </span>
                {project.category && (
                  <span className="label text-accent">{CATEGORY_LABELS[project.category]}</span>
                )}
                <span className="label">리서치 {fmt.format(new Date(project.researched_at))}</span>
                {project.published_at && (
                  <span className="label">발행 {fmt.format(new Date(project.published_at))}</span>
                )}
              </div>

              {editing ? (
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-3 w-full border border-rule bg-leaf px-2 py-1.5 font-display text-xl focus:border-accent"
                />
              ) : (
                <h2 id="project-title" className="mt-3 font-display text-2xl leading-snug tracking-tight text-ink">
                  {project.title}
                </h2>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded px-2 py-1 text-xs text-muted hover:bg-accent/10"
            >
              닫기
            </button>
          </div>

          {project.sources.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
              {project.sources.map((s) => (
                <li key={s.url} className="text-xs">
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-muted underline decoration-accent/40 underline-offset-2 hover:text-ink"
                  >
                    {s.title ?? s.url}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </header>

        <div className="px-6 py-7 md:px-9">
          {editing ? (
            <>
              <Suspense
                fallback={
                  <p className="py-8 text-center text-xs text-muted">편집기 불러오는 중…</p>
                }
              >
                <Editor
                  value={body}
                  onChange={setBody}
                  raw={raw}
                  onToggleRaw={setRaw}
                  onUploadImage={onUploadImage}
                />
              </Suspense>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <label className="block text-xs text-muted">
                  종류
                  <select
                    value={kind}
                    onChange={(e) => setKind(e.target.value as Kind)}
                    className={FIELD}
                  >
                    {KINDS.map((k) => (
                      <option key={k} value={k}>
                        {KIND_LABELS[k]}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-xs text-muted">
                  분류
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Category | '')}
                    className={FIELD}
                  >
                    <option value="">미분류</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {CATEGORY_LABELS[c]}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-xs text-muted">
                  발행한 글 주소
                  <input
                    value={postUrl}
                    onChange={(e) => setPostUrl(e.target.value)}
                    placeholder="https://..."
                    className={FIELD}
                  />
                </label>

                <label className="block text-xs text-muted">
                  리서치 날짜
                  <input
                    type="date"
                    value={researched}
                    onChange={(e) => setResearched(e.target.value)}
                    className={FIELD}
                  />
                </label>

                <label className="block text-xs text-muted">
                  실행 날짜
                  <input
                    type="date"
                    value={executed}
                    onChange={(e) => setExecuted(e.target.value)}
                    className={FIELD}
                  />
                </label>

                <label className="block text-xs text-muted">
                  발행 날짜
                  <input
                    type="date"
                    value={published}
                    onChange={(e) => setPublished(e.target.value)}
                    className={FIELD}
                  />
                </label>
              </div>

              <p className="mt-3 text-[11px] leading-relaxed text-muted">
                종류를 "레퍼런스"로 바꾸면 칸반 보드가 아니라 그 아래 레퍼런스 서가에 쌓인다.
                "프로젝트"인 카드는 칸반 위치가 아래 날짜들에서 정해진다. 발행 날짜를 넣으면 콘텐츠
                완료로, 비우면 실행 완료로 돌아간다. 칸을 끌어 옮기면 그날 날짜가 자동으로 들어간다.
              </p>
            </>
          ) : (
            <div className="md">
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                {project.body}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {editable && (
          <footer className="flex items-center justify-between gap-3 border-t border-rule px-6 py-4 md:px-9">
            <button
              type="button"
              onClick={remove}
              disabled={busy}
              className="shrink-0 rounded px-2 py-1 text-xs text-muted hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
            >
              카드 지우기
            </button>
            {editing ? (
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={cancel}
                  className="rounded px-3 py-1.5 text-xs text-muted hover:bg-accent/10"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={save}
                  disabled={busy}
                  className="rounded bg-ink px-3 py-1.5 text-xs text-white disabled:opacity-40"
                >
                  {busy ? '저장 중' : '저장'}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="shrink-0 rounded border border-rule px-3 py-1.5 text-xs text-ink hover:bg-accent/10"
              >
                편집
              </button>
            )}
          </footer>
        )}
      </div>
    </div>
  )
}
