/**
 * UTF-8 ↔ base64 변환은 반드시 이 모듈만 쓴다.
 *
 * btoa('한글')은 예외를 던지고, 깃허브 Contents API가 돌려주는 base64에는
 * 줄바꿈이 섞여 있어 atob이 거부한다. 두 함정을 여기서 한 번에 막는다.
 */

/** 큰 문자열을 String.fromCharCode에 한 번에 넘기면 스택이 터진다. */
const CHUNK = 0x8000

export function encodeUtf8Base64(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK))
  }
  return btoa(binary)
}

export function decodeBase64Utf8(b64: string): string {
  const binary = atob(b64.replace(/\s/g, ''))
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return new TextDecoder().decode(bytes)
}

export function utf8ByteLength(text: string): number {
  return new TextEncoder().encode(text).length
}

/** 이미지 같은 바이너리를 그대로 base64로 바꾼다. 깃허브는 base64만 받는다. */
export function encodeBytesBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK))
  }
  return btoa(binary)
}
