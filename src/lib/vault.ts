/**
 * 비밀번호로 잠근 금고.
 *
 * 깃허브 토큰을 비밀번호로 암호화해 사이트에 같이 올려둔다.
 * 비밀번호를 치면 브라우저 안에서 풀어 쓰고, 서버는 어디에도 없다.
 *
 * 암호문이 공개된다는 것이 이 방식의 전부다. 비밀번호가 유일한 방어선이므로
 * 반드시 길어야 하고(16자 이상 강제), 반복 횟수를 크게 잡아 무차별 대입을 비싸게 만든다.
 */

export type Vault = {
  v: 1
  kdf: 'PBKDF2-SHA256'
  iterations: number
  salt: string
  iv: string
  ciphertext: string
}

/** OWASP가 PBKDF2-SHA256에 권고하는 수준. 휴대폰에서 1~2초 걸린다. */
export const DEFAULT_ITERATIONS = 600_000

/** 비밀번호 최소 길이. 암호문이 공개되므로 짧은 비밀번호는 곧 열린 금고다. */
export const MIN_PASSWORD_LENGTH = 16

const enc = new TextEncoder()
const dec = new TextDecoder()

const toBase64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes))

const fromBase64 = (value: string) =>
  Uint8Array.from(atob(value), (c) => c.charCodeAt(0))

async function deriveKey(password: string, salt: Uint8Array, iterations: number) {
  const material = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, [
    'deriveKey',
  ])
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

export async function sealToken(
  token: string,
  password: string,
  iterations: number = DEFAULT_ITERATIONS,
): Promise<Vault> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(password, salt, iterations)
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    enc.encode(token),
  )
  return {
    v: 1,
    kdf: 'PBKDF2-SHA256',
    iterations,
    salt: toBase64(salt),
    iv: toBase64(iv),
    ciphertext: toBase64(new Uint8Array(ciphertext)),
  }
}

/**
 * 비밀번호가 틀리면 AES-GCM 인증 태그가 맞지 않아 그냥 실패한다.
 * 반쯤 풀린 쓰레기 값이 나올 일은 없다.
 */
export async function openVault(vault: Vault, password: string): Promise<string> {
  const key = await deriveKey(password, fromBase64(vault.salt), vault.iterations)
  try {
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: fromBase64(vault.iv) as BufferSource },
      key,
      fromBase64(vault.ciphertext) as BufferSource,
    )
    return dec.decode(plain)
  } catch {
    throw new Error('비밀번호가 다르다')
  }
}

export async function fetchVault(url: string): Promise<Vault> {
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error('금고 파일을 찾을 수 없다. 아직 만들지 않았다면 npm run seal 부터.')
  return (await res.json()) as Vault
}
