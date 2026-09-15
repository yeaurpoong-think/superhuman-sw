import type { SaveState } from '../admin/useBoard'

export function SaveStatus({ state, onDismiss }: { state: SaveState; onDismiss: () => void }) {
  if (state.kind === 'idle') return null

  if (state.kind === 'error') {
    return (
      <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 shadow-lg">
        <div className="flex items-center gap-3">
          <p className="text-xs text-red-800">{state.message}</p>
          <button
            type="button"
            onClick={onDismiss}
            className="text-xs text-red-500 underline underline-offset-2"
          >
            닫기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs text-neutral-600 shadow-lg">
      {state.kind === 'saving' ? '저장 중…' : '커밋 완료 · 사이트 반영까지 2분쯤'}
    </div>
  )
}
