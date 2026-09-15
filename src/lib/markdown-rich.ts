import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'
import { unified } from 'unified'
import { visit } from 'unist-util-visit'

/* ── 리치 편집기 안전 게이트 ─────────────────────────────────────────── */

/**
 * 리치 편집기(TipTap)는 마크다운이 아니라 ProseMirror를 왕복시킨다.
 * 저장할 때 본문 전체가 다시 직렬화되므로, 편집기가 모르는 문법은 그 순간 사라진다.
 *
 * 그래서 열기 전에 먼저 본다. 하나라도 걸리면 리치 편집기를 열지 않고 원문 모드로 연다.
 * "편집기가 내 내용을 먹었다" 부류의 사고를 통째로 없애는 장치다.
 */
const UNSUPPORTED = new Set([
  'html', // 원시 HTML — 지워지거나 글자로 탈출된다
  'footnoteDefinition',
  'footnoteReference',
  'definition', // 참조형 링크 [x]: url
  'table', // StarterKit에 표 확장이 없다
])

export type GateResult = { safe: true } | { safe: false; reason: string }

const REASON: Record<string, string> = {
  html: '원시 HTML',
  footnoteDefinition: '각주',
  footnoteReference: '각주',
  definition: '참조형 링크',
  table: '표',
}

export function richEditorGate(body: string): GateResult {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(body)
  let found: string | null = null
  visit(tree, (node) => {
    if (!found && UNSUPPORTED.has(node.type)) found = node.type
  })
  if (found === null) return { safe: true }
  return { safe: false, reason: REASON[found] ?? found }
}

/**
 * 표기를 한 방언으로 수렴시킨다.
 * 사람이 쓴 것과 에이전트가 쓴 것이 같은 모양이 되어야 diff가 작아진다.
 */
export function normalizeMarkdown(md: string): string {
  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkStringify, { bullet: '-', emphasis: '_', fences: true, rule: '-' })
    .processSync(md)
    .toString()
}
