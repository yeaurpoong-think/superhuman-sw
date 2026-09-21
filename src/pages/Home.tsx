import { ScrollVideo } from '../components/ScrollVideo'
import { HERO_PAGE, HERO_POSTER, HERO_VIDEO, HERO_VIDEO_SMALL } from '../config'
import { projects } from '../content'
import { heroCues } from '../lib/hero'
import { tie } from '../lib/korean'
import {
  CATEGORIES,
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
    head: '실행 날짜를 따로 적습니다',
    body: '리서치를 끝낸 날과 실제로 해본 날을 다른 칸에 적습니다. 읽기만 한 것은 읽기만 한 칸에 남습니다. 그래서 하지 않은 것도 그대로 드러납니다.',
  },
  {
    head: '검증 못 한 건 못 했다고 씁니다',
    body: '원출처를 찾지 못한 수치는 본문에 그렇게 밝힙니다. 그럴듯하게 넘어가지 않습니다.',
  },
  {
    head: '고친 자리까지 남깁니다',
    body: '서고 전체가 공개 저장소입니다. 무엇을 언제 고쳤는지가 그대로 남아 있습니다.',
  },
]

export function Home({ onNavigate }: Props) {
  const { board, references, beautyInsights } = partitionByKind(projects)
  const published = board.filter((p) => stageOf(p) === 'content').length
  const average = averageLeadTimeDays(board)

  /** 설명보다 제목이 세다. 실제로 꽂혀 있는 것을 그대로 보여준다. */
  const recent = sortByRank(board).slice(0, 3)

  const figures = [
    {
      label: '서가에 꽂힌 것',
      value: projects.length,
      unit: '권',
      note: '프로젝트·참고 자료·뷰티 인사이트를 합한 수',
    },
    {
      label: '콘텐츠로 끝맺은 것',
      value: published,
      unit: '권',
      note: '읽고 해보고 발행까지 마친 것',
    },
    {
      label: '참고 자료',
      value: references.length + beautyInsights.length,
      unit: '건',
      note: '칸반을 타지 않고 보관만 하는 것 (뷰티 인사이트 포함)',
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
                  {tie('AI를 읽고, 만들어 보고, 남깁니다')}
                </p>
              </div>

              <div
                style={{ opacity: line, transform: `translateY(${(1 - line) * 20}px)` }}
                className="absolute inset-x-0 top-1/2 px-6 text-center will-change-[opacity,transform]"
                aria-hidden={line < 0.5}
              >
                <p className="mx-auto max-w-lg font-serif text-lg leading-relaxed text-paper md:text-xl">
                  {tie('리서치에서 시작해 직접 해보고, 콘텐츠로 끝맺습니다.')}
                </p>
                <p className="mt-4 font-serif text-sm text-paper/70">
                  {tie('그 사이에 걸린 시간까지 남깁니다')}
                </p>
              </div>

              {/*
                펼쳐진 종이 위에 쓰이는 글. 책등 주름이 가운데에서 살짝 오른쪽이라
                가운데 정렬하면 글자가 주름에 걸린다. 왼쪽 면 안쪽으로 넉넉히 들여 앉힌다.
              */}
              <div
                style={{ opacity: paper, transform: `translateY(${(1 - paper) * 16}px)` }}
                className="absolute inset-x-0 top-1/2 -translate-y-1/2 will-change-[opacity,transform]"
                aria-hidden={paper < 0.5}
              >
                <div className="grid px-6 md:grid-cols-2 md:px-0">
                  <div className="mx-auto w-full max-w-[30rem]">
                    <p className="font-display text-3xl leading-[1.5] text-white sm:text-4xl md:text-5xl">
                      읽은 것은
                      <br />
                      아직 제 것이 아닙니다
                    </p>
                    <p className="mt-6 font-serif text-sm leading-relaxed text-white/75 md:text-base">
                      {tie('읽고 지나간 것은 사흘이면 남지 않습니다.')}
                      <br />
                      {tie('해보고 적어 둔 것만 남습니다.')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )
        }}
      </ScrollVideo>

      {/*
        위 문장에서 이어지는 지면. 펼친 책처럼 두 면으로 나눈다.

        폭을 묶어 가운데 몰아 두면 두 단이 책등 주름에 바짝 붙는다. 그러지 않고
        화면을 반으로 갈라 각 면의 한가운데에 글을 앉힌다. 그래야 양쪽 바깥 여백과
        주름 쪽 여백이 비슷해져 진짜 펼친 책처럼 보인다.
      */}
      <section className="px-6 pt-32 pb-40 md:px-0">
        <div className="grid gap-y-24 md:grid-cols-2">
          <div className="mx-auto w-full max-w-[30rem]">
            <h2 className="font-display text-4xl leading-snug text-white md:text-5xl">
              {tie('해보고, 남겨야 제 것이 됩니다')}
            </h2>
            <p className="mt-8 font-serif text-base leading-loose text-paper md:text-lg">
              {tie(
                'AI에 관한 것을 읽고, 직접 만들어 보고, 그 과정에서 알게 된 것을 남깁니다. 결과만이 아니라 어디서 막혔고 무엇을 다시 했는지까지 적어 둡니다.',
              )}
            </p>
            <p className="mt-5 font-serif text-base leading-loose text-paper md:text-lg">
              {tie(
                '읽기만 한 것은 읽기만 한 칸에 그대로 남습니다. 그래서 이 서고는 제가 무엇을 하지 않았는지도 같이 보여줍니다.',
              )}
              {average !== null && (
                <>
                  {' '}
                  {tie('지금까지 리서치에서 발행까지 평균')}{' '}
                  <span className="text-white">{average}일</span> {tie('걸렸습니다.')}
                </>
              )}
            </p>

            {/* 규칙으로 적는 잔글. 주장보다 규칙이 믿긴다. */}
            <div className="mt-20 space-y-9 border-t border-white/25 pt-12">
              <p className="label text-paper">기록하는 방식</p>
              {RULES.map((rule, i) => (
                <div key={rule.head} className="flex gap-5">
                  <span className="label mt-1.5 shrink-0 text-white/70">{`0${i + 1}`}</span>
                  <div>
                    <h3 className="font-serif text-lg text-white">{tie(rule.head)}</h3>
                    <p className="mt-2.5 font-serif text-[15px] leading-loose text-paper">
                      {tie(rule.body)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-20 border-t border-white/25 pt-12">
              <h3 className="font-display text-3xl leading-snug text-white md:text-4xl">
                {tie('같은 길을 가려는 분께')}
              </h3>
              <p className="mt-7 font-serif text-base leading-loose text-paper md:text-lg">
                {tie(
                  '앞서간 사람의 정리된 결론만 보고 싶으시다면 이 서고는 맞지 않습니다. 여기 남는 것은 과정입니다. 무엇을 읽었고, 무엇을 해봤고, 어디서 막혔는지.',
                )}
              </p>
              <p className="mt-5 font-serif text-base leading-loose text-paper md:text-lg">
                {tie('같은 걸 해보려다 같은 데서 막혔던 분이라면, 이 기록이 쓸모가 있을 겁니다.')}
              </p>
              <p className="mt-7 font-serif text-[15px] leading-loose text-paper">
                {tie(
                  '새 글은 조용히 쌓입니다. 알림도 구독도 없습니다. 생각나실 때 들러서 그동안 늘어난 것을 보시면 됩니다.',
                )}
              </p>
            </div>
          </div>

          {/* 오른쪽 면 */}
          <div className="mx-auto w-full max-w-[30rem]">
            <dl className="grid gap-9 border-t border-white/25 pt-12">
              {figures.map((f) => (
                <div key={f.label}>
                  <dt className="label text-paper">{tie(f.label)}</dt>
                  <dd className="mt-2.5 font-display text-4xl leading-none text-white tabular-nums">
                    {f.value}
                    <span className="ml-2 font-serif text-base text-paper">{f.unit}</span>
                  </dd>
                  <p className="mt-3 font-serif text-[13px] leading-relaxed text-paper">
                    {tie(f.note)}
                  </p>
                </div>
              ))}
            </dl>

            {recent.length > 0 && (
              <div className="mt-20 border-t border-white/25 pt-12">
                <p className="label text-paper">지금 서가에 있는 것</p>
                <p className="mt-3.5 font-serif text-[15px] leading-loose text-paper">
                  {tie('설명보다 제목이 빠릅니다. 최근에 꽂은 것을 그대로 옮겨 둡니다.')}
                </p>
                <ul className="mt-7 space-y-6">
                  {recent.map((p) => (
                    <li key={p.id}>
                      <p className="font-serif text-base leading-snug text-white md:text-lg">
                        {tie(p.title)}
                      </p>
                      <p className="label mt-2 text-paper">
                        {p.category ? CATEGORY_LABELS[p.category] : '미분류'} ·{' '}
                        {STAGE_LABELS[stageOf(p)]}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-20 border-t border-white/25 pt-12">
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
              <p className="mt-6 font-serif text-[15px] leading-loose text-paper">
                {tie('리서치 완료 · 실행 완료 · 콘텐츠 완료 세 칸으로 나뉘어 있습니다.')}
              </p>
            </div>

            {/* 책 뒤쪽 판권지처럼, 굳이 크게 말할 것 없는 것들을 잔글로 적어 둔다. */}
            <div className="mt-20 space-y-5 border-t border-white/25 pt-12 font-serif text-[15px] leading-loose text-paper">
              <p className="label text-paper">여기 적어 두는 것</p>
              <p>
                {tie(
                  '새 글은 링크 하나에서 시작합니다. 릴스나 글 주소를 던지면 에이전트가 원문을 받아 정리해 서가에 꽂습니다.',
                )}
              </p>
              <p>
                분류는 {CATEGORIES.length}개입니다 —{' '}
                {CATEGORIES.map((c) => CATEGORY_LABELS[c]).join(' · ')}. {tie('애매하면 비워 둡니다.')}
              </p>
              <p>{tie('숫자는 이 페이지를 열 때마다 다시 셉니다. 손으로 적어 둔 값이 아닙니다.')}</p>
              <p>{tie('참고 자료는 칸반을 타지 않습니다. 언젠가 쓸 것 같아 꽂아 둔 것들입니다.')}</p>
              <p>{tie('완성된 것만 모이지는 않습니다. 하다가 멈춘 것도 멈춘 자리에 그대로 둡니다.')}</p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
