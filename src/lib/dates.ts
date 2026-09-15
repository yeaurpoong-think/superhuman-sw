/**
 * 날짜 입력칸과 ISO 타임스탬프 사이를 오간다.
 *
 * 저장은 UTC로 하지만 사람이 고르는 건 자기 동네 날짜다.
 * 로컬 기준으로 변환해야 "9월 15일로 골랐는데 9월 14일로 보인다"가 생기지 않는다.
 */

const pad = (n: number) => String(n).padStart(2, '0')

/** ISO 타임스탬프 → 입력칸에 넣을 로컬 날짜(YYYY-MM-DD). */
export function toDateInput(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** 입력칸 값 → ISO 타임스탬프. 비우면 null(= 그 단계를 지운다). */
export function fromDateInput(value: string): string | null {
  if (!value) return null
  const [y, m, d] = value.split('-').map(Number)
  if (!y || !m || !d) return null
  const local = new Date(y, m - 1, d)
  if (Number.isNaN(local.getTime())) return null
  return local.toISOString()
}
