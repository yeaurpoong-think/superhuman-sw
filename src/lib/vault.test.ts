import { describe, expect, it } from 'vitest'
import { openVault, sealToken } from './vault'

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
