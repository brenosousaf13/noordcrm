import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { CheckSquare, Paperclip, Clock, Zap, Plus, X, Filter, Check } from 'lucide-react'
import { useDraggable } from '@dnd-kit/core'
import type { Database } from '../../types/database.types'
import { format, isToday, isTomorrow, isPast, endOfWeek, startOfWeek } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { TaskModal } from './TaskModal'

type Task = Database['public']['Tables']['tasks']['Row']
type Client = Database['public']['Tables']['clients']['Row']

const USER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'brenosousaf13@gmail.com': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'lucassousaf01@gmail.com': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'marceladneves@yahoo.com.br': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
}

function getUserName(email: string | null): string {
  if (!email) return 'N/A'
  if (email.includes('breno')) return 'Breno'
  if (email.includes('lucas')) return 'Lucas'
  if (email.includes('marcela')) return 'Marcela'
  return email.split('@')[0]
}

interface ContextMenuState { x: number; y: number; task: Task }

export function DraggableTaskCard({
  task, clientColor, clientName, onEditClick, onToggleDone, onContextMenu
}: {
  task: Task
  clientColor?: string
  clientName?: string
  onEditClick: () => void
  onToggleDone: () => void
  onContextMenu: (e: React.MouseEvent) => void
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: String(task.id),
    data: { task, type: 'board_task', clientColor, clientName }
  })

  if (isDragging) {
     return <div ref={setNodeRef} className="bg-bg-surface-raised rounded-radius-sm border-2 border-dashed border-border opacity-50 min-h-[80px]" />
  }

  const isDone = task.status === 'Concluído' || task.is_done

  const parseLocalDate = (d: string) => new Date(d.includes('T') ? d : d + 'T00:00:00')
  const refDate = task.deadline ? parseLocalDate(task.deadline) : task.start_date ? parseLocalDate(task.start_date) : null

  let deadlineLabel = null
  let isLate = false
  if (refDate) {
    if (isToday(refDate)) deadlineLabel = `HOJE às ${format(refDate, 'HH:mm')}`
    else if (isTomorrow(refDate)) deadlineLabel = `AMANHÃ às ${format(refDate, 'HH:mm')}`
    else deadlineLabel = format(refDate, "dd/MM 'às' HH:mm", { locale: ptBR })
    if (isPast(refDate) && !isDone) isLate = true
  }

  const userColors = task.assigned_to ? USER_COLORS[task.assigned_to] : null
  const userName = getUserName(task.assigned_to)

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => onEditClick()}
      onContextMenu={onContextMenu}
      className={`bg-bg-surface rounded-radius-sm shadow-card border border-border border-l-4 hover:shadow-raised hover:-translate-y-[1px] transition-all cursor-grab flex relative overflow-hidden group ${isDone ? 'opacity-40 grayscale-[0.8]' : ''}`}
      style={{ borderLeftColor: clientColor || '#888888' }}
    >
      {/* Checkbox coluna esquerda */}
      <div className="flex items-start pt-3 pl-3 pr-1 shrink-0">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleDone() }}
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0 cursor-pointer ${
            isDone
              ? 'bg-accent border-accent text-white'
              : 'border-border hover:border-accent hover:bg-accent/10'
          }`}
          title={isDone ? 'Marcar como pendente' : 'Marcar como feito'}
        >
          {isDone && <Check size={11} strokeWidth={3} />}
        </button>
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 p-3 pl-2 flex flex-col">
        <div className="flex items-start gap-2">
          <h3 className={`text-body-lg font-semibold leading-tight line-clamp-3 flex-1 ${isDone ? 'line-through text-text-tertiary' : 'text-text-primary'}`}>
             {task.title}
          </h3>
          {task.file_url && (
             <a href={task.file_url} target="_blank" rel="noreferrer" className="text-text-secondary hover:text-accent mt-0.5 p-1 rounded-radius-sm bg-bg-surface-raised cursor-pointer z-50 relative pointer-events-auto shrink-0" onClick={(e) => e.stopPropagation()} title="Abrir Anexo">
                <Paperclip size={12} />
             </a>
          )}
        </div>

        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          {clientName && <p className={`text-small font-bold ${isDone ? 'text-text-tertiary' : 'text-text-secondary'}`}>{clientName}</p>}

          {userName !== 'N/A' && (
             <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-radius-sm border flex items-center gap-1 ${
               userColors ? `${userColors.bg} ${userColors.text} ${userColors.border}` : 'bg-bg-surface-raised text-text-secondary border-border'
             }`}>
                👤 {userName}
             </span>
          )}

          {isDone && (
            <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-radius-sm bg-green-100 text-green-700 border border-green-200">
               FEITO
            </span>
          )}

          {task.is_recurrent && (
             <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-radius-sm bg-[#EEF2FC] text-[#3355A0] border border-[#D5E0F9] flex items-center gap-1">
                <Zap size={9} fill="currentColor" /> Recorrente
             </span>
          )}

          <span className={`text-mono text-[10px] font-semibold px-1.5 py-[2px] rounded-radius-sm whitespace-nowrap hidden sm:flex items-center gap-1 ${isDone ? 'text-text-tertiary border border-border line-through' : 'text-accent bg-accent-light'}`}>
             <Clock size={10} /> {task.estimated_minutes}m
          </span>
        </div>
      </div>

      {/* Coluna direita: deadline + prioridade */}
      <div className="flex flex-col items-center gap-1.5 shrink-0 p-2 pl-1 border-l border-border/50">
         {deadlineLabel && (
           <span className={`text-mono text-[9px] font-bold px-1.5 py-0.5 rounded-radius-sm border text-center break-words max-w-[60px] leading-tight ${isLate && !isDone ? 'text-status-red bg-[#FEE2E2] border-[#FCA5A5]' : isDone ? 'text-text-tertiary bg-bg-surface-raised border-border opacity-50' : 'text-status-orange bg-[#FEF3C7] border-[#FDE68A]'}`}>
             {deadlineLabel}
           </span>
         )}
         {!isDone && (
           <div className="flex gap-[3px] items-start mt-auto" title={task.priority === 1 ? 'Alta' : task.priority === 2 ? 'Média' : 'Baixa'}>
             <div className={`w-[3px] h-3.5 rounded-full ${task.priority === 1 ? 'bg-red' : task.priority === 2 ? 'bg-orange' : 'bg-gray-muted'}`} />
             <div className={`w-[3px] h-2.5 rounded-full ${task.priority === 1 ? 'bg-red' : task.priority === 2 ? 'bg-orange' : 'bg-gray-muted'}`} />
             <div className={`w-[3px] h-1.5 rounded-full ${task.priority === 1 ? 'bg-red' : 'bg-transparent'}`} />
           </div>
         )}
      </div>
    </div>
  )
}

export function TasksBoard({
  tasks, clients, addTask, updateTask, removeTask, newTaskTrigger, currentUserEmail
}: {
  tasks: Task[]
  clients: Client[]
  addTask?: any
  updateTask: any
  removeTask?: any
  newTaskTrigger?: number
  currentUserEmail?: string
}) {
  const [activeClientTab, setActiveClientTab] = useState<string>('todas')
  const [showFilters, setShowFilters] = useState(false)
  const [showAllocated, setShowAllocated] = useState(() => localStorage.getItem('noord_showAllocated') === 'true')
  const [filterDateMode, setFilterDateMode] = useState(() => localStorage.getItem('noord_filterDateMode') || 'todos')
  const [filterDateCustom, setFilterDateCustom] = useState<string>(() => localStorage.getItem('noord_filterDateCustom') || '')
  const [filterAssignee, setFilterAssignee] = useState(() => localStorage.getItem('noord_filterAssignee') || 'todos')
  const [editingTask, setEditingTask] = useState<Task | null | false>(false)
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const contextMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    localStorage.setItem('noord_showAllocated', String(showAllocated))
    localStorage.setItem('noord_filterDateMode', filterDateMode)
    localStorage.setItem('noord_filterDateCustom', filterDateCustom)
    localStorage.setItem('noord_filterAssignee', filterAssignee)
  }, [showAllocated, filterDateMode, filterDateCustom, filterAssignee])

  // Abre modal de nova tarefa via trigger externo (Ctrl+A)
  useEffect(() => {
    if (newTaskTrigger && newTaskTrigger > 0) setEditingTask(null)
  }, [newTaskTrigger])

  // Fecha context menu ao clicar fora
  useEffect(() => {
    const handleClick = () => setContextMenu(null)
    if (contextMenu) document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [contextMenu])

  const teamUsers = [
    { id: 'brenosousaf13@gmail.com', name: 'Breno' },
    { id: 'lucassousaf01@gmail.com', name: 'Lucas' },
    { id: 'marceladneves@yahoo.com.br', name: 'Marcela' },
  ]

  const handleContextMenu = useCallback((e: React.MouseEvent, task: Task) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, task })
  }, [])

  const handleDuplicate = async (task: Task) => {
    if (!addTask) return
    setContextMenu(null)
    const { id: _id, created_at: _ca, ...rest } = task as any
    await addTask({ ...rest, title: `${task.title} (cópia)`, scheduled_at: null, is_done: false, status: 'A fazer' })
  }

  const handleDelete = async (task: Task) => {
    if (!removeTask) return
    setContextMenu(null)
    if (confirm(`Apagar "${task.title}"? Essa ação não pode ser desfeita.`)) {
      await removeTask(task.id)
    }
  }

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (activeClientTab !== 'todas' && t.client_id !== activeClientTab) return false
      if (!showAllocated && t.scheduled_at !== null) return false
      if (filterAssignee !== 'todos' && t.assigned_to !== filterAssignee) return false

      if (filterDateMode !== 'todos') {
         const parseLocalDate = (s: string) => new Date(s.includes('T') ? s : s + 'T00:00:00')
         const d = t.deadline ? parseLocalDate(t.deadline) : t.start_date ? parseLocalDate(t.start_date) : null
         if (!d) return false

         if (filterDateMode === 'hoje') {
            if (!isToday(d)) return false
         } else if (filterDateMode === 'amanha') {
            if (!isTomorrow(d)) return false
         } else if (filterDateMode === 'semana') {
            const start = startOfWeek(new Date(), { weekStartsOn: 1 })
            const end = endOfWeek(new Date(), { weekStartsOn: 1 })
            if (d < start || d > end) return false
         } else if (filterDateMode === 'custom' && filterDateCustom) {
            const customD = new Date(filterDateCustom.includes('T') ? filterDateCustom : filterDateCustom + 'T00:00:00')
            if (d.getDate() !== customD.getDate() || d.getMonth() !== customD.getMonth() || d.getFullYear() !== customD.getFullYear()) return false
         }
      }

      return true
    }).sort((a, b) => {
       const aDone = a.status === 'Concluído' || a.is_done
       const bDone = b.status === 'Concluído' || b.is_done
       if (aDone && !bDone) return 1
       if (!aDone && bDone) return -1

       const parseD = (s: string) => new Date(s.includes('T') ? s : s + 'T00:00:00').getTime()
       const dValA = a.deadline ? parseD(a.deadline) : a.start_date ? parseD(a.start_date) : 0
       const dValB = b.deadline ? parseD(b.deadline) : b.start_date ? parseD(b.start_date) : 0

       if (!dValA && dValB) return 1
       if (dValA && !dValB) return -1
       if (a.priority !== b.priority) return a.priority - b.priority

       return dValA - dValB
    })
  }, [tasks, activeClientTab, showAllocated, filterAssignee, filterDateMode, filterDateCustom])

  const availableClientsTabs = useMemo(() => {
    return clients.filter(c => tasks.some(t => t.client_id === c.id))
  }, [clients, tasks])

  return (
    <section className="bg-bg-surface border border-border rounded-radius-md shadow-card flex flex-col h-full min-h-0 relative z-10 w-full overflow-visible">

      <header className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0 bg-bg-surface-raised z-20 sticky top-0 relative">
        <div className="flex items-center gap-2">
          <CheckSquare size={20} className="text-accent" strokeWidth={2} />
          <h2 className="text-section text-text-primary uppercase tracking-wide font-bold leading-none mt-1">Inbox Pendentes</h2>
        </div>

        <div className="flex items-center gap-2 relative">
           <button
             onClick={() => setShowFilters(!showFilters)}
             className={`flex items-center justify-center p-2 rounded-radius-sm transition-colors border ${showFilters || filterAssignee !== 'todos' || filterDateMode !== 'todos' ? 'bg-accent-light text-accent border-accent/20' : 'bg-bg-surface border-border text-text-secondary hover:bg-bg-app'}`}
             title="Filtros"
           >
             <Filter size={16} strokeWidth={2} />
           </button>

           {showFilters && (
             <div className="absolute top-[calc(100%+8px)] right-0 w-[300px] bg-bg-surface border border-border rounded-radius-md shadow-modal p-4 flex flex-col gap-4 z-[200] animate-in slide-in-from-top-2 duration-150">
                <div className="flex justify-between items-center border-b border-border pb-2">
                   <h4 className="text-small font-bold uppercase tracking-wide text-text-primary">Filtros Ativos</h4>
                   <button onClick={() => setShowFilters(false)} className="text-text-tertiary hover:text-text-primary"><X size={14}/></button>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={!showAllocated} onChange={e => setShowAllocated(!e.target.checked)} className="form-checkbox text-accent border-border rounded-sm focus:ring-0" />
                  <span className="text-body text-text-secondary">Ocultar Agenda (Recomendado)</span>
                </label>

                <div className="space-y-1">
                   <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Período Limite</label>
                   <select value={filterDateMode} onChange={e => setFilterDateMode(e.target.value)} className="w-full text-small px-2 py-1.5 bg-bg-app border border-border rounded-radius-sm focus:border-accent">
                      <option value="todos">Qualquer Data</option>
                      <option value="hoje">Para Hoje</option>
                      <option value="amanha">Para Amanhã</option>
                      <option value="semana">Nesta Semana</option>
                      <option value="custom">Calendário Específico...</option>
                   </select>
                   {filterDateMode === 'custom' && (
                      <input type="date" value={filterDateCustom} onChange={e => setFilterDateCustom(e.target.value)} className="w-full mt-2 text-small px-2 py-1.5 bg-bg-app border border-border rounded-radius-sm focus:border-accent" />
                   )}
                </div>

                <div className="space-y-1">
                   <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Responsável</label>
                   <select value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)} className="w-full text-small px-2 py-1.5 bg-bg-app border border-border rounded-radius-sm focus:border-accent">
                      <option value="todos">Todos da Equipe</option>
                      {teamUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                   </select>
                </div>

                <button onClick={() => { setFilterDateMode('todos'); setFilterAssignee('todos'); setShowAllocated(false) }} className="text-[10px] uppercase font-bold text-text-tertiary hover:text-text-primary text-center pt-2">Limpar Tudo</button>
             </div>
           )}

           <button onClick={() => setEditingTask(null)} className="flex items-center gap-1.5 px-3 py-1.5 text-small font-semibold text-white bg-accent hover:opacity-90 transition-opacity rounded-radius-sm shadow-sm">
             <Plus size={16} strokeWidth={2.5} /> Nova Tarefa
           </button>
        </div>
      </header>

      <div className="flex items-center gap-1 px-3 py-2 border-b border-border overflow-x-auto shrink-0 scrollbar-hide z-10 bg-bg-surface shadow-[0_1px_0_0_var(--border)] min-h-[45px]">
         <button onClick={() => setActiveClientTab('todas')} className={`px-3 py-1 rounded-radius-sm text-small font-bold transition-colors shrink-0 ${activeClientTab === 'todas' ? 'bg-accent text-white' : 'bg-transparent text-text-secondary hover:bg-bg-surface-raised'}`}>
           Visão Geral
         </button>
         {availableClientsTabs.map(c => (
           <button key={c.id} onClick={() => setActiveClientTab(c.id)} className={`px-3 py-1 rounded-radius-sm text-small font-semibold transition-colors shrink-0 ${activeClientTab === c.id ? 'bg-accent text-white' : 'bg-transparent text-text-secondary hover:bg-bg-surface-raised flex items-center gap-2'}`}>
             {activeClientTab !== c.id && <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.color }} />}
             {c.name}
           </button>
         ))}
      </div>

      <div className="flex-1 p-3 overflow-y-auto bg-bg-app/30 space-y-2 relative z-0 pb-12">
        {filteredTasks.length === 0 && (
          <div className="text-center p-6 text-text-tertiary text-small flex flex-col items-center gap-2 mt-4 opacity-70">
             <span className="text-2xl mb-2">📭</span>
             <p className="font-semibold text-body">A Caixa de Entrada está limpa.</p>
             <p className="text-[10px] max-w-[200px] leading-tight">As tarefas criadas ou filtradas não possuem pendências aqui.</p>
          </div>
        )}

         {filteredTasks.map(task => {
          const client = clients.find(c => c.id === task.client_id)
          return (
             <DraggableTaskCard
               key={task.id}
               task={task}
               clientColor={client?.color}
               clientName={client?.name}
               onEditClick={() => setEditingTask(task)}
               onToggleDone={() => updateTask(task.id, {
                 is_done: !task.is_done,
                 status: task.is_done ? 'A fazer' : 'Concluído'
               })}
               onContextMenu={(e) => handleContextMenu(e, task)}
             />
          )
        })}
      </div>

      {/* Context Menu (botão direito) */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed z-[9999] bg-bg-surface border border-border rounded-radius-md shadow-modal py-1 min-w-[160px] animate-in fade-in zoom-in-95 duration-100"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => handleDuplicate(contextMenu.task)}
            className="w-full text-left px-4 py-2.5 text-small font-medium text-text-primary hover:bg-bg-app transition-colors flex items-center gap-2"
          >
            <span>📋</span> Duplicar Tarefa
          </button>
          <div className="h-px bg-border mx-2 my-1" />
          <button
            onClick={() => handleDelete(contextMenu.task)}
            className="w-full text-left px-4 py-2.5 text-small font-medium text-status-red hover:bg-status-red/5 transition-colors flex items-center gap-2"
          >
            <span>🗑️</span> Excluir Tarefa
          </button>
        </div>
      )}

      {editingTask !== false && (
         <TaskModal
            task={editingTask}
            clients={clients}
            currentUserEmail={currentUserEmail}
            onClose={() => setEditingTask(false)}
            onDelete={editingTask && removeTask ? async () => {
               await removeTask(editingTask.id)
               setEditingTask(false)
            } : undefined}
            onSave={async (payload) => {
               if (editingTask === null) {
                  if (addTask) await addTask(payload)
               } else {
                  await updateTask(editingTask.id, payload)
               }
            }}
         />
      )}

    </section>
  )
}
