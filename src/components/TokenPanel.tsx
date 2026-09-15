import { useState } from 'react'
import { TOKEN_SETTINGS_URL } from '../config'
import type { Admin } from '../admin/useBoard'

type Props = {
  admin: Admin | null
  onSignIn: (token: string, remember: boolean) => Promise<void>
  onSignOut: () => void
}

export function TokenPanel({ admin, onSignIn, onSignOut }: Props) {
  const [open, setOpen] = useState(false)
  const [token, setToken] = useState('')
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (admin) {
    return (
      <div className="flex items-center gap-3 text-xs text-neutral-500">
        <span>
          편집 모드 · <span className="font-medium text-neutral-700">{admin.login}</span>
        </span>
        <button
          type="button"
          onClick={onSignOut}
          className="rounded border border-neutral-300 px-2 py-1 hover:bg-neutral-100"
        >
          토큰 삭제
        </button>
      </div>
    )
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded border border-neutral-300 px-2.5 py-1 text-xs text-neutral-600 hover:bg-neutral-100"
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
      await onSignIn(token.trim(), remember)
      setToken('')
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : '토큰을 확인하지 못했다')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form
      onSubmit={submit}
      className="w-80 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm"
    >
      <label className="block text-xs font-medium text-neutral-700" htmlFor="token">
        깃허브 개인 토큰
      </label>
      <input
        id="token"
        type="password"
        autoComplete="off"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        placeholder="github_pat_..."
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
        이 레포에만, <span className="font-medium">Contents 읽기·쓰기</span>만 준 토큰을 쓴다. 다른
        사이트에는 절대 붙여 넣지 마라. 기억하기를 끄면 창을 닫을 때 지워진다.
      </p>

      {error && <p className="mt-2 text-[11px] text-red-600">{error}</p>}

      <div className="mt-3 flex items-center justify-between">
        <a
          href={TOKEN_SETTINGS_URL}
          target="_blank"
          rel="noreferrer noopener"
          className="text-[11px] text-neutral-500 underline underline-offset-2 hover:text-neutral-800"
        >
          토큰 만들기 · 폐기하기
        </a>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-100"
          >
            닫기
          </button>
          <button
            type="submit"
            disabled={busy || token.trim().length === 0}
            className="rounded bg-neutral-900 px-2.5 py-1 text-xs text-white disabled:opacity-40"
          >
            {busy ? '확인 중' : '확인'}
          </button>
        </div>
      </div>
    </form>
  )
}
