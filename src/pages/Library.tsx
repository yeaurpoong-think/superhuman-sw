import { Suspense, lazy, useCallback, useEffect, useState } from 'react'
import { useBoard } from '../admin/useBoard'
import { Board } from '../components/Board'
import { CategoryFilter, type CategoryFilterValue } from '../components/CategoryFilter'
import { LoginPanel } from '../components/LoginPanel'
import { Metrics } from '../components/Metrics'
import { NewProject } from '../components/NewProject'
import { ReferenceShelf } from '../components/ReferenceShelf'
import { SaveStatus } from '../components/SaveStatus'
import { SchemaErrors } from '../components/SchemaErrors'
import { LIBRARY_BG, REPO } from '../config'
import { filterByCategory, partitionByKind } from '../lib/schema'
import {
  bringToFront,
  closeWindow,
  fitToViewport,
  frontWindow,
  moveWindow,
  openWindow,
  resizeWindow,
  type WindowState,
} from '../lib/windows'

const ProjectPage = lazy(() =>
  import('../components/ProjectPage').then((m) => ({ default: m.ProjectPage })),
)

export function Library() {
  const board = useBoard()
  const [windows, setWindows] = useState<WindowState[]>([])
  const [category, setCategory] = useState<CategoryFilterValue>('all')

  const front = frontWindow(windows)
  const visible = filterByCategory(board.projects, category)
  const { board: boardCards, references } = partitionByKind(visible)

  const viewport = () => ({ width: window.innerWidth, height: window.innerHeight })

  const openCard = useCallback((id: string) => {
    setWindows((list) => openWindow(list, id, viewport()))
  }, [])

  /** 화면을 줄였을 때 창이 바깥에 갇히지 않도록 다시 안으로 끌어당긴다. */
  useEffect(() => {
    const onResize = () => setWindows((list) => fitToViewport(list, viewport()))
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <div className="px-3 pb-4 md:px-6 md:pb-10">
      {/*
        종이 뒤로 비치는 서가. 스크롤 중 잔상을 남기지 않도록 배경 이미지가 아니라
        고정 레이어로 깐다. 위쪽 메뉴 글자가 이 위에 그대로 앉으므로 어둡게 눌러 둔다.
      */}
      <div aria-hidden className="fixed inset-0 -z-10 bg-shell">
        <div
          className="absolute inset-0 bg-cover bg-top bg-no-repeat opacity-40"
          style={{ backgroundImage: `url(${LIBRARY_BG})` }}
        />
        {/* 맨 위는 더 눌러 둔다. 메뉴 글자가 사진의 밝은 서가에 걸리면 읽히지 않는다. */}
        <div className="absolute inset-0 bg-gradient-to-b from-shell/90 via-shell/50 to-shell/65" />
      </div>

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
          <h1 className="font-display text-[2.1rem] leading-tight tracking-tight text-ink md:text-5xl">
            서고
          </h1>
          <p className="mt-3 font-serif text-sm text-ink-soft md:text-base">
            리서치에서 시작해 직접 해보고, 콘텐츠로 끝맺습니다.
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
              <p className="font-serif text-ink-soft">이 분류에는 아직 꽂힌 것이 없습니다.</p>
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
              onOpen={openCard}
            />
          )}

          <ReferenceShelf projects={references} onOpen={openCard} />
        </main>

        <footer className="mt-14 flex flex-wrap items-center justify-between gap-2 border-t border-rule-soft pt-5">
          <span className="label">
            {REPO.owner} / {REPO.repo}
          </span>
          {board.admin && (
            <span className="label">카드를 끌어 옮기면 날짜가 기록되고 서고에 반영됩니다</span>
          )}
        </footer>
      </div>

      <Suspense fallback={null}>
        {windows.map((w) => {
          const project = board.projects.find((p) => p.id === w.id)
          if (!project) return null
          return (
            <ProjectPage
              key={w.id}
              project={project}
              editable={board.admin !== null}
              onSave={(changes) => board.saveCard(w.id, changes)}
              onDelete={board.deleteCard}
              onUploadImage={board.uploadImage}
              onClose={() => setWindows((list) => closeWindow(list, w.id))}
              x={w.x}
              y={w.y}
              z={w.z}
              isFront={front?.id === w.id}
              w={w.w}
              h={w.h}
              onFocus={() => setWindows((list) => bringToFront(list, w.id))}
              onMove={(x, y) => setWindows((list) => moveWindow(list, w.id, x, y, viewport()))}
              onResize={(box) => setWindows((list) => resizeWindow(list, w.id, box, viewport()))}
            />
          )
        })}
      </Suspense>

      {windows.length > 1 && (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
          <button
            type="button"
            onClick={() => setWindows([])}
            className="label flex min-h-11 items-center border border-rule bg-leaf px-4 shadow-lg hover:text-ink"
          >
            열어 둔 창 {windows.length} · 모두 닫기
          </button>
        </div>
      )}

      <SaveStatus state={board.save} onDismiss={board.dismissError} />
    </div>
  )
}
