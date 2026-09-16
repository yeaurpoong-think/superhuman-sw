/**
 * 한글 줄바꿈 다듬기.
 *
 * `word-break: keep-all` 은 어절이 한가운데서 쪼개지는 것만 막는다. 어절과 어절
 * 사이는 어디서든 갈리므로 "그래서 이 / 서고는", "무엇을 다시 / 했는지" 처럼
 * 한 덩어리로 읽어야 할 말이 두 줄로 찢어진다. 읽는 사람은 그 자리에서 한 번
 * 멈춘다.
 *
 * 한국어에서 찢어지면 특히 어색한 자리는 둘이다.
 *
 *   1. 관형사·부사 뒤   — "이 서고", "다시 했다", "더 넣는다"
 *   2. 의존명사 앞      — "하는 것", "할 수", "갈 때", "아는 만큼"
 *
 * 둘 다 혼자서는 뜻이 서지 않아 뒤(또는 앞) 말에 기대는 말이다. 그 사이의
 * 띄어쓰기를 줄바꿈 없는 공백으로 바꿔 한 덩어리로 묶는다. 눈에 보이는 간격은
 * 그대로고 줄만 안 갈린다.
 */

/** 뒤 말에 붙여 읽는 말. 이 뒤에서 줄이 갈리면 안 된다. */
const LEANS_FORWARD = [
  // 관형사
  '이', '그', '저', '어느', '무슨', '웬', '온갖', '여러', '모든', '각',
  '한', '두', '세', '네', '다섯', '여섯', '몇', '첫', '새', '옛',
  // 부사
  '더', '덜', '못', '안', '다시', '또', '곧', '잘', '늘', '늘상', '막', '갓',
  '아주', '매우', '너무', '가장', '제일', '조금', '좀', '꽤', '퍽', '거의',
  '이미', '아직', '벌써', '먼저', '함께', '같이', '서로', '직접', '오직', '단지',
]

/** 앞 말에 붙여 읽는 말. 이 앞에서 줄이 갈리면 안 된다. */
const LEANS_BACK = [
  '것', '것이', '것을', '것은', '것도', '것만', '것과', '것이다', '것입니다',
  '수', '수가', '수는', '수도', '때', '때는', '때도', '때가', '적', '적이', '적은',
  '줄', '만큼', '뿐', '채', '척', '체', '터', '데', '바', '지', '듯', '양',
  '중', '편', '김', '참', '리', '나름', '따름', '마련', '무렵', '까닭',
  '번', '개', '명', '권', '건', '분', '살', '해', '달', '가지', '군데', '마디',
]

/**
 * 보조용언. 앞 동사에 매달려 하나의 뜻을 만든다 — "알게 되다", "만들어 보다".
 * 앞 어절이 -게/-어/-아/-여/-지/-해 로 끝날 때만 보조용언으로 본다.
 * (-해 는 "해 보다"·"해 두다"처럼 아주 흔해서 넣는다)
 * (-고 는 "그리고" 같은 접속사가 너무 많이 걸려서 뺀다)
 */
const AUXILIARIES = ['되', '하', '있', '없', '보', '주', '가', '오', '두', '놓', '버리', '싶', '말', '드리']

/** 줄바꿈 없는 공백. 눈에 보이는 폭은 보통 공백과 같다. */
const NBSP = '\u00A0'

const group = (words: string[]) => words.join('|')

/**
 * 관형사·부사 뒤. 앞이 문장 시작이거나 공백류여야 한다 —
 * "많이"의 "이", "부단히"의 "히" 같은 꼬리를 잡으면 안 된다.
 */
const FORWARD = new RegExp(`(^|[\\s(“‘"'])(${group(LEANS_FORWARD)}) `, 'g')

/**
 * 의존명사 앞. 뒤가 어절 끝(공백·문장부호·끝)이어야 한다 —
 * "것"으로 시작하는 다른 낱말에 걸리지 않게 한다.
 */
const BACK = new RegExp(` (${group(LEANS_BACK)})(?=[\\s.,!?)”’"']|$)`, 'g')

/**
 * 한글 음절에서 종성을 떼어 어간만 남긴다.
 *
 * 보조용언은 활용하면서 종성이 바뀐다 — 되다는 "된·됩·되어", 두다는 "둡·둔".
 * 한글 음절은 초성·중성·종성이 한 글자에 합쳐져 있어서 활용형을 일일이 적어 둘
 * 수가 없다. 종성만 떼어 내고 어간으로 견준다.
 */
const HANGUL_BASE = 0xac00
const HANGUL_COUNT = 11172
const FINALS = 28

function withoutFinal(syllable: string): string {
  const code = syllable.charCodeAt(0) - HANGUL_BASE
  if (code < 0 || code >= HANGUL_COUNT) return syllable
  return String.fromCharCode(HANGUL_BASE + code - (code % FINALS))
}

const AUX_STEMS = new Set(AUXILIARIES)

/** 이 어절이 보조용언으로 시작하는가. 종성이 붙은 활용형도 같이 본다. */
function startsWithAuxiliary(word: string): boolean {
  const one = word.slice(0, 1)
  if (AUX_STEMS.has(one) || AUX_STEMS.has(withoutFinal(one))) return true
  // 버리다·드리다처럼 어간이 두 음절인 것
  const two = word.slice(0, 2)
  return two.length === 2 && AUX_STEMS.has(one + withoutFinal(two.slice(1)))
}

/**
 * 보조용언이 아무리 길어도 통째로 묶이면 그 줄만 헐거워진다.
 * 합쇼체까지 들어가는 다섯 음절("되었습니다")까지만 한 덩어리로 본다.
 */
const MAX_AUX_SYLLABLES = 5

/** 앞 어절이 연결어미로 끝나고 뒤 어절이 짧을 때만 후보로 넘긴다. */
const AUX = new RegExp(
  `([가-힣]*[게어아여지해]) ([가-힣]{1,${MAX_AUX_SYLLABLES}})(?=[\\s.,!?)”’"']|$)`,
  'g',
)

/**
 * 어색한 자리의 띄어쓰기를 줄바꿈 없는 공백으로 바꾼다.
 * 글자는 하나도 더하거나 빼지 않는다 — 공백의 종류만 바뀐다.
 */
export function tie(text: string): string {
  return text
    .replace(FORWARD, (_, before, word) => `${before}${word}${NBSP}`)
    .replace(BACK, (_, word) => `${NBSP}${word}`)
    .replace(AUX, (whole, stem, next) =>
      startsWithAuxiliary(next) ? `${stem}${NBSP}${next}` : whole,
    )
}
