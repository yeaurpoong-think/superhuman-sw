import type { ProjectRecord } from '../content'
import { CATEGORY_LABELS, stageOf } from '../lib/schema'

const fmt = new Intl.DateTimeFormat('ko-KR', { month: 'numeric', day: 'numeric' })

const dateOf = (p: ProjectRecord) => {
  if (p.kind === 'reference') return { label: '등록', at: p.researched_at }
  const stage = stageOf(p)
  if (stage === 'content') return { label: '발행', at: p.published_at! }
  if (stage === 'execution') return { label: '실행', at: p.executed_at! }
  return { label: '리서치', at: p.researched_at }
}

/** 청구기호처럼 쓰는 짧은 식별자. 파일명 그대로다. */
const callNumber = (id: string) => id.replace(/^p-/, '').toUpperCase()

export function Card({
  project,
  draggable = false,
  onOpen,
}: {
  project: ProjectRecord
  draggable?: boolean
  onOpen?: () => void
}) {
  const { label, at } = dateOf(project)

  return (
    <article
      onClick={onOpen}
      className={`group relative border border-rule bg-leaf px-4 pt-3.5 pb-3 transition-shadow hover:shadow-[0_2px_10px_-4px_rgba(60,45,20,0.35)] ${
        draggable ? 'cursor-grab active:cursor-grabbing' : onOpen ? 'cursor-pointer' : ''
      }`}
    >
      {/* 책등처럼 왼쪽에 서는 얇은 띠 */}
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-[3px] bg-accent/0 transition-colors group-hover:bg-accent/60"
      />

      <div className="flex items-baseline justify-between gap-3">
        <span className="label">{callNumber(project.id)}</span>
        {project.category && (
          <span className="label text-accent">{CATEGORY_LABELS[project.category]}</span>
        )}
      </div>

      <h3 className="mt-2 font-serif text-[16px] leading-snug text-ink">{project.title}</h3>

      {project.tags.length > 0 && (
        <p className="mt-2 text-[11px] text-muted">
          {project.tags.map((t) => `#${t}`).join('  ')}
        </p>
      )}

      <div className="mt-3 flex items-center gap-3 border-t border-rule-soft pt-2">
        <span className="label">
          {label} {fmt.format(new Date(at))}
        </span>
        {project.sources.length > 0 && <span className="label">출처 {project.sources.length}</span>}
        {project.post_url && (
          <a
            href={project.post_url}
            target="_blank"
            rel="noreferrer noopener"
            onClick={(e) => e.stopPropagation()}
            className="label text-accent underline underline-offset-2"
          >
            발행본
          </a>
        )}
      </div>
    </article>
  )
}
