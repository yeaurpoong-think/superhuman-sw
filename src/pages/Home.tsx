import { ScrollVideo } from '../components/ScrollVideo'
import { HERO_PAGE, HERO_POSTER, HERO_VIDEO, HERO_VIDEO_SMALL } from '../config'
import { projects } from '../content'
import { heroCues } from '../lib/hero'
import {
  CATEGORY_LABELS,
  STAGE_LABELS,
  averageLeadTimeDays,
  partitionByKind,
  sortByRank,
  stageOf,
} from '../lib/schema'
import type { Route } from '../router'

type Props = { onNavigate: (route: Route) => void }

/** 이 서고가 다른 기록과 다른 점. 자랑이 아니라 규칙으로 적는다. */
const RULES = [
  {
    head: '실행 날짜가 따로 찍힌다',
    body: '리서치를 끝낸 날과 실제로 해본 날은 다른 칸에 적힌다. 읽기만 한 것은 읽기만 한 칸에 남는다. 그래서 안 한 것이 드러난다.',
  },
  {
    head: '검증 못 한 건 검증 못 했다고 쓴다',
    body: '원출처를 찾지 못한 수치는 본문에 그렇게 밝힌다. 그럴듯하게 넘어가지 않는다.',
  },
  {
    head: '고친 자리까지 남는다',
    body: '서고 전체가 공개 저장소다. 무엇을 언제 고쳤는지가 그대로 남아 있다.',
  },
]

export function Home({ onNavigate }: Props) {
  const { board, references } = partitionByKind(projects)
  const published = board.filter((p) => stageOf(p) === 'content').length
  const average = averageLeadTimeDays(board)

  /** 설명보다 제목이 세다. 실제로 꽂혀 있는 것을 그대로 보여준다. */
  const recent = sortByRank(board).slice(0, 3)

  const figures = [
    {
      label: '서가에 꽂힌 것',
      value: projects.length,
      unit: '권',
      note: '프로젝트와 참고 자료를 합한 수',
    },
    {
      label: '콘텐츠로 끝맺은 것',
      value: published,
      unit: '권',
      note: '읽고 해보고 발행까지 마친 것',
    },
    {
      label: '참고 자료',
      value: references.length,
      unit: '건',
      note: '칸반을 타지 않고 보관만 하는 것',
    },
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
                <h1 className="mt-4 font-display text-5xl leading-[1.1] tracking-tight text-paper sm:text-7xl md:text-8xl">
                  SW Project Library
                </h1>
                <p className="mt-6 font-serif text-sm text-paper/75 md:text-base">
                  AI를 읽고, 만들어 보고, 남긴다
                </p>
              </div>

              <div
                style={{ opacity: line, transform: `translateY(${(1 - line) * 20}px)` }}
                className="absolute inset-x-0 top-1/2 px-6 text-center will-change-[opacity,transform]"
                aria-hidden={line < 0.5}
              >
                <p className="mx-auto max-w-lg font-serif text-lg leading-relaxed text-paper md:text-xl">
                  리서치에서 시작해 직접 해보고, 콘텐츠로 끝맺는다.
                </p>
                <p className="mt-4 font-serif text-sm text-paper/70">
                  그 사이에 걸린 시간까지 남는다
                </p>
              </div>

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
                  <p className="max-w-md font-display text-3xl leading-[1.5] text-white sm:text-4xl md:text-5xl">
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
            <h2 className="font-display text-4xl leading-snug text-white md:text-5xl">
              해보고, 남겨야 내 것이 된다
            </h2>
            <p className="mt-7 font-serif text-base leading-relaxed text-paper md:text-lg">
              AI에 관한 것을 읽고, 직접 만들어 보고, 그 과정에서 알게 된 것을 남긴다. 결과만이
              아니라 어디서 막혔고 무엇을 다시 했는지까지 남긴다.
            </p>
            <p className="mt-4 font-serif text-base leading-relaxed text-paper md:text-lg">
              읽기만 한 것은 읽기만 한 칸에 그대로 남는다. 그래서 이 서고는 내가 무엇을 안 했는지도
              같이 보여준다.
              {average !== null && (
                <>
                  {' '}
                  지금까지 리서치에서 발행까지 평균 <span className="text-white">{average}일</span>{' '}
                  걸렸다.
                </>
              )}
            </p>

            {/* 규칙으로 적는 잔글. 주장보다 규칙이 믿긴다. */}
            <div className="mt-16 space-y-8 border-t border-white/25 pt-10">
              <p className="label text-paper">기록하는 방식</p>
              {RULES.map((rule, i) => (
                <div key={rule.head} className="flex gap-4">
                  <span className="label mt-1 shrink-0 text-white/50">{`0${i + 1}`}</span>
                  <div>
                    <h3 className="font-serif text-lg text-white">{rule.head}</h3>
                    <p className="mt-2 font-serif text-[15px] leading-relaxed text-paper">
                      {rule.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <dl className="mt-16 grid gap-8 border-t border-white/25 pt-10 sm:grid-cols-3">
              {figures.map((f) => (
                <div key={f.label}>
                  <dt className="label text-paper">{f.label}</dt>
                  <dd className="mt-2 font-display text-4xl leading-none text-white tabular-nums">
                    {f.value}
                    <span className="ml-2 font-serif text-base text-paper">{f.unit}</span>
                  </dd>
                  <p className="mt-3 font-serif text-[13px] leading-snug text-paper">{f.note}</p>
                </div>
              ))}
            </dl>

            {recent.length > 0 && (
              <div className="mt-16 border-t border-white/25 pt-10">
                <p className="label text-paper">지금 서가에 있는 것</p>
                <p className="mt-3 font-serif text-[15px] text-paper">
                  설명보다 제목이 빠르다. 최근에 꽂힌 것을 그대로 옮겨 둔다.
                </p>
                <ul className="mt-6 space-y-5">
                  {recent.map((p) => (
                    <li key={p.id}>
                      <p className="font-serif text-base leading-snug text-white md:text-lg">
                        {p.title}
                      </p>
                      <p className="label mt-1.5 text-paper">
                        {p.category ? CATEGORY_LABELS[p.category] : '미분류'} · {STAGE_LABELS[stageOf(p)]}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-16 border-t border-white/25 pt-10">
              <h3 className="font-display text-3xl leading-snug text-white md:text-4xl">
                같은 길을 가려는 사람에게
              </h3>
              <p className="mt-6 font-serif text-base leading-relaxed text-paper md:text-lg">
                앞서간 사람의 정리된 결론만 보고 싶다면 이 서고는 맞지 않는다. 여기 남는 것은
                과정이다. 무엇을 읽었고, 무엇을 해봤고, 어디서 막혔는지.
              </p>
              <p className="mt-4 font-serif text-base leading-relaxed text-paper md:text-lg">
                같은 걸 해보려다 같은 데서 막혔던 사람이라면, 이 기록이 쓸모가 있을 것이다.
              </p>
              <p className="mt-6 font-serif text-[15px] leading-relaxed text-paper">
                새 글은 조용히 쌓인다. 알림도 구독도 없다. 생각날 때 들러서 그동안 늘어난 것을
                보면 된다.
              </p>
            </div>

            <div className="mt-16 border-t border-white/25 pt-10">
              <button
                type="button"
                onClick={() => onNavigate('library')}
                className="group inline-flex items-baseline gap-3 border-b border-white/40 pb-2 text-left transition-colors hover:border-white"
              >
                <span className="font-display text-3xl text-white md:text-4xl">서고 들어가기</span>
                <span
                  aria-hidden
                  className="text-paper transition-transform group-hover:translate-x-1"
                >
                  →
                </span>
              </button>
              <p className="mt-5 font-serif text-[15px] text-paper">
                리서치 완료 · 실행 완료 · 콘텐츠 완료 세 칸으로 나뉘어 있다.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
