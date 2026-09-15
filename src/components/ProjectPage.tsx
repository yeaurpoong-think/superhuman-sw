import { Suspense, lazy, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'
import type { ProjectRecord } from '../content'
import { STAGE_LABELS, stageOf } from '../lib/schema'
/** 편집기는 TipTap을 통째로 끌고 온다. 실제로 편집할 때만 받는다. */
const Editor = lazy(() => import('./Editor').then((m) => ({ default: m.Editor })))

type Props = {
  project: ProjectRecord
  editable: boolean
  onSave: (changes: { title?: string; body?: string; post_url?: string | null }) => Promise<void>
  onClose: () => void
}

const fmt = new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' })

export function ProjectPage({ project, editable, onSave, onClose }: Props) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(project.title)
  const [body, setBody] = useState(project.body)
  const [postUrl, setPostUrl] = useState(project.post_url ?? '')
  const [raw, setRaw] = useState(false)
  const [busy, setBusy] = useState(false)

  const stage = stageOf(project)

  const cancel = () => {
    setTitle(project.title)
    setBody(project.body)
    setPostUrl(project.post_url ?? '')
    setEditing(false)
  }

  const save = async () => {
    setBusy(true)
    try {
      await onSave({ title, body, post_url: postUrl.trim() || null })
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
                fallback={<p className="py-8 text-center text-xs text-neutral-400">편집기 불러오는 중…</p>}
              >
                <Editor value={body} onChange={setBody} raw={raw} onToggleRaw={setRaw} />
              </Suspense>
              <label className="mt-4 block text-xs text-neutral-500">
                발행한 글 주소
                <input
                  value={postUrl}
                  onChange={(e) => setPostUrl(e.target.value)}
                  placeholder="https://..."
                  className="mt-1 w-full rounded border border-neutral-300 px-2 py-1.5 text-xs outline-none focus:border-neutral-500"
                />
              </label>
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
            <span className="text-xs text-neutral-400">{project.file}</span>
            {editing ? (
              <div className="flex gap-2">
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
                className="rounded border border-neutral-300 px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-100"
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
