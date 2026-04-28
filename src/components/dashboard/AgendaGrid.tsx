import { useState, useMemo, Fragment } from 'react'
import { createPortal } from 'react-dom'
import { CalendarDays, ChevronLeft, ChevronRight, X, Maximize2, Minimize2 } from 'lucide-react'
import { startOfWeek, addDays, format, addWeeks, subWeeks } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useDroppable, useDraggable } from '@dnd-kit/core'
import { TaskModal } from './TaskModal'
import type { Database } from '../../types/database.types'

type Task = Database['public']['Tables']['tasks']['Row']
type Client = Database['public']['Tables']['clients']['Row']

const HOURS_START = 7
const HOURS = Array.from({ length: 17 }, (_, i) => i + HOURS_START) // 7 → 23
const PIXELS_PER_SLOT = 50 // cada meia hora = 50px → 60min = 100px

function DroppableSlot({ date, hour, minute }: { date: Date; hour: number; minute: number }) {
  const d = new Date(date)
  d.setHours(hour, minute, 0, 0)
  const id = `AGENDA_SLOT_${d.toISOString()}`
  const { isOver, setNodeRef } = useDroppable({ id })
  return (
    <div
      ref={setNodeRef}
      className={`absolute inset-0 z-0 transition-colors ${isOver ? 'bg-accent/10 outline-dashed outline-2 outline-accent outline-offset-[-2px]' : ''}`}
    />
  )
}

export function DraggableAgendaTask({
  task, heightPx, clientColor, clientName, onEditClick, onUnschedule,
}: {
  task: Task; heightPx?: number; clientColor?: string; clientName?: string
  onEditClick: () => void; onUnschedule?: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: String(task.id),
    data: { task, type: 'agenda_task', clientColor, clientName },
  })

  const height = heightPx ? `${Math.max(24, heightPx)}px` : undefined
  const style = {
    height,
    ...(transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : {}),
  }

  const isDone = task.status === 'Concluído'
  const isCompact = (heightPx || 0) <= 50

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => onEditClick()}
      className={`relative w-full z-20 shrink-0 rounded-radius-sm shadow-card border border-border border-l-4 p-2 cursor-grab transition-all group flex flex-col justify-start overflow-hidden bg-bg-surface hover:z-50 hover:shadow-raised ${isDragging ? 'opacity-50 z-50 cursor-grabbing' : ''} ${isDone ? 'opacity-50 grayscale select-none' : ''}`}
      style={{ ...style, borderLeftColor: clientColor || '#888888' }}
    >
      <div className={`flex justify-between ${isCompact ? 'items-center h-full' : 'items-start'}`}>
        <div className={`flex flex-col overflow-hidden leading-tight flex-1 ${isCompact ? 'justify-center' : ''}`}>
          <span className="text-body-lg font-medium truncate">{task.title}</span>
          {!isCompact && clientName && (
            <span className="text-[10px] text-text-secondary truncate mt-[2px]">{clientName}</span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0 ml-1">
          {!isCompact && (
            <div className="flex flex-col gap-[3px] mt-1 items-end opacity-80 shrink-0">
              <div className={`w-3.5 h-[3px] rounded-full ${task.priority === 1 ? 'bg-red' : task.priority === 2 ? 'bg-orange' : 'bg-gray-muted'}`} />
              <div className={`w-2.5 h-[3px] rounded-full ${task.priority === 1 ? 'bg-red' : task.priority === 2 ? 'bg-orange' : 'bg-gray-muted'}`} />
              <div className={`w-1.5 h-[3px] rounded-full ${task.priority === 1 ? 'bg-red' : 'bg-transparent'}`} />
            </div>
          )}
          <span className="text-[10px] text-text-tertiary whitespace-nowrap mt-0.5">{task.estimated_minutes}m</span>
          {onUnschedule && (
            <button
              onClick={(e) => { e.stopPropagation(); onUnschedule() }}
              className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 p-0.5 rounded-sm hover:bg-status-red/10 text-text-tertiary hover:text-status-red"
              title="Remover da agenda"
            >
              <X size={11} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Sub-componente: grid de slots (renderizado em apenas 1 lugar por vez) ────

function AgendaGridBody({
  weekDays, scheduledTasks, clients, setEditingTask, updateTask,
}: {
  weekDays: Date[]
  scheduledTasks: Task[]
  clients: Client[]
  setEditingTask: (t: Task) => void
  updateTask: any
}) {
  const totalGridHeight = HOURS.length * 2 * PIXELS_PER_SLOT

  return (
    <div className="flex-1 overflow-y-auto flex flex-col relative bg-bg-app/30">
      {/* Cabeçalho dos dias */}
      <div className="flex border-b border-border sticky top-0 bg-bg-surface z-[50] shrink-0 shadow-[0_1px_0_0_var(--border)]">
        <div className="w-12 shrink-0 border-r border-border" />
        {weekDays.map(date => (
          <div key={date.toISOString()} className="flex-1 text-center py-2 flex flex-col items-center justify-center border-r border-border last:border-r-0">
            <span className="text-label text-text-tertiary uppercase">{format(date, 'eee', { locale: ptBR })}</span>
            <span className="text-body-lg font-bold text-text-primary leading-tight">{format(date, 'd')}</span>
          </div>
        ))}
      </div>

      {/* Grid: cada hora = 2 rows (×:00 e ×:30) */}
      <div className="flex-1 grid grid-cols-[48px_repeat(5,minmax(0,1fr))]" style={{ minHeight: totalGridHeight }}>
        {HOURS.map(hour => (
          <Fragment key={hour}>

            {/* ── :00 label cell ── */}
            <div
              className="border-r bg-bg-surface opacity-90 z-10 relative flex justify-center shrink-0"
              style={{ minHeight: PIXELS_PER_SLOT }}
            >
              <span className="text-mono text-[10px] text-text-tertiary absolute -top-[9px] right-2 bg-bg-surface px-0.5 leading-none">
                {hour.toString().padStart(2, '0')}:00
              </span>
            </div>

            {/* ── :00 day cells ── */}
            {weekDays.map((date, colIdx) => {
              const tasks00 = scheduledTasks.filter(t => {
                const d = new Date(t.scheduled_at!)
                return d.getDate() === date.getDate()
                    && d.getMonth() === date.getMonth()
                    && d.getHours() === hour
                    && d.getMinutes() === 0
              })
              return (
                <div
                  key={`${date.getTime()}-${hour}-0`}
                  className={`relative hover:bg-accent/5 transition-colors p-1 flex flex-col gap-1 ${colIdx < 4 ? 'border-r border-border/50' : ''}`}
                  style={{ minHeight: PIXELS_PER_SLOT }}
                >
                  <DroppableSlot date={date} hour={hour} minute={0} />
                  {tasks00.map(task => {
                    const client = clients.find(c => c.id === task.client_id)
                    const taskId = String(task.id)
                    return (
                      <DraggableAgendaTask
                        key={task.id}
                        task={task}
                        heightPx={(task.estimated_minutes / 30) * PIXELS_PER_SLOT}
                        clientColor={client?.color}
                        clientName={client?.name}
                        onEditClick={() => setEditingTask(task)}
                        onUnschedule={!taskId.includes('-ghost-') ? async () => {
                          try { await updateTask(taskId, { scheduled_at: null }) } catch (e) { console.error(e) }
                        } : undefined}
                      />
                    )
                  })}
                </div>
              )
            })}

            {/* ── :30 label cell (sem texto — só linha tracejada visual) ── */}
            <div
              className="border-r border-b border-border/40 bg-bg-surface opacity-70 z-10 relative shrink-0"
              style={{ minHeight: PIXELS_PER_SLOT }}
            />

            {/* ── :30 day cells ── */}
            {weekDays.map((date, colIdx) => {
              const tasks30 = scheduledTasks.filter(t => {
                const d = new Date(t.scheduled_at!)
                return d.getDate() === date.getDate()
                    && d.getMonth() === date.getMonth()
                    && d.getHours() === hour
                    && d.getMinutes() === 30
              })
              return (
                <div
                  key={`${date.getTime()}-${hour}-30`}
                  className={`relative border-b border-border/40 hover:bg-accent/5 transition-colors p-1 flex flex-col gap-1 ${colIdx < 4 ? 'border-r border-border/50' : ''}`}
                  style={{ minHeight: PIXELS_PER_SLOT }}
                >
                  <DroppableSlot date={date} hour={hour} minute={30} />
                  {tasks30.map(task => {
                    const client = clients.find(c => c.id === task.client_id)
                    const taskId = String(task.id)
                    return (
                      <DraggableAgendaTask
                        key={task.id}
                        task={task}
                        heightPx={(task.estimated_minutes / 30) * PIXELS_PER_SLOT}
                        clientColor={client?.color}
                        clientName={client?.name}
                        onEditClick={() => setEditingTask(task)}
                        onUnschedule={!taskId.includes('-ghost-') ? async () => {
                          try { await updateTask(taskId, { scheduled_at: null }) } catch (e) { console.error(e) }
                        } : undefined}
                      />
                    )
                  })}
                </div>
              )
            })}

          </Fragment>
        ))}
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function AgendaGrid({
  tasks, clients, updateTask, removeTask, currentUserEmail,
}: {
  tasks: Task[]; clients: Client[]; updateTask: any; removeTask?: any; currentUserEmail?: string
}) {
  const [baseDate, setBaseDate] = useState(new Date())
  const [editingTask, setEditingTask] = useState<Task | null | false>(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const monday = startOfWeek(baseDate, { weekStartsOn: 1 })
  const weekDays = useMemo(() => Array.from({ length: 5 }, (_, i) => addDays(monday, i)), [monday])

  const scheduledTasks = useMemo(() => {
    const visibleTasks: Task[] = []
    tasks.forEach(t => {
      if (!t.scheduled_at) return
      const taskDate = new Date(t.scheduled_at)
      const start = new Date(weekDays[0]); start.setHours(0, 0, 0, 0)
      const end = new Date(weekDays[4]); end.setHours(23, 59, 59, 999)
      if (taskDate >= start && taskDate <= end) {
        visibleTasks.push(t)
      } else if (t.is_recurrent && taskDate < end) {
        const matchingDay = weekDays.find(d => d.getDay() === taskDate.getDay())
        if (matchingDay) {
          const virtualDate = new Date(matchingDay)
          virtualDate.setHours(taskDate.getHours(), taskDate.getMinutes(), 0, 0)
          visibleTasks.push({
            ...t,
            id: `${t.id}-ghost-${matchingDay.getTime()}`,
            scheduled_at: virtualDate.toISOString(),
            status: 'A fazer',
          } as any)
        }
      }
    })
    return visibleTasks
  }, [tasks, weekDays])

  const nextWeek = () => setBaseDate(addWeeks(baseDate, 1))
  const prevWeek = () => setBaseDate(subWeeks(baseDate, 1))
  const todayFn = () => setBaseDate(new Date())

  const bodyProps = { weekDays, scheduledTasks, clients, setEditingTask, updateTask }

  const taskModal = editingTask !== false && editingTask !== null && (
    <TaskModal
      task={editingTask}
      clients={clients}
      currentUserEmail={currentUserEmail}
      onClose={() => setEditingTask(false)}
      onDelete={editingTask && removeTask ? async () => {
        await removeTask(editingTask.id); setEditingTask(false)
      } : undefined}
      onSave={async (payload) => {
        await updateTask(editingTask.id, payload); setEditingTask(false)
      }}
    />
  )

  const header = (onToggle: () => void, icon: React.ReactNode) => (
    <header className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0 bg-bg-surface-raised sticky top-0 z-[60]">
      <div className="flex items-center gap-3">
        <CalendarDays size={20} className="text-accent" strokeWidth={2} />
        <h2 className="text-section text-text-primary uppercase tracking-wide font-bold">
          {format(weekDays[0], "d 'de' MMM", { locale: ptBR })} — {format(weekDays[4], "d 'de' MMM", { locale: ptBR })}
        </h2>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={todayFn} className="text-small font-medium text-text-secondary hover:text-text-primary px-3 py-1 bg-bg-app border border-border rounded-radius-sm transition-colors">Hoje</button>
        <div className="w-px h-4 bg-border" />
        <button onClick={prevWeek} className="text-text-secondary hover:bg-bg-surface p-1 rounded-radius-sm border border-transparent hover:border-border transition-colors cursor-pointer shadow-sm">
          <ChevronLeft size={18} strokeWidth={1.5} />
        </button>
        <button onClick={nextWeek} className="text-text-secondary hover:bg-bg-surface p-1 rounded-radius-sm border border-transparent hover:border-border transition-colors cursor-pointer shadow-sm">
          <ChevronRight size={18} strokeWidth={1.5} />
        </button>
        <div className="w-px h-4 bg-border" />
        <button onClick={onToggle} className="text-text-secondary hover:text-accent hover:bg-accent/10 p-1 rounded-radius-sm border border-transparent hover:border-border transition-colors cursor-pointer" title={isExpanded ? 'Recolher' : 'Expandir'}>
          {icon}
        </button>
      </div>
    </header>
  )

  return (
    <>
      {/* ── Seção normal (grid só monta aqui quando NÃO expandido) ── */}
      <section className="bg-bg-surface border border-border rounded-radius-md shadow-card flex flex-col h-full min-h-0 relative">
        {header(() => setIsExpanded(true), <Maximize2 size={16} strokeWidth={1.5} />)}

        {/* Grid montado aqui apenas quando não está expandido */}
        {!isExpanded && <AgendaGridBody {...bodyProps} />}

        {/* Placeholder visual quando expandido */}
        {isExpanded && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-text-tertiary text-small italic">Agenda em tela cheia…</p>
          </div>
        )}

        {taskModal}
      </section>

      {/* ── Portal tela cheia (grid só monta aqui quando expandido) ── */}
      {isExpanded && createPortal(
        <div className="fixed inset-0 z-[99999] bg-bg-app/70 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => setIsExpanded(false)} />
          <div className="relative z-10 bg-bg-surface border border-border rounded-radius-md shadow-modal w-full max-w-[95vw] h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {header(() => setIsExpanded(false), <Minimize2 size={16} strokeWidth={1.5} />)}
            <AgendaGridBody {...bodyProps} />
            {taskModal}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
