/**
 * 구글 폰트를 사이트 안으로 가져온다.
 *
 *   node scripts/vendor-font.mjs "Nanum Brush Script" nanum-brush
 *   node scripts/vendor-font.mjs "Grenze Gotisch:wght@700" grenze
 *
 * 왜 직접 담는가:
 *  - 방문자가 폰트를 받을 때 구글로 접속 정보가 나가지 않는다
 *  - CSP에 외부 출처를 열어 줄 필요가 없다
 *  - 구글이 주소를 바꿔도 사이트가 멀쩡하다
 *
 * 한글 폰트는 자모 구간별로 90여 조각으로 쪼개져 있다. 전부 받아 두지만
 * 브라우저는 화면에 실제로 쓰인 글자가 든 조각만 내려받는다.
 */
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'

const [family, slug] = process.argv.slice(2)
if (!family || !slug) {
  console.error('사용법: node scripts/vendor-font.mjs "Font Name[:wght@700]" 파일이름')
  process.exit(1)
}

const ROOT = resolve(import.meta.dirname, '..')
const OUT_DIR = resolve(ROOT, 'public/fonts')
const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, '+')}&display=swap`

const css = await fetch(cssUrl, { headers: { 'User-Agent': UA } }).then((r) => {
  if (!r.ok) throw new Error(`폰트 목록을 못 받았다 (${r.status}): ${family}`)
  return r.text()
})

await mkdir(OUT_DIR, { recursive: true })
// 같은 이름으로 다시 받을 때 옛 조각이 남지 않게 지운다.
for (const f of await readdir(OUT_DIR).catch(() => [])) {
  if (f.startsWith(`${slug}-`)) await rm(resolve(OUT_DIR, f))
}

const urls = [...css.matchAll(/https:\/\/[^)]+\.woff2/g)].map((m) => m[0])
let local = css
let bytes = 0

for (const [i, url] of urls.entries()) {
  const name = `${slug}-${i}.woff2`
  const buf = new Uint8Array(await fetch(url).then((r) => r.arrayBuffer()))
  await writeFile(resolve(OUT_DIR, name), buf)
  bytes += buf.byteLength
  local = local.replaceAll(url, `/superhuman-sw/fonts/${name}`)
}

await writeFile(resolve(OUT_DIR, `${slug}.css`), `${local.trim()}\n`, 'utf8')

console.log(
  `✓ ${family} → public/fonts/${slug}.css  (조각 ${urls.length}개, ${(bytes / 1_000_000).toFixed(2)}MB)`,
)
console.log('  브라우저는 화면에 쓰인 글자가 든 조각만 내려받는다.')
