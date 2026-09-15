import { describe, expect, it } from 'vitest'
import { buildFile, patchFrontmatter, splitFile } from './markdown'

const FILE = `---
id: a
title: 제목
rank: a0
researched_at: 2026-09-01T01:00:00Z
---

## 본문

- 목록 하나
- 목록 둘

\`\`\`js
const x = 1
\`\`\`
`

describe('splitFile', () => {
  it('frontmatter와 본문을 갈라낸다', () => {
    const { frontmatter, body } = splitFile(FILE)
    expect(frontmatter.id).toBe('a')
    expect(body).toContain('## 본문')
    expect(body).not.toContain('rank')
  })

  it('frontmatter가 없으면 전부 본문으로 본다', () => {
    const { frontmatter, body } = splitFile('그냥 글')
    expect(frontmatter).toEqual({})
    expect(body).toBe('그냥 글')
  })
})

describe('patchFrontmatter', () => {
  it('본문을 한 글자도 바꾸지 않는다', () => {
    const before = splitFile(FILE).body
    const after = splitFile(patchFrontmatter(FILE, { rank: 'a1' })).body
    expect(after).toBe(before)
  })

  it('코드블록과 목록 서식을 그대로 둔다', () => {
    const out = patchFrontmatter(FILE, { rank: 'a1' })
    expect(out).toContain('```js\nconst x = 1\n```')
    expect(out).toContain('- 목록 하나')
  })

  it('있는 필드는 바꾸고 없는 필드는 추가한다', () => {
    const out = splitFile(patchFrontmatter(FILE, { rank: 'zz', executed_at: '2026-09-04T00:00:00Z' }))
    expect(out.frontmatter.rank).toBe('zz')
    expect(out.frontmatter.executed_at).toBe('2026-09-04T00:00:00Z')
    expect(out.frontmatter.title).toBe('제목')
  })

  it('null을 넣으면 값이 null로 남는다 — 키를 지우지 않는다', () => {
    const out = splitFile(patchFrontmatter(FILE, { executed_at: null }))
    expect(out.frontmatter).toHaveProperty('executed_at')
    expect(out.frontmatter.executed_at).toBeNull()
  })

  it('타임스탬프를 따옴표 없는 Date가 아니라 ISO 문자열로 적는다', () => {
    const out = patchFrontmatter(FILE, { executed_at: new Date('2026-09-04T00:00:00Z') })
    expect(out).toContain("executed_at: '2026-09-04T00:00:00.000Z'")
  })

  it('계약에 없는 키도 보존한다', () => {
    const withExtra = patchFrontmatter(FILE, { note: '헤르메스 메모' })
    const out = splitFile(patchFrontmatter(withExtra, { rank: 'b0' }))
    expect(out.frontmatter.note).toBe('헤르메스 메모')
  })
})

describe('buildFile', () => {
  it('frontmatter와 본문을 합쳐 완성된 파일을 만든다', () => {
    const text = buildFile({ id: 'a', title: '제목' }, '본문이다')
    expect(text.startsWith('---\n')).toBe(true)
    expect(text.endsWith('본문이다\n')).toBe(true)
    expect(splitFile(text).frontmatter.id).toBe('a')
  })
})
