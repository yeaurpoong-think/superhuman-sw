import { Suspense, lazy, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'
import type { CardChanges } from '../admin/useBoard'
import type { ProjectRecord } from '../content'
import { fromDateInput, toDateInput } from '../lib/dates'
import {
  CATEGORIES,
  CATEGORY_LABELS,
  STAGE_LABELS,
  type Category,
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

const FIELD =
  'mt-1 w-full rounded border border-neutral-300 px-2 py-1.5 text-xs outline-none focus:border-neutral-500'

export function ProjectPage({ project, editable, onSave, onDelete, onUploadImage, onClose }: Props) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(project.title)
  const [body, setBody] = useState(project.body)
  const [postUrl, setPostUrl] = useState(project.post_url ?? '')
  const [category, setCategory] = useState<Category | ''>(project.category ?? '')
  const [researched, setResearched] = useState(toDateInput(project.researched_at))
  const [executed, setExecuted] = useState(toDateInput(project.executed_at))
  const [published, setPublished] = useState(toDateInput(project.published_at))
  const [raw, setRaw] = useState(false)
  const [busy, setBusy] = useState(false)

  const stage = stageOf(project)

  const cancel = () => {
    setTitle(project.title)
    setBody(project.body)
    setPostUrl(project.post_url ?? '')
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
      className="fixed inset-0 z-40 overflow-y-auto bg-neutral-900/20 p-4 backdrop-blur-[1px] md:p-10"
      onClick={onClose}
    >
      <div
        className="mx-auto max-w-3xl rounded-xl border border-neutral-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="border-b border-neutral-100 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400">
                <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-neutral-600">
                  {STAGE_LABELS[stage]}
                </span>
                {project.category && (
                  <span className="rounded bg-neutral-900 px-1.5 py-0.5 text-white">
                    {CATEGORY_LABELS[project.category]}
                  </span>
                )}
                <span>리서치 {fmt.format(new Date(project.researched_at))}</span>
                {project.published_at && (
                  <span>발행 {fmt.format(new Date(project.published_at))}</span>
                )}
              </div>

              {editing ? (
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-2 w-full rounded border border-neutral-300 px-2 py-1.5 text-lg font-semibold outline-none focus:border-neutral-500"
                />
              ) : (
                <h2 className="mt-2 text-lg font-semibold tracking-tight text-neutral-900">
                  {project.title}
                </h2>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded px-2 py-1 text-xs text-neutral-400 hover:bg-neutral-100"
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
                    className="text-neutral-500 underline decoration-neutral-300 underline-offset-2 hover:text-neutral-900"
                  >
                    {s.title ?? s.url}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </header>

        <div className="px-6 py-5">
          {editing ? (
            <>
              <Suspense
                fallback={
                  <p className="py-8 text-center text-xs text-neutral-400">편집기 불러오는 중…</p>
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
                <label className="block text-xs text-neutral-500">
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

                <label className="block text-xs text-neutral-500">
                  발행한 글 주소
                  <input
                    value={postUrl}
                    onChange={(e) => setPostUrl(e.target.value)}
                    placeholder="https://..."
                    className={FIELD}
                  />
                </label>

                <label className="block text-xs text-neutral-500">
                  리서치 날짜
                  <input
                    type="date"
                    value={researched}
                    onChange={(e) => setResearched(e.target.value)}
                    className={FIELD}
                  />
                </label>

                <label className="block text-xs text-neutral-500">
                  실행 날짜
                  <input
                    type="date"
                    value={executed}
                    onChange={(e) => setExecuted(e.target.value)}
                    className={FIELD}
                  />
                </label>

                <label className="block text-xs text-neutral-500">
                  발행 날짜
                  <input
                    type="date"
                    value={published}
                    onChange={(e) => setPublished(e.target.value)}
                    className={FIELD}
                  />
                </label>
              </div>

              <p className="mt-3 text-[11px] leading-relaxed text-neutral-400">
                칸반 위치는 이 날짜들에서 정해진다. 발행 날짜를 넣으면 콘텐츠 완료로, 비우면 실행
                완료로 돌아간다. 칸을 끌어 옮기면 그날 날짜가 자동으로 들어간다.
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
          <footer className="flex items-center justify-between gap-3 border-t border-neutral-100 px-6 py-4">
            <button
              type="button"
              onClick={remove}
              disabled={busy}
              className="shrink-0 rounded px-2 py-1 text-xs text-neutral-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
            >
              카드 지우기
            </button>
            {editing ? (
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={cancel}
                  className="rounded px-3 py-1.5 text-xs text-neutral-500 hover:bg-neutral-100"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={save}
                  disabled={busy}
                  className="rounded bg-neutral-900 px-3 py-1.5 text-xs text-white disabled:opacity-40"
                >
                  {busy ? '저장 중' : '저장'}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="shrink-0 rounded border border-neutral-300 px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-100"
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
