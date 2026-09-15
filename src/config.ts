export const REPO = {
  owner: 'yeaurpoong-think',
  repo: 'superhuman-sw',
  branch: 'main',
} as const

export const PROJECTS_DIR = 'content/projects'

/**
 * 편집 서버 주소. 깃허브 토큰은 이 서버에만 있다.
 *
 * `worker/` 를 배포하면 나오는 주소를 여기 적는다 (끝에 슬래시 없이).
 * 예: https://superhuman-sw-api.<계정이름>.workers.dev
 *
 * 비워 두면 사이트는 읽기 전용으로만 뜬다.
 */
export const API_BASE = ''

export const isEditingConfigured = () => API_BASE.length > 0
