/**
 * 리서치 카드를 하나 만든다. 에이전트(클로드·헤르메스)가 쓰는 주 등록 경로다.
 *
 *   npm run new -- --title "인스타 훅 3초 구조 분해" --url "https://www.instagram.com/reel/XXXX/" --category content
 *
 * 본문은 세 가지 방법으로 넣는다:
 *   --body-file 리서치.md      파일에서 읽는다
 *   cat 리서치.md | npm run new -- --title "..."   파이프로 넘긴다
 *   (아무것도 안 주면) 표준 6섹션 뼈대가 들어간다
 *
 * id·rank·researched_at 처럼 틀리기 쉬운 값은 전부 여기서 계산한다.
 * 손으로 frontmatter를 짜지 마라.
 */
import { readFile, readdir, writeFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import { generateKeyBetween } from 'fractional-indexing'
import matter from 'gray-matter'
import { CATEGORIES, KINDS, parseProject, sortByRank, stageOf } from '../src/lib/schema.ts'

const ROOT = resolve(import.meta.dirname, '..')
const DIR = resolve(ROOT, 'content/projects')

function parseArgs(argv) {
  const args = { url: [] }
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i]
    if (!key.startsWith('--')) continue
    const name = key.slice(2)
    const value = argv[i + 1]?.startsWith('--') ? 'true' : argv[++i]
    if (name === 'url') args.url.push(value)
    else args[name] = value
  }
  return args
}

const args = parseArgs(process.argv.slice(2))

if (!args.title) {
  console.error('제목이 필요하다:  npm run new -- --title "제목" [--url 링크] [--category content]')
  process.exit(1)
}

if (args.category && !CATEGORIES.includes(args.category)) {
  console.error(`분류는 ${CATEGORIES.join(' · ')} 중 하나여야 한다. 애매하면 아예 빼라.`)
  process.exit(1)
}

if (args.kind && !KINDS.includes(args.kind)) {
  console.error(`kind는 ${KINDS.join(' · ')} 중 하나여야 한다.`)
  process.exit(1)
}

/** 인스타 주소 모양으로 종류를 알아낸다. RESEARCH-PIPELINE.md 의 판별 규칙과 같다. */
function sourceType(url) {
  if (/instagram\.com\/reel\//.test(url)) return 'reel'
  if (/instagram\.com\/p\//.test(url)) return 'carousel'
  if (/youtube\.com|youtu\.be|vimeo\.com/.test(url)) return 'video'
  return 'link'
}

const existing = []
for (const file of await readdir(DIR).catch(() => [])) {
  if (!file.endsWith('.md') || file.startsWith('_')) continue
  const { data } = matter(await readFile(resolve(DIR, file), 'utf8'))
  const parsed = parseProject(data, file)
  if (parsed.ok) existing.push(parsed.value)
}

const ids = new Set(existing.map((p) => p.id))

/** 한글 제목은 파일명이 될 수 없다. 날짜와 짧은 난수로 영구 주소를 만든다. */
function makeId() {
  if (args.id) return args.id
  const stamp = new Date().toISOString().slice(0, 10).replaceAll('-', '')
  for (let i = 0; i < 50; i += 1) {
    const candidate = `p-${stamp}-${Math.random().toString(36).slice(2, 6)}`
    if (!ids.has(candidate)) return candidate
  }
  throw new Error('id를 만들지 못했다')
}

const id = makeId()
if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) {
  console.error(`id는 소문자·숫자·하이픈만 쓴다: ${id}`)
  process.exit(1)
}
if (ids.has(id)) {
  console.error(`이미 있는 id다: ${id}`)
  process.exit(1)
}

// 새 리서치는 '리서치 완료' 칸 맨 위에 놓는다.
const firstInResearch = sortByRank(existing.filter((p) => stageOf(p) === 'research'))[0]
const rank = generateKeyBetween(null, firstInResearch?.rank ?? null)

const TEMPLATE = `## 🎯 핵심 요약

결론부터. 3~4문장.

## 💡 핵심 인사이트

- 왜 중요한가

## 🛠️ 적용법 가이드

## 💼 활용 예시

## ⚠️ 주의사항

## 📚 원본 링크
`

async function readBody() {
  if (args['body-file']) return readFile(resolve(process.cwd(), args['body-file']), 'utf8')
  if (!process.stdin.isTTY) {
    const chunks = []
    for await (const chunk of process.stdin) chunks.push(chunk)
    const piped = Buffer.concat(chunks).toString('utf8').trim()
    if (piped) return piped
  }
  return TEMPLATE
}

const body = (await readBody()).trim()

const frontmatter = {
  id,
  title: args.title,
  rank,
  kind: args.kind ?? 'project',
  category: args.category ?? null,
  tags: args.tags ? args.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
  sources: args.url.map((url) => ({ url, type: args.type ?? sourceType(url) })),
  post_url: null,
  researched_at: new Date().toISOString(),
  executed_at: null,
  published_at: null,
}

// 쓰기 전에 계약을 통과하는지 확인한다. 깨진 파일을 레포에 남기지 않는다.
const check = parseProject(frontmatter, `${id}.md`)
if (!check.ok) {
  console.error('계약을 어겼다:')
  for (const issue of check.issues) console.error(`  ${issue}`)
  process.exit(1)
}

const file = resolve(DIR, `${id}.md`)
await writeFile(file, `${matter.stringify(`\n${body}\n`, frontmatter).trimStart()}`, 'utf8')

console.log(`✓ content/projects/${basename(file)}`)
console.log('  본문을 채우고 커밋하면 리서치 완료 칸에 뜬다.')
