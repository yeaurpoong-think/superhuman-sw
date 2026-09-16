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
 * 홈 히어로 영상. `public/hero.mp4` 에 올리면 바로 붙는다.
 * 파일이 없으면 히어로는 글자만으로 조용히 내려앉는다.
 */
export const HERO_VIDEO = '/superhuman-sw/hero.mp4'
export const HERO_POSTER = '/superhuman-sw/hero-poster.jpg'
