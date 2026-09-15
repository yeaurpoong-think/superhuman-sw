import { describe, expect, it } from 'vitest'
import { checkPassword, openVault, sealToken } from './vault'

/** 테스트에서는 반복 횟수를 낮춘다. 실제 금고는 600,000회를 쓴다. */
const FAST = 1000
const PASSWORD = '아주-긴-비밀번호-입니다-16자넘음'

describe('금고', () => {
  it('맞는 비밀번호로 원래 토큰이 그대로 나온다', async () => {
    const vault = await sealToken('github_pat_example_value', PASSWORD, FAST)
    expect(await openVault(vault, PASSWORD)).toBe('github_pat_example_value')
  })

  it('틀린 비밀번호는 쓰레기 값이 아니라 실패를 준다', async () => {
    const vault = await sealToken('github_pat_example_value', PASSWORD, FAST)
    await expect(openVault(vault, '틀린-비밀번호-아주-길게')).rejects.toThrow('비밀번호가 다르다')
  })

  it('한 글자만 달라도 열리지 않는다', async () => {
    const vault = await sealToken('t', PASSWORD, FAST)
    await expect(openVault(vault, `${PASSWORD}x`)).rejects.toThrow()
  })

  it('같은 토큰·비밀번호라도 매번 다른 암호문이 된다', async () => {
    const a = await sealToken('same', PASSWORD, FAST)
    const b = await sealToken('same', PASSWORD, FAST)
    expect(a.ciphertext).not.toBe(b.ciphertext)
    expect(a.salt).not.toBe(b.salt)
  })

  it('암호문 어디에도 토큰 원문이 남지 않는다', async () => {
    const vault = await sealToken('github_pat_SECRET', PASSWORD, FAST)
    expect(JSON.stringify(vault)).not.toContain('SECRET')
  })

  it('반복 횟수를 금고에 적어 둬야 나중에 열 수 있다', async () => {
    const vault = await sealToken('t', PASSWORD, FAST)
    expect(vault.iterations).toBe(FAST)
    expect(vault.kdf).toBe('PBKDF2-SHA256')
  })
})

describe('비밀번호 검사', () => {
  it('10자보다 짧으면 막는다', () => {
    expect(checkPassword('Ab1!xyz')).toContain('10자 이상')
  })

  it('짧은데 종류가 두 가지뿐이면 막는다', () => {
    expect(checkPassword('abcdefg123')).toContain('세 종류 이상')
    expect(checkPassword('ABCDEFG123')).toContain('세 종류 이상')
  })

  it('10자에 세 종류를 섞으면 통과한다', () => {
    expect(checkPassword('srb!otek23')).toBeNull()
    expect(checkPassword('Abc!defg12')).toBeNull()
  })

  it('16자를 넘으면 종류를 따지지 않는다 — 긴 문장이 더 강하다', () => {
    expect(checkPassword('오늘도 릴스를 뜯어본다 그리고')).toBeNull()
    expect(checkPassword('abcdefghijklmnopq')).toBeNull()
  })

  it('딱 경계값에서도 일관되게 판단한다', () => {
    expect(checkPassword('aB1!aB1!aB')).toBeNull()
    expect(checkPassword('aaaaaaaaab')).toContain('세 종류 이상')
  })
})
