import { Suspense, lazy, useState } from 'react'
import { useBoard } from './admin/useBoard'
import { Board } from './components/Board'
import { CategoryFilter, type CategoryFilterValue } from './components/CategoryFilter'
import { LoginPanel } from './components/LoginPanel'
import { Metrics } from './components/Metrics'
import { NewProject } from './components/NewProject'
import { ReferenceShelf } from './components/ReferenceShelf'
import { SaveStatus } from './components/SaveStatus'
import { SchemaErrors } from './components/SchemaErrors'
import { REPO } from './config'
import { filterByCategory, partitionByKind } from './lib/schema'

const ProjectPage = lazy(() =>
  import('./components/ProjectPage').then((m) => ({ default: m.ProjectPage })),
)

export default function App() {
  const board = useBoard()
  const [openId, setOpenId] = useState<string | null>(null)
  const [category, setCategory] = useState<CategoryFilterValue>('all')

  const open = board.projects.find((p) => p.id === openId) ?? null
  const visible = filterByCategory(board.projects, category)
  const { board: boardCards, references } = partitionByKind(visible)

  return (
    <div className="min-h-dvh px-3 py-4 md:px-6 md:py-10">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:border focus:border-rule focus:bg-leaf focus:px-3 focus:py-2 focus:text-sm focus:text-ink"
      >
        본문으로 건너뛰기
      </a>
      <div className="sheet relative mx-auto max-w-6xl px-5 py-10 md:px-14 md:py-14">
        <div className="absolute top-5 right-5 z-20 md:top-7 md:right-7">
          <LoginPanel admin={board.admin} onSignIn={board.signIn} onSignOut={board.signOut} />
        </div>

        <header className="text-center">
          <p className="label">Superhuman SW</p>
          <h1 className="mt-3 font-display text-[2.1rem] leading-tight tracking-tight text-ink md:text-5xl">
            SW Project Library
          </h1>
          <p className="mt-3 font-serif text-sm text-ink-soft md:text-base">
            리서치에서 시작해 직접 해보고, 콘텐츠로 끝맺는다.
          </p>

          <div aria-hidden className="mx-auto mt-7 h-px w-16 bg-accent/50" />

          <div className="mt-9 flex justify-center">
            <Metrics projects={boardCards} />
          </div>
        </header>

        <div className="rule-double mt-10" />

        <div className="mt-5">
          <CategoryFilter projects={board.projects} value={category} onChange={setCategory} />
        </div>

        {board.admin && (
          <div className="mt-6">
            <NewProject onCreate={board.createCard} />
          </div>
        )}

        <main id="main" className="mt-8">
          <SchemaErrors errors={board.contentErrors} />
          {boardCards.length === 0 && references.length === 0 && board.projects.length > 0 ? (
            <div className="border border-dashed border-rule py-16 text-center">
              <p className="font-serif text-ink-soft">이 분류에는 아직 꽂힌 것이 없다.</p>
              <button
                type="button"
                onClick={() => setCategory('all')}
                className="label mt-3 inline-flex min-h-11 items-center underline underline-offset-4 hover:text-ink"
              >
                전체 서가 보기
              </button>
            </div>
          ) : (
            <Board
              projects={boardCards}
              editable={board.admin !== null}
              onMove={board.moveCard}
              onOpen={setOpenId}
            />
          )}

          <ReferenceShelf projects={references} onOpen={setOpenId} />
        </main>

        <footer className="mt-14 flex flex-wrap items-center justify-between gap-2 border-t border-rule-soft pt-5">
          <span className="label">
            {REPO.owner} / {REPO.repo}
          </span>
          {board.admin && (
            <span className="label">카드를 끌어 옮기면 날짜가 기록되고 서고에 반영된다</span>
          )}
        </footer>
      </div>

      {open && (
        <Suspense fallback={null}>
          <ProjectPage
            project={open}
            editable={board.admin !== null}
            onSave={(changes) => board.saveCard(open.id, changes)}
            onDelete={board.deleteCard}
            onUploadImage={board.uploadImage}
            onClose={() => setOpenId(null)}
          />
        </Suspense>
      )}

      <SaveStatus state={board.save} onDismiss={board.dismissError} />
    </div>
  )
}
