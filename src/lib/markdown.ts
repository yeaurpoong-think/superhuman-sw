import { dump, load } from 'js-yaml'

/**
 * frontmatter만 건드리고 본문 바이트는 손대지 않는다.
 *
 * 에디터가 본문을 다시 직렬화하면 에이전트가 쓴 표기가 통째로 바뀐다.
 * 드래그로 타임스탬프 하나 고치는 일이 전체 파일 diff가 되면 안 된다.
 */

export type Frontmatter = Record<string, unknown>

const FENCE = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*\r?\n?/

export function splitFile(text: string): { frontmatter: Frontmatter; body: string } {
  const m = text.match(FENCE)
  if (!m) return { frontmatter: {}, body: text }
  const parsed = load(m[1])
  return {
    frontmatter: parsed && typeof parsed === 'object' ? (parsed as Frontmatter) : {},
    body: text.slice(m[0].length),
  }
}

/** YAML은 Date를 그대로 뱉는다. 계약이 ISO 문자열이므로 쓰기 전에 맞춰 둔다. */
function normalize(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString()
  if (Array.isArray(value)) return value.map(normalize)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, normalize(v)]))
  }
  return value
}

function toYaml(frontmatter: Frontmatter): string {
  return dump(normalize(frontmatter), { lineWidth: -1, noRefs: true, quotingType: "'" })
}

export function buildFile(frontmatter: Frontmatter, body: string): string {
  const trimmed = body.replace(/^\n+/, '').replace(/\s*$/, '')
  return `---\n${toYaml(frontmatter)}---\n\n${trimmed}\n`
}

/** 본문은 원본 문자열을 그대로 다시 붙인다. */
export function patchFrontmatter(text: string, patch: Frontmatter): string {
  const { frontmatter, body } = splitFile(text)
  return `---\n${toYaml({ ...frontmatter, ...patch })}---\n${body.startsWith('\n') ? '' : '\n'}${body}`
}
