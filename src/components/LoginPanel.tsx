import { useState } from 'react'
import type { Admin } from '../admin/useBoard'


type Props = {
  admin: Admin | null
  onSignIn: (password: string, remember: boolean) => Promise<void>
  onSignOut: () => void
}

export function LoginPanel({ admin, onSignIn, onSignOut }: Props) {
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (admin) {
    return (
      <div className="flex items-center gap-3 whitespace-nowrap">
        <span className="label text-accent">사서 모드</span>
        <button type="button" onClick={onSignOut} className="label -m-2 inline-flex min-h-11 items-center p-2 underline underline-offset-4 hover:text-ink">
          잠그기
        </button>
      </div>
    )
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="label -m-2 inline-flex min-h-11 min-w-11 items-center justify-end p-2 whitespace-nowrap underline underline-offset-4 hover:text-ink"
      >
        사서 출입
      </button>
    )
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await onSignIn(password, remember)
      setPassword('')
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : '들어가지 못했습니다')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form
      onSubmit={submit}
      className="absolute top-0 right-0 w-72 border border-rule bg-leaf p-4 shadow-xl"
    >
      <label className="block text-xs font-medium text-ink" htmlFor="password">
        비밀번호
      </label>
      <input
        id="password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="mt-1.5 w-full rounded border border-rule px-2 py-1.5 text-xs focus:border-accent"
      />

      <label className="mt-2.5 flex items-center gap-2 text-xs text-ink-soft">
        <input
          type="checkbox"
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
          className="rounded border-rule"
        />
        이 기기에서 기억하기
      </label>

      <p className="mt-2.5 text-[11px] leading-relaxed text-muted">
        비밀번호로 잠긴 금고를 엽니다. 처음 한 번은 1~2초 걸립니다.
      </p>

      {error && <p className="mt-2 text-[11px] text-red-600">{error}</p>}

      <div className="mt-3 flex justify-end gap-1.5">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded px-2 py-1 text-xs text-muted hover:bg-accent/10"
        >
          닫기
        </button>
        <button
          type="submit"
          disabled={busy || password.length === 0}
          className="rounded bg-ink px-2.5 py-1 text-xs text-white disabled:opacity-40"
        >
          {busy ? '확인 중' : '들어가기'}
        </button>
      </div>
    </form>
  )
}
