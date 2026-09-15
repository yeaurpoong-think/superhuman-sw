import { Suspense, lazy, useState } from 'react'
import { useBoard } from './admin/useBoard'
import { Board } from './components/Board'
import { CategoryFilter, type CategoryFilterValue } from './components/CategoryFilter'
import { Metrics } from './components/Metrics'
import { filterByCategory } from './lib/schema'
import { NewProject } from './components/NewProject'
const ProjectPage = lazy(() => import('./components/ProjectPage').then((m) => ({ default: m.ProjectPage })))
import { SaveStatus } from './components/SaveStatus'
import { SchemaErrors } from './components/SchemaErrors'
import { LoginPanel } from './components/LoginPanel'

export default function App() {
  const board = useBoard()
  const [openId, setOpenId] = useState<string | null>(null)
  const [category, setCategory] = useState<CategoryFilterValue>('all')
  const visible = filterByCategory(board.projects, category)
  const open = board.projects.find((p) => p.id === openId) ?? null

  return (
    <div className="min-h-dvh bg-neutral-50 text-neutral-900">
      <div className="mx-auto max-w-6xl px-5 py-12 md:py-16">
        <header className="mb-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium tracking-widest text-neutral-400 uppercase">
                Superhuman SW
              </p>
              <h1 className="mt-1.5 text-2xl font-semibold tracking-tight">프로젝트 리스트</h1>
              <p className="mt-1 text-sm text-neutral-500">
                리서치에서 시작해 직접 해보고, 콘텐츠로 끝맺는다.
              </p>
            </div>
            <div className="relative z-20 shrink-0">
              <LoginPanel admin={board.admin} onSignIn={board.signIn} onSignOut={board.signOut} />
            </div>
          </div>

          <div className="mt-8">
            <Metrics projects={visible} />
          </div>
        </header>

        {board.admin && <NewProject onCreate={board.createCard} />}
        <CategoryFilter projects={board.projects} value={category} onChange={setCategory} />
        <SchemaErrors errors={board.contentErrors} />
        <Board
          projects={visible}
          editable={board.admin !== null}
          onMove={board.moveCard}
          onOpen={setOpenId}
        />

        {board.admin && (
          <p className="mt-6 text-xs text-neutral-400">
            카드를 끌어 칸을 옮기면 시각이 자동으로 기록되고 레포에 커밋된다.
          </p>
        )}
      </div>

      {open && (
        <Suspense fallback={null}>
          <ProjectPage
            project={open}
            editable={board.admin !== null}
            onSave={(changes) => board.saveCard(open.id, changes)}
            onClose={() => setOpenId(null)}
          />
        </Suspense>
      )}

      <SaveStatus state={board.save} onDismiss={board.dismissError} />
    </div>
  )
}
