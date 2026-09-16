import { ScrollVideo } from '../components/ScrollVideo'
import { HERO_POSTER, HERO_VIDEO } from '../config'
import { projects } from '../content'
import { averageLeadTimeDays, partitionByKind, stageOf } from '../lib/schema'
import type { Route } from '../router'

type Props = { onNavigate: (route: Route) => void }

export function Home({ onNavigate }: Props) {
  const { board, references } = partitionByKind(projects)
  const published = board.filter((p) => stageOf(p) === 'content').length
  const average = averageLeadTimeDays(board)

  const figures = [
    { label: '서가에 꽂힌 것', value: projects.length, unit: '권' },
    { label: '콘텐츠로 끝맺은 것', value: published, unit: '권' },
    { label: '참고 자료', value: references.length, unit: '건' },
  ]

  return (
    <>
      <ScrollVideo src={HERO_VIDEO} poster={HERO_POSTER}>
        <div className="mx-auto max-w-3xl text-center">
          <p className="label text-paper/70">Superhuman SW</p>
          <h1 className="mt-4 font-display text-4xl leading-[1.15] tracking-tight text-paper sm:text-6xl md:text-7xl">
            SW Project Library
          </h1>
          <p className="mx-auto mt-6 max-w-lg font-serif text-base leading-relaxed text-paper/80 md:text-lg">
            리서치에서 시작해 직접 해보고, 콘텐츠로 끝맺는다.
            <br />그 과정을 통째로 남겨 둔 서고.
          </p>
        </div>
      </ScrollVideo>

      <section className="bg-shell px-5 pt-20 pb-24 md:px-10">
        <div className="mx-auto max-w-5xl">
          <dl className="grid gap-10 border-t border-paper/15 pt-12 sm:grid-cols-3">
            {figures.map((f) => (
              <div key={f.label}>
                <dt className="label text-paper/50">{f.label}</dt>
                <dd className="mt-3 font-display text-5xl leading-none text-paper tabular-nums">
                  {f.value}
                  <span className="ml-2 font-serif text-base text-paper/50">{f.unit}</span>
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-20 grid gap-12 border-t border-paper/15 pt-12 md:grid-cols-2">
            <div>
              <h2 className="font-display text-2xl leading-snug text-paper md:text-3xl">
                읽은 것으로 끝내지 않는다
              </h2>
              <p className="mt-5 font-serif leading-relaxed text-paper/70">
                인스타 릴스 하나, 링크 하나에서 시작한 리서치가 실제로 해본 기록을 거쳐 콘텐츠로
                발행되기까지. 그 사이에서 무엇이 얼마나 걸렸는지를 세 칸짜리 서가에 그대로 남긴다.
                {average !== null && (
                  <>
                    {' '}
                    지금까지 리서치에서 발행까지 평균{' '}
                    <span className="text-paper">{average}일</span> 걸렸다.
                  </>
                )}
              </p>
            </div>

            <div className="flex items-end md:justify-end">
              <button
                type="button"
                onClick={() => onNavigate('library')}
                className="group inline-flex items-baseline gap-3 border-b border-paper/30 pb-2 text-left transition-colors hover:border-paper"
              >
                <span className="font-display text-2xl text-paper md:text-3xl">서고 들어가기</span>
                <span
                  aria-hidden
                  className="text-paper/50 transition-transform group-hover:translate-x-1"
                >
                  →
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
