/**
 * 붙여넣은 이미지를 레포에 올릴 때 쓰는 규칙.
 *
 * 이미지는 `content/images/` 아래 연·월로 나눠 쌓는다. 파일명은 절대 겹치지 않게 만들고
 * 한 번 올린 파일은 덮어쓰지 않는다 — 예전 글이 가리키던 그림이 바뀌면 안 된다.
 */

/** 스크린샷 기준으로 넉넉한 상한. 깃허브 Contents API에 통째로 실어 보내야 한다. */
export const MAX_IMAGE_BYTES = 4_000_000

const EXTENSIONS: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/svg+xml': 'svg',
}

/** 다룰 수 있는 형식이면 확장자를, 아니면 null. */
export function extensionFor(mimeType: string): string | null {
  return EXTENSIONS[mimeType.toLowerCase()] ?? null
}

const pad = (n: number) => String(n).padStart(2, '0')

export function imagePath(now: Date, ext: string, random = Math.random().toString(36).slice(2, 8)) {
  return `content/images/${now.getFullYear()}/${pad(now.getMonth() + 1)}/${pad(now.getDate())}-${random}.${ext}`
}

/**
 * 본문에 적을 주소.
 *
 * 사이트가 다시 빌드될 때까지 기다리지 않아도 바로 보이도록 깃허브 원본 주소를 쓴다.
 * 레포가 공개돼 있는 한 이 주소는 계속 산다.
 */
export function rawUrl(owner: string, repo: string, branch: string, path: string) {
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`
}
