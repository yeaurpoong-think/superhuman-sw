import { describe, expect, it } from 'vitest'
import { encodeBytesBase64, decodeBase64Utf8 } from './base64'
import { extensionFor, imagePath, rawUrl } from './images'

describe('extensionFor', () => {
  it('흔한 이미지 형식을 알아본다', () => {
    expect(extensionFor('image/png')).toBe('png')
    expect(extensionFor('image/jpeg')).toBe('jpg')
    expect(extensionFor('IMAGE/PNG')).toBe('png')
  })

  it('이미지가 아니면 거절한다', () => {
    expect(extensionFor('application/pdf')).toBeNull()
    expect(extensionFor('text/plain')).toBeNull()
  })
})

describe('imagePath', () => {
  it('연·월로 나눠 쌓는다', () => {
    expect(imagePath(new Date(2026, 8, 15), 'png', 'abc123')).toBe(
      'content/images/2026/09/15-abc123.png',
    )
  })

  it('같은 날 여러 장을 올려도 겹치지 않는다', () => {
    const now = new Date(2026, 8, 15)
    expect(imagePath(now, 'png')).not.toBe(imagePath(now, 'png'))
  })

  it('계약이 쓰기를 허용하는 content/ 아래에 둔다', () => {
    expect(imagePath(new Date(), 'png').startsWith('content/')).toBe(true)
  })
})

describe('rawUrl', () => {
  it('빌드를 기다리지 않고 바로 보이는 주소를 만든다', () => {
    expect(rawUrl('o', 'r', 'main', 'content/images/2026/09/a.png')).toBe(
      'https://raw.githubusercontent.com/o/r/main/content/images/2026/09/a.png',
    )
  })
})

describe('encodeBytesBase64', () => {
  it('바이너리를 그대로 실어 나른다', () => {
    const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    expect(encodeBytesBase64(bytes)).toBe('iVBORw0KGgo=')
  })

  it('큰 이미지도 스택을 터뜨리지 않는다', () => {
    const big = new Uint8Array(2_000_000).fill(7)
    expect(encodeBytesBase64(big).length).toBeGreaterThan(2_000_000)
  })

  it('빈 데이터도 처리한다', () => {
    expect(encodeBytesBase64(new Uint8Array(0))).toBe('')
    expect(decodeBase64Utf8('')).toBe('')
  })
})
