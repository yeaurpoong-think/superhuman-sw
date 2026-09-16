import { ScrollVideo } from '../components/ScrollVideo'
import { HERO_PAGE, HERO_POSTER, HERO_VIDEO, HERO_VIDEO_SMALL } from '../config'
import { projects } from '../content'
import { heroCues } from '../lib/hero'
import { averageLeadTimeDays, partitionByKind, sortByRank, stageOf } from '../lib/schema'
import type { Route } from '../router'

type Props = { onNavigate: (route: Route) => void }

export function Home({ onNavigate }: Props) {
  const { board, references } = partitionByKind(projects)
  const published = board.filter((p) => stageOf(p) === 'content').length
  const average = averageLeadTimeDays(board)

  /** 설명보다 제목이 세다. 실제로 꽂혀 있는 것을 그대로 보여준다. */
  const recent = sortByRank(board).slice(0, 3)

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
          const { title, line, paper } = heroCues(p)

          return (
            <div className="pointer-events-none">
              <div
                style={{ opacity: title, transform: `translateY(${(1 - title) * -24}px)` }}
                className="mx-auto max-w-3xl text-center will-change-[opacity,transform]"
              >
                <p className="label text-paper/70">Superhuman SW</p>
                <h1 className="mt-4 font-hand text-5xl leading-[1.1] tracking-tight text-paper sm:text-7xl md:text-8xl">
                  SW Project Library
                </h1>
              </div>

              <p
                style={{ opacity: line, transform: `translateY(${(1 - line) * 20}px)` }}
                className="absolute inset-x-0 top-1/2 mx-auto max-w-lg px-6 text-center font-serif text-lg leading-relaxed text-paper will-change-[opacity,transform] md:text-xl"
                aria-hidden={line < 0.5}
              >
                리서치에서 시작해 직접 해보고, 콘텐츠로 끝맺는다.
              </p>

              {/*
                펼쳐진 종이 위에 쓰이는 글. 책등 주름이 가운데에서 살짝 오른쪽이라
                가운데 정렬하면 글자가 주름에 걸린다. 왼쪽 면에 앉힌다.
              */}
              <div
                style={{ opacity: paper, transform: `translateY(${(1 - paper) * 16}px)` }}
                className="absolute inset-x-0 top-1/2 -translate-y-1/2 will-change-[opacity,transform]"
                aria-hidden={paper < 0.5}
              >
                <div className="mx-auto max-w-5xl px-5 md:px-10">
                  <p className="max-w-md font-hand text-3xl leading-[1.5] text-white sm:text-4xl md:text-5xl">
                    읽은 것은
                    <br />
                    아직 내 것이 아니다
                  </p>
                </div>
              </div>
            </div>
          )
        }}
      </ScrollVideo>

      {/* 위 문장에서 이어지는 지면. 같은 종이 위에 계속 쓰인다. */}
      <section className="px-5 pt-24 pb-28 md:px-10">
        <div className="mx-auto max-w-5xl">
          <div className="max-w-xl">
            <h2 className="font-hand text-4xl leading-snug text-white md:text-5xl">
              해보고, 남겨야 내 것이 된다
            </h2>
            <p className="mt-7 font-serif text-base leading-relaxed text-paper md:text-lg">
              AI에 관한 것을 읽고, 직접 만들어 보고, 그 과정에서 알게 된 것을 남긴다. 결과만이
              아니라 어디서 막혔고 무엇을 다시 했는지까지 남긴다. 읽기만 한 것은 읽기만 한 칸에
              그대로 남는다.
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

            {recent.length > 0 && (
              <div className="mt-16 border-t border-white/25 pt-10">
                <p className="label text-paper">지금 서가에 있는 것</p>
                <ul className="mt-5 space-y-3">
                  {recent.map((p) => (
                    <li key={p.id} className="font-serif text-base leading-snug text-white md:text-lg">
                      {p.title}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-16 border-t border-white/25 pt-10">
              <h3 className="font-hand text-3xl leading-snug text-white md:text-4xl">
                같은 길을 가려는 사람에게
              </h3>
              <p className="mt-6 font-serif text-base leading-relaxed text-paper md:text-lg">
                앞서간 사람의 정리된 결론만 보고 싶다면 이 서고는 맞지 않는다. 여기 남는 것은
                과정이다. 무엇을 읽었고, 무엇을 해봤고, 어디서 막혔는지. 그 기록이 필요한 사람에게
                열어 둔다.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('library')}
              className="group mt-14 inline-flex items-baseline gap-3 border-b border-white/40 pb-2 text-left transition-colors hover:border-white"
            >
              <span className="font-hand text-3xl text-white md:text-4xl">서고 들어가기</span>
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
