import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useState } from 'react'
import type { ProjectRecord } from '../content'
import { STAGES, STAGE_LABELS, countsByStage, sortByRank, stageOf, type Stage } from '../lib/schema'
import { Card } from './Card'

type Props = {
  projects: ProjectRecord[]
  editable: boolean
  onMove: (id: string, to: Stage, index: number) => void
  onOpen: (id: string) => void
}

const isStage = (v: string): v is Stage => (STAGES as readonly string[]).includes(v)

/** 서가 한 칸. 이름표가 붙고 그 아래로 책이 꽂힌다. */
function Shelf({
  stage,
  count,
  editable,
  children,
}: {
  stage: Stage
  count: number
  editable: boolean
  children: React.ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage, disabled: !editable })

  return (
    <section
      ref={setNodeRef}
      className={`transition-colors ${isOver ? 'bg-accent/[0.06]' : ''}`}
    >
      {/* 서가 이름표. 멀리서도 어느 칸인지 바로 보이게 테를 둘러 붙인다. */}
      <header className="flex items-center justify-between gap-3 border border-white/40 bg-leaf/60 px-4 py-3">
        <h2 className="font-display text-[17px] leading-none text-ink md:text-lg">
          {STAGE_LABELS[stage]}
        </h2>
        <span className="font-display text-xl leading-none text-accent tabular-nums">{count}</span>
      </header>
      <div className="flex min-h-24 flex-col gap-2.5 pt-4">{children}</div>
    </section>
  )
}

function SortableCard({ project, onOpen }: { project: ProjectRecord; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: project.id,
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? 'opacity-40' : undefined}
      {...attributes}
      {...listeners}
    >
      <Card project={project} draggable onOpen={onOpen} />
    </div>
  )
}

export function Board({ projects, editable, onMove, onOpen }: Props) {
  const [dragging, setDragging] = useState<ProjectRecord | null>(null)
  const counts = countsByStage(projects)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const column = (stage: Stage, exclude?: string) =>
    sortByRank(projects.filter((p) => stageOf(p) === stage && p.id !== exclude))

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setDragging(null)
    if (!over) return

    const id = String(active.id)
    const overId = String(over.id)
    if (overId === id) return

    if (isStage(overId)) {
      onMove(id, overId, column(overId, id).length)
      return
    }

    const target = projects.find((p) => p.id === overId)
    if (!target) return
    const to = stageOf(target)
    const index = column(to, id).findIndex((p) => p.id === overId)
    onMove(id, to, index < 0 ? column(to, id).length : index)
  }

  const handleDragStart = ({ active }: DragStartEvent) =>
    setDragging(projects.find((p) => p.id === String(active.id)) ?? null)

  const columns = STAGES.map((stage) => ({ stage, cards: column(stage) }))

  const grid = (
    <div className="grid gap-x-8 gap-y-10 md:grid-cols-3 md:divide-x md:divide-rule-soft">
      {columns.map(({ stage, cards }, i) => (
        <div key={stage} className={i > 0 ? 'md:pl-8' : undefined}>
          <Shelf stage={stage} count={counts[stage]} editable={editable}>
            {editable ? (
              <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                {cards.map((p) => (
                  <SortableCard key={p.id} project={p} onOpen={() => onOpen(p.id)} />
                ))}
              </SortableContext>
            ) : (
              cards.map((p) => <Card key={p.id} project={p} onOpen={() => onOpen(p.id)} />)
            )}
            {cards.length === 0 && (
              <p className="label py-8 text-center">빈 서가</p>
            )}
          </Shelf>
        </div>
      ))}
    </div>
  )

  if (!editable) return grid

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setDragging(null)}
    >
      {grid}
      <DragOverlay>{dragging ? <Card project={dragging} draggable /> : null}</DragOverlay>
    </DndContext>
  )
}
