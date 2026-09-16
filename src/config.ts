export const REPO = {
  owner: 'yeaurpoong-think',
  repo: 'superhuman-sw',
  branch: 'main',
} as const

export const PROJECTS_DIR = 'content/projects'

export const API_BASE = `https://api.github.com/repos/${REPO.owner}/${REPO.repo}`

/** vite.config.ts 의 base 와 같은 값이어야 한다. */
export const VAULT_URL = '/superhuman-sw/vault.json'

/**
 * 홈 히어로 영상. 스크롤에 물려 감기므로 키프레임이 촘촘한 판만 쓴다.
 * 조건과 재인코딩 명령은 docs/HERO-VIDEO.md 참고.
 */
export const HERO_VIDEO = '/superhuman-sw/hero.mp4'
/** 좁은 화면용. 1080을 통째로 받게 두면 휴대폰에서 낭비다. */
export const HERO_VIDEO_SMALL = '/superhuman-sw/hero-720.mp4'
export const HERO_POSTER = '/superhuman-sw/hero-poster.jpg'

/**
 * 영상의 마지막 프레임을 그대로 뽑은 이미지.
 * 영상이 끝나고 스크롤이 더 내려가면 이 그림이 그대로 페이지 바탕이 된다.
 * 픽셀이 같아야 이어지는 티가 안 나므로, 영상을 바꾸면 이 그림도 그 영상에서 다시 뽑아야 한다.
 */
export const HERO_PAGE = '/superhuman-sw/hero-page.png'

/**
 * 영상 속 장면이 스크롤 어디쯤에 오는지 (12.5초 기준).
 * 글자를 넣고 빼는 시점을 여기에 맞춘다.
 */
export const HERO_BEATS = {
  /** 책 한 권이 화면 앞을 스쳐 지나감 */
  passBy: 0.17,
  /** 조용한 통로 구간 */
  calm: [0.32, 0.56],
  /** 마지막 책이 다가오기 시작 */
  finaleStarts: 0.56,
  /** 펼친 종이가 화면을 덮음 */
  covered: 0.95,
} as const

/**
 * 서고 페이지 바탕. 종이 뒤로 비치는 서가 사진이다.
 * 글은 종이 위에 있으므로 바탕은 어둡게 눌러 두고 질감만 남긴다.
 */
export const LIBRARY_BG = '/superhuman-sw/library-bg.jpg'
