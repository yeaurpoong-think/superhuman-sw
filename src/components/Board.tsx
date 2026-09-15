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

function Column({
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
      className={`rounded-xl p-3 transition-colors ${
        isOver ? 'bg-neutral-200/80' : 'bg-neutral-100/70'
      }`}
    >
      <header className="flex items-baseline justify-between px-1 pb-3">
        <h2 className="text-sm font-medium text-neutral-700">{STAGE_LABELS[stage]}</h2>
        <span className="text-sm tabular-nums text-neutral-400">{count}</span>
      </header>
      <div className="flex min-h-16 flex-col gap-2.5">{children}</div>
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
    <div className="grid gap-4 md:grid-cols-3">
      {columns.map(({ stage, cards }) => (
        <Column key={stage} stage={stage} count={counts[stage]} editable={editable}>
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
            <p className="px-1 py-6 text-center text-xs text-neutral-400">비어 있음</p>
          )}
        </Column>
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
