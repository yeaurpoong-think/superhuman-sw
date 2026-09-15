/**
 * content/projects/*.md 를 읽어 src/generated/projects.json 으로 굽는다.
 * 방문자는 이 JSON만 받으므로 런타임에 깃허브를 부르지 않는다.
 *
 *   node scripts/build-content.mjs          빌드용 산출물 생성
 *   node scripts/build-content.mjs --check  검증만. 위반이 있으면 1번 코드로 죽는다 (CI용)
 */
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import matter from 'gray-matter'
import { parseProject } from '../src/lib/schema.ts'

const ROOT = resolve(import.meta.dirname, '..')
const SRC_DIR = resolve(ROOT, 'content/projects')
const OUT_DIR = resolve(ROOT, 'src/generated')
const OUT_FILE = resolve(OUT_DIR, 'projects.json')
const checkOnly = process.argv.includes('--check')

const files = (await readdir(SRC_DIR).catch(() => []))
  .filter((f) => f.endsWith('.md') && !f.startsWith('_'))
  .sort()

const projects = []
const errors = []

for (const file of files) {
  const rel = `content/projects/${file}`
  const stem = basename(file, '.md')
  let data, content
  try {
    ;({ data, content } = matter(await readFile(resolve(SRC_DIR, file), 'utf8')))
  } catch (e) {
    errors.push({ file: rel, issues: [`frontmatter를 읽을 수 없다: ${e.message}`] })
    continue
  }

  const parsed = parseProject(data, rel)
  if (!parsed.ok) {
    errors.push({ file: rel, issues: parsed.issues })
    continue
  }
  // id는 파일명이자 영구 주소다. 둘이 어긋나면 링크가 깨진다.
  if (parsed.value.id !== stem) {
    errors.push({ file: rel, issues: [`id(${parsed.value.id})가 파일명(${stem})과 다르다`] })
    continue
  }
  projects.push({ ...parsed.value, body: content.trim(), file: rel })
}

const dupes = projects
  .map((p) => p.id)
  .filter((id, i, all) => all.indexOf(id) !== i)
if (dupes.length > 0) errors.push({ file: '(전체)', issues: [`id 중복: ${[...new Set(dupes)].join(', ')}`] })

for (const e of errors) {
  console.error(`✗ ${e.file}`)
  for (const issue of e.issues) console.error(`    ${issue}`)
}

if (checkOnly) {
  if (errors.length > 0) {
    console.error(`\n${errors.length}개 파일이 content/CONTRACT.md 의 형식을 어겼다.`)
    process.exit(1)
  }
  console.log(`✓ 프로젝트 ${projects.length}건 모두 계약을 지켰다.`)
  process.exit(0)
}

await mkdir(OUT_DIR, { recursive: true })
await writeFile(OUT_FILE, `${JSON.stringify({ projects, errors }, null, 2)}\n`, 'utf8')
console.log(`✓ 프로젝트 ${projects.length}건${errors.length ? `, 오류 ${errors.length}건` : ''} → src/generated/projects.json`)
