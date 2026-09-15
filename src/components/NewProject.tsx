import { useState } from 'react'

export function NewProject({ onCreate }: { onCreate: (v: { title: string; url?: string }) => Promise<void> }) {
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (title.trim().length === 0) return
    setBusy(true)
    try {
      await onCreate({ title, url: url.trim() || undefined })
      setTitle('')
      setUrl('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="mb-5 flex flex-wrap gap-2">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="새 프로젝트 제목"
        className="min-w-52 flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-500"
      />
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="영감을 받은 링크 (선택)"
        className="min-w-52 flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-500"
      />
      <button
        type="submit"
        disabled={busy || title.trim().length === 0}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-40"
      >
        {busy ? '만드는 중' : '추가'}
      </button>
    </form>
  )
}
