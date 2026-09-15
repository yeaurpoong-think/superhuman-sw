import type { ProjectRecord } from '../content'
import { stageOf } from '../lib/schema'

const fmt = new Intl.DateTimeFormat('ko-KR', { month: 'numeric', day: 'numeric' })

const dateOf = (p: ProjectRecord) => {
  const stage = stageOf(p)
  if (stage === 'content') return { label: '발행', at: p.published_at! }
  if (stage === 'execution') return { label: '실행', at: p.executed_at! }
  return { label: '리서치', at: p.researched_at }
}

export function Card({ project, draggable = false }: { project: ProjectRecord; draggable?: boolean }) {
  const { label, at } = dateOf(project)

  return (
    <article className={`rounded-lg border border-neutral-200 bg-white p-4 shadow-xs transition hover:border-neutral-300 hover:shadow-sm ${draggable ? 'cursor-grab active:cursor-grabbing' : ''}`}>
      <h3 className="text-[15px] leading-snug font-medium text-neutral-900">{project.title}</h3>

      {project.tags.length > 0 && (
        <ul className="mt-2.5 flex flex-wrap gap-1.5">
          {project.tags.map((tag) => (
            <li
              key={tag}
              className="rounded bg-neutral-100 px-1.5 py-0.5 text-[11px] text-neutral-600"
            >
              {tag}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex items-center gap-3 text-[11px] text-neutral-400">
        <span>
          {label} {fmt.format(new Date(at))}
        </span>
        {project.sources.length > 0 && <span>출처 {project.sources.length}</span>}
        {project.post_url && (
          <a
            href={project.post_url}
            target="_blank"
            rel="noreferrer noopener"
            className="text-neutral-500 underline decoration-neutral-300 underline-offset-2 hover:text-neutral-900"
          >
            글 보기
          </a>
        )}
      </div>
    </article>
  )
}
