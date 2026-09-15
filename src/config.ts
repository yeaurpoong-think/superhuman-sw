export const REPO = {
  owner: 'yeaurpoong-think',
  repo: 'superhuman-sw',
  branch: 'main',
} as const

export const PROJECTS_DIR = 'content/projects'

export const API_BASE = `https://api.github.com/repos/${REPO.owner}/${REPO.repo}`

/** vite.config.ts 의 base 와 같은 값이어야 한다. */
export const VAULT_URL = '/superhuman-sw/vault.json'
