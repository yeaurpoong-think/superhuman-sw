/**
 * 깃허브 토큰을 비밀번호로 잠가 public/vault.json 으로 만든다.
 *
 *   npm run seal
 *
 * 토큰은 이 과정에서 화면에 찍히지 않고 디스크에도 평문으로 남지 않는다.
 * 만들어진 금고 파일은 공개되므로, 방어는 오직 비밀번호 길이에 달려 있다.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { createInterface } from 'node:readline'
import { resolve } from 'node:path'
import { MIN_PASSWORD_LENGTH, sealToken } from '../src/lib/vault.ts'

const OUT = resolve(import.meta.dirname, '../public/vault.json')

function ask(query, hidden = false) {
  return new Promise((done) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true })
    rl.muted = false
    rl._writeToOutput = (str) => {
      if (!rl.muted) rl.output.write(str)
    }
    rl.question(query, (answer) => {
      rl.close()
      if (hidden) process.stdout.write('\n')
      done(answer.trim())
    })
    rl.muted = hidden
  })
}

// 자동화·테스트용 탈출구. 평소에는 물어보는 쪽을 쓴다.
const token = process.env.SEAL_TOKEN ?? (await ask('깃허브 토큰 (화면에 보이지 않는다): ', true))
if (!token) {
  console.error('토큰이 비었다.')
  process.exit(1)
}

const password = process.env.SEAL_PASSWORD ?? (await ask('비밀번호: ', true))
if (password.length < MIN_PASSWORD_LENGTH) {
  console.error(
    `비밀번호가 ${MIN_PASSWORD_LENGTH}자보다 짧다. 금고 파일이 공개되므로 짧은 비밀번호는 열린 금고나 마찬가지다.`,
  )
  process.exit(1)
}

if (!process.env.SEAL_PASSWORD) {
  const again = await ask('비밀번호 확인: ', true)
  if (again !== password) {
    console.error('두 번 친 비밀번호가 다르다.')
    process.exit(1)
  }
}

const vault = await sealToken(token, password)
await mkdir(resolve(import.meta.dirname, '../public'), { recursive: true })
await writeFile(OUT, `${JSON.stringify(vault, null, 2)}\n`, 'utf8')

console.log(`✓ public/vault.json 을 만들었다 (반복 ${vault.iterations.toLocaleString()}회)`)
console.log('  커밋·푸시하면 어느 기기에서든 이 비밀번호로 편집할 수 있다.')
