import { useState } from 'react'
import { CheckSquare } from 'lucide-react'
import { DndContext, pointerWithin, DragOverlay, useSensor, useSensors, PointerSensor } from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { useTasks } from '../../hooks/useTasks'
import { useClients } from '../../hooks/useClients'
import { useAuth } from '../../contexts/AuthContext'
import { TasksBoard } from '../dashboard/TasksBoard'

export function TasksPage() {
  const { tasks, updateTask, addTask, removeTask } = useTasks()
  const { clients } = useClients()
  const { user } = useAuth()
  const [newTaskTrigger, setNewTaskTrigger] = useState(0)
  const [activeDragData, setActiveDragData] = useState<any>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragData(event.active.data.current)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragData(null)
    const { active, over } = event
    if (!over) return
    const taskId = String(active.id)
    const dropzoneId = String(over.id)
    if (dropzoneId.startsWith('AGENDA_SLOT_')) {
      const timestamp = dropzoneId.replace('AGENDA_SLOT_', '')
      updateTask(taskId, { scheduled_at: timestamp }).catch(console.error)
    } else if (dropzoneId === 'UNASSIGNED') {
      updateTask(taskId, { scheduled_at: null }).catch(console.error)
    }
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} collisionDetection={pointerWithin}>
      <main className="flex-1 h-screen overflow-hidden flex flex-col bg-bg-app animate-in fade-in duration-300">
        {/* Header */}
        <header className="px-6 pt-6 pb-5 shrink-0 border-b border-border bg-bg-surface">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-display text-text-primary mb-1 flex items-center gap-3">
                <CheckSquare size={26} className="text-accent" />
                Tarefas
              </h1>
              <p className="text-body text-text-secondary">
                Gerencie todas as tarefas da equipe em um só lugar.
              </p>
            </div>
            <button
              onClick={() => setNewTaskTrigger(v => v + 1)}
              className="flex items-center gap-2 bg-accent text-white px-4 py-2.5 rounded-radius-sm text-small font-bold hover:bg-accent-hover transition-colors shadow-card"
            >
              + Nova Tarefa
            </button>
          </div>
        </header>

        {/* Board */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <TasksBoard
            tasks={tasks}
            clients={clients}
            addTask={addTask}
            updateTask={updateTask}
            removeTask={removeTask}
            newTaskTrigger={newTaskTrigger}
            currentUserEmail={user?.email}
          />
        </div>

        <DragOverlay>
          {activeDragData ? (
            <div
              className="bg-bg-surface rounded-radius-sm shadow-2xl border border-accent border-l-4 p-3 flex flex-col min-h-[80px] w-[300px] opacity-90 scale-105 transition-transform rotate-2"
              style={{ borderLeftColor: activeDragData.clientColor || '#888888' }}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 mr-2">
                  <h3 className="text-body-lg text-text-primary leading-tight line-clamp-2">{activeDragData.task.title}</h3>
                  {activeDragData.clientName && <p className="text-small text-text-secondary mt-1.5">{activeDragData.clientName}</p>}
                </div>
                <span className="text-mono text-[10px] text-accent bg-accent-light px-1.5 py-[2px] rounded-radius-sm mt-0.5">{activeDragData.task.estimated_minutes}m</span>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </main>
    </DndContext>
  )
}
