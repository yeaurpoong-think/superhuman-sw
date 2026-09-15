import { useState } from 'react'
import type { Admin } from '../admin/useBoard'
import { isEditingConfigured } from '../config'

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

  // 편집 서버를 연결하기 전에는 방문자에게 아무것도 보여주지 않는다.
  if (!isEditingConfigured()) return null

  if (admin) {
    return (
      <div className="flex items-center gap-3 text-xs whitespace-nowrap text-neutral-500">
        <span className="font-medium text-neutral-700">편집 모드</span>
        <button
          type="button"
          onClick={onSignOut}
          className="rounded border border-neutral-300 px-2 py-1 hover:bg-neutral-100"
        >
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
        className="rounded border border-neutral-300 px-2.5 py-1 text-xs whitespace-nowrap text-neutral-600 hover:bg-neutral-100"
      >
        편집하기
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
      setError(err instanceof Error ? err.message : '들어가지 못했다')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form
      onSubmit={submit}
      className="absolute top-0 right-0 w-72 rounded-lg border border-neutral-200 bg-white p-4 shadow-lg"
    >
      <label className="block text-xs font-medium text-neutral-700" htmlFor="password">
        비밀번호
      </label>
      <input
        id="password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="mt-1.5 w-full rounded border border-neutral-300 px-2 py-1.5 text-xs outline-none focus:border-neutral-500"
      />

      <label className="mt-2.5 flex items-center gap-2 text-xs text-neutral-600">
        <input
          type="checkbox"
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
          className="rounded border-neutral-300"
        />
        이 기기에서 기억하기
      </label>

      <p className="mt-2.5 text-[11px] leading-relaxed text-neutral-500">
        기억해 두면 90일 동안 다시 묻지 않는다.
      </p>

      {error && <p className="mt-2 text-[11px] text-red-600">{error}</p>}

      <div className="mt-3 flex justify-end gap-1.5">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-100"
        >
          닫기
        </button>
        <button
          type="submit"
          disabled={busy || password.length === 0}
          className="rounded bg-neutral-900 px-2.5 py-1 text-xs text-white disabled:opacity-40"
        >
          {busy ? '확인 중' : '들어가기'}
        </button>
      </div>
    </form>
  )
}
