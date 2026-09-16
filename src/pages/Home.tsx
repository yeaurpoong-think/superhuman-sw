import { ScrollVideo } from '../components/ScrollVideo'
import { HERO_PAGE, HERO_POSTER, HERO_VIDEO, HERO_VIDEO_SMALL } from '../config'
import { projects } from '../content'
import { heroCues } from '../lib/hero'
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
      {/*
        영상의 마지막 프레임과 같은 그림을 페이지 바탕에 깔아 둔다.
        히어로가 위로 밀려나면 이미 같은 그림이 뒤에 있어 이어지는 티가 나지 않는다.
      */}
      <div
        aria-hidden
        className="fixed inset-0 -z-10 bg-shell bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${HERO_PAGE})` }}
      />

      <ScrollVideo
        src={HERO_VIDEO}
        srcSmall={HERO_VIDEO_SMALL}
        poster={HERO_POSTER}
        runway={4}
        overlayOpacity={(p) => heroCues(p).overlay}
      >
        {(p) => {
          // 마지막에 책이 다가와 종이가 화면을 덮는다. 그 구간은 글자를 전부 비켜 준다.
          const { title, line } = heroCues(p)

          return (
            <div className="pointer-events-none mx-auto max-w-3xl text-center">
              <div
                style={{ opacity: title, transform: `translateY(${(1 - title) * -24}px)` }}
                className="will-change-[opacity,transform]"
              >
                <p className="label text-paper/70">Superhuman SW</p>
                <h1 className="mt-4 font-display text-4xl leading-[1.15] tracking-tight text-paper sm:text-6xl md:text-7xl">
                  SW Project Library
                </h1>
              </div>

              <p
                style={{ opacity: line, transform: `translateY(${(1 - line) * 20}px)` }}
                className="absolute inset-x-0 top-1/2 mx-auto max-w-lg px-6 font-serif text-lg leading-relaxed text-paper will-change-[opacity,transform] md:text-xl"
                aria-hidden={line < 0.5}
              >
                리서치에서 시작해 직접 해보고, 콘텐츠로 끝맺는다.
              </p>
            </div>
          )
        }}
      </ScrollVideo>

      {/*
        종이 위에 얹히는 글. 책등 주름이 화면 가운데에서 살짝 오른쪽에 있어
        가운데 정렬하면 글자가 주름에 걸린다. 왼쪽 면에 몰아 둔다.
      */}
      <section className="px-5 pt-24 pb-28 md:px-10">
        <div className="mx-auto max-w-5xl">
          <div className="max-w-xl">
            <h2 className="font-display text-3xl leading-snug text-white md:text-4xl">
              읽은 것으로 끝내지 않는다
            </h2>
            <p className="mt-6 font-serif text-base leading-relaxed text-paper md:text-lg">
              인스타 릴스 하나, 링크 하나에서 시작한 리서치가 실제로 해본 기록을 거쳐 콘텐츠로
              발행되기까지. 그 사이에서 무엇이 얼마나 걸렸는지를 세 칸짜리 서가에 그대로 남긴다.
              {average !== null && (
                <>
                  {' '}
                  지금까지 리서치에서 발행까지 평균 <span className="text-white">{average}일</span>{' '}
                  걸렸다.
                </>
              )}
            </p>

            <dl className="mt-14 grid gap-8 border-t border-white/25 pt-10 sm:grid-cols-3">
              {figures.map((f) => (
                <div key={f.label}>
                  <dt className="label text-paper">{f.label}</dt>
                  <dd className="mt-2 font-display text-4xl leading-none text-white tabular-nums">
                    {f.value}
                    <span className="ml-2 font-serif text-base text-paper">{f.unit}</span>
                  </dd>
                </div>
              ))}
            </dl>

            <button
              type="button"
              onClick={() => onNavigate('library')}
              className="group mt-14 inline-flex items-baseline gap-3 border-b border-white/40 pb-2 text-left transition-colors hover:border-white"
            >
              <span className="font-display text-2xl text-white md:text-3xl">서고 들어가기</span>
              <span aria-hidden className="text-paper transition-transform group-hover:translate-x-1">
                →
              </span>
            </button>
          </div>
        </div>
      </section>
    </>
  )
}
