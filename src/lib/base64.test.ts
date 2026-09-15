import { describe, expect, it } from 'vitest'
import { decodeBase64Utf8, encodeUtf8Base64, utf8ByteLength } from './base64'

describe('base64 왕복', () => {
  it('한글을 깨뜨리지 않는다', () => {
    const text = '인스타 훅 3초 구조 분해'
    expect(decodeBase64Utf8(encodeUtf8Base64(text))).toBe(text)
  })

  it('btoa가 못 다루는 한글도 인코딩한다', () => {
    expect(() => encodeUtf8Base64('한글')).not.toThrow()
  })

  it('이모지(서러게이트 페어)를 깨뜨리지 않는다', () => {
    const text = '완료 ✅ 🎉 가족 👨‍👩‍👧‍👦'
    expect(decodeBase64Utf8(encodeUtf8Base64(text))).toBe(text)
  })

  it('빈 문자열도 왕복한다', () => {
    expect(decodeBase64Utf8(encodeUtf8Base64(''))).toBe('')
  })

  it('깃허브가 돌려주는 줄바꿈 섞인 base64를 디코딩한다', () => {
    const encoded = encodeUtf8Base64('리서치 완료')
    const withNewlines = `${encoded.slice(0, 4)}\n${encoded.slice(4)}\n`
    expect(decodeBase64Utf8(withNewlines)).toBe('리서치 완료')
  })

  it('1MB짜리 한글 본문도 스택을 터뜨리지 않고 왕복한다', () => {
    const text = '가나다라마바사'.repeat(50_000)
    expect(decodeBase64Utf8(encodeUtf8Base64(text))).toBe(text)
  })
})

describe('utf8ByteLength', () => {
  it('한글은 글자당 3바이트로 센다', () => {
    expect(utf8ByteLength('한글')).toBe(6)
  })

  it('문자 수가 아니라 바이트 수를 센다', () => {
    expect(utf8ByteLength('abc')).toBe(3)
    expect('한글'.length).toBe(2)
  })
})
