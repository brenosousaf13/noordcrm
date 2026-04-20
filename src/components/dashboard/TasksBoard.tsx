import { useState, useMemo, useEffect } from 'react'
import { CheckSquare, Paperclip, Clock, Zap, Plus, X, Filter } from 'lucide-react'
import { useDraggable } from '@dnd-kit/core'
import type { Database } from '../../types/database.types'
import { format, isToday, isTomorrow, isPast, endOfWeek, startOfWeek } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { TaskModal } from './TaskModal'

type Task = Database['public']['Tables']['tasks']['Row']
type Client = Database['public']['Tables']['clients']['Row']

export function DraggableTaskCard({ task, clientColor, clientName, onEditClick }: { task: Task, clientColor?: string, clientName?: string, onEditClick: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: String(task.id),
    data: { task, type: 'board_task', clientColor, clientName }
  })

  if (isDragging) {
     return <div ref={setNodeRef} className="bg-bg-surface-raised rounded-radius-sm border-2 border-dashed border-border opacity-50 min-h-[80px]" />
  }

  // V2 Spec: "Só deve haver dois status: A fazer e Feito"
  // E quando finalizada: "card deve ficar acinzentado/clareado/apagado"
  const isDone = task.status === 'Concluído' || task.is_done
  let deadlineLabel = null
  let isLate = false

  const refDate = task.deadline ? new Date(task.deadline) : task.start_date ? new Date(task.start_date) : null

  if (refDate) {
    if (isToday(refDate)) deadlineLabel = `ALERTA HOJE às ${format(refDate, 'HH:mm')}`
    else if (isTomorrow(refDate)) deadlineLabel = `AMANHÃ às ${format(refDate, 'HH:mm')}`
    else deadlineLabel = format(refDate, "dd/MM 'às' HH:mm", { locale: ptBR })
    
    if (isPast(refDate) && !isDone) isLate = true
  }
  
  let userName = "N/A"
  if (task.assigned_to) {
     if (task.assigned_to.includes('breno')) userName = "Breno"
     else if (task.assigned_to.includes('lucas')) userName = "Lucas"
     else if (task.assigned_to.includes('marcela')) userName = "Marcela"
  }

  // V2 Spec: Altura varia de acordo com o Tempo Estimado (quanto maior, maior)
  // Pixels per hour é 80 na Agenda. Vamos adotar uma escala mais amigável na Inbox (ex: 60px/h).
  const calculateHeight = (mins: number) => {
     return Math.max(76, (mins / 60) * 80) // minimo 76px pra caber os conteudos
  }

  return (
    <div 
      ref={setNodeRef} 
      {...listeners} 
      {...attributes}
      onClick={() => {
         // O DND blocka clicks se não cuidarmos, mas ouvintes de evento resolvem.
         onEditClick()
      }}
      className={`bg-bg-surface rounded-radius-sm shadow-card border border-border border-l-4 p-3 hover:shadow-raised hover:-translate-y-[1px] transition-all cursor-grab flex flex-col relative overflow-hidden group ${isDone ? 'opacity-40 grayscale-[0.8]' : ''}`}
      style={{ borderLeftColor: clientColor || '#888888', minHeight: `${calculateHeight(task.estimated_minutes)}px` }}
    >
      <div className="flex justify-between items-start h-full">
         <div className="flex-1 mr-2 flex flex-col max-h-full h-full justify-between">
           
           <div className="flex items-start gap-2">
             <h3 className={`text-body-lg font-semibold leading-tight line-clamp-3 ${isDone ? 'line-through text-text-tertiary' : 'text-text-primary'}`}>
                {task.title}
             </h3>
             {task.file_url && (
                <a href={task.file_url} target="_blank" rel="noreferrer" className="text-text-secondary hover:text-accent mt-0.5 p-1 rounded-radius-sm bg-bg-surface-raised cursor-pointer z-50 relative pointer-events-auto" onClick={(e) => e.stopPropagation()} title="Abrir Anexo">
                   <Paperclip size={12} />
                </a>
             )}
           </div>
           
           <div className="flex items-center gap-2 mt-2 flex-wrap">
             {clientName && <p className={`text-small font-bold ${isDone ? 'text-text-tertiary' : 'text-text-secondary'}`}>{clientName}</p>}
             
             {/* V2 Status Binário (Visual) */}
             <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-radius-sm ${
                isDone ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-bg-surface-raised text-text-secondary border border-border'
             }`}>
                {isDone ? 'FEITO' : 'A FAZER'}
             </span>
             
             {userName !== "N/A" && (
                <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-radius-sm bg-bg-surface-raised text-text-secondary border border-border flex items-center gap-1">
                   👤 {userName}
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

         {/* Lado Direito V2 (Data com Traços Verticais em Baixo) */}
         <div className="flex flex-col items-center gap-1.5 shrink-0 pl-1 border-l border-border/50 h-full">
            {deadlineLabel && (
              <span className={`text-mono text-[9px] font-bold px-1.5 py-0.5 rounded-radius-sm border mb-2 text-center break-words max-w-[60px] leading-tight ${isLate && !isDone ? 'text-status-red bg-[#FEE2E2] border-[#FCA5A5]' : isDone ? 'text-text-tertiary bg-bg-surface-raised border-border opacity-50' : 'text-status-orange bg-[#FEF3C7] border-[#FDE68A]'}`}>
                {deadlineLabel}
              </span>
            )}
            
            {/* V2 Spec: 3 tracinhos VERTICAIS abaixo da data! */}
            {!isDone && (
              <div className="flex gap-[3px] items-start mt-auto" title={task.priority === 1 ? 'Alta' : task.priority === 2 ? 'Média' : 'Baixa'}>
                <div className={`w-[3px] h-3.5 rounded-full ${task.priority === 1 ? 'bg-red' : task.priority === 2 ? 'bg-orange' : 'bg-gray-muted'}`} />
                <div className={`w-[3px] h-2.5 rounded-full ${task.priority === 1 ? 'bg-red' : task.priority === 2 ? 'bg-orange' : 'bg-gray-muted'}`} />
                <div className={`w-[3px] h-1.5 rounded-full ${task.priority === 1 ? 'bg-red' : 'bg-transparent'}`} />
              </div>
            )}
         </div>
      </div>
    </div>
  )
}

export function TasksBoard({ tasks, clients, addTask, updateTask, removeTask }: { tasks: Task[], clients: Client[], addTask?: any, updateTask: any, removeTask?: any }) {
  const [activeClientTab, setActiveClientTab] = useState<string>('todas')

  // --- V2 Super Filter States (LocalStorage) ---
  const [showFilters, setShowFilters] = useState(false)
  
  const [showAllocated, setShowAllocated] = useState(() => localStorage.getItem('noord_showAllocated') === 'true')
  const [filterDateMode, setFilterDateMode] = useState(() => localStorage.getItem('noord_filterDateMode') || 'todos') 
  const [filterDateCustom, setFilterDateCustom] = useState<string>(() => localStorage.getItem('noord_filterDateCustom') || '')
  const [filterAssignee, setFilterAssignee] = useState(() => localStorage.getItem('noord_filterAssignee') || 'todos')
  
  // Modal de Criação / Edição
  const [editingTask, setEditingTask] = useState<Task | null | false>(false) // false = hidden, null = creating, Task = editing

  useEffect(() => {
    localStorage.setItem('noord_showAllocated', String(showAllocated))
    localStorage.setItem('noord_filterDateMode', filterDateMode)
    localStorage.setItem('noord_filterDateCustom', filterDateCustom)
    localStorage.setItem('noord_filterAssignee', filterAssignee)
  }, [showAllocated, filterDateMode, filterDateCustom, filterAssignee])

  const teamUsers = [
    { id: 'brenosousaf13@gmail.com', name: 'Breno' },
    { id: 'lucassousaf01@gmail.com', name: 'Lucas' },
    { id: 'marceladneves@yahoo.com.br', name: 'Marcela' },
  ]

  // Motor de Filtragem Super Inteligente
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      // 0. Tab de Cliente
      if (activeClientTab !== 'todas' && t.client_id !== activeClientTab) return false
      
      // 1. Ocultar Alocadas V2 (Se tem scheduled_at, some daqui por padrão)
      if (!showAllocated && t.scheduled_at !== null) return false

      // 2. Filtro Responsável
      if (filterAssignee !== 'todos' && t.assigned_to !== filterAssignee) return false
      
      // 3. Filtros de Data V2 (Hoje, Amanhã, Semana, Calendário)
      if (filterDateMode !== 'todos') {
         const d = t.deadline ? new Date(t.deadline) : t.start_date ? new Date(t.start_date) : null
         if (!d) return false // Se não tem data nenhuma e o filtro pede data, some!
         
         if (filterDateMode === 'hoje') {
            if (!isToday(d)) return false
         } else if (filterDateMode === 'amanha') {
            if (!isTomorrow(d)) return false
         } else if (filterDateMode === 'semana') {
            const start = startOfWeek(new Date(), { weekStartsOn: 1 })
            const end = endOfWeek(new Date(), { weekStartsOn: 1 })
            if (d < start || d > end) return false
         } else if (filterDateMode === 'custom' && filterDateCustom) {
            const customD = new Date(filterDateCustom)
            if (d.getDate() !== customD.getDate() || d.getMonth() !== customD.getMonth() || d.getFullYear() !== customD.getFullYear()) return false
         }
      }

      return true
    }).sort((a, b) => {
       // Status Sort
       const aDone = a.status === 'Concluído' || a.is_done
       const bDone = b.status === 'Concluído' || b.is_done
       if (aDone && !bDone) return 1
       if (!aDone && bDone) return -1
       
       // Date Sort
       const dValA = a.deadline ? new Date(a.deadline).getTime() : a.start_date ? new Date(a.start_date).getTime() : 0
       const dValB = b.deadline ? new Date(b.deadline).getTime() : b.start_date ? new Date(b.start_date).getTime() : 0
       
       // Priority Sort
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
             title="Super Filtros"
           >
             <Filter size={16} strokeWidth={2} />
           </button>

           {/* Painel Suspenso de Filtros V2 */}
           {showFilters && (
             <div className="absolute top-[calc(100%+8px)] right-0 w-[300px] bg-bg-surface border border-border rounded-radius-md shadow-modal p-4 flex flex-col gap-4 z-[200] animate-in slide-in-from-top-2 duration-150">
                <div className="flex justify-between items-center border-b border-border pb-2">
                   <h4 className="text-small font-bold uppercase tracking-wide text-text-primary">Filtros Ativos</h4>
                   <button onClick={() => setShowFilters(false)} className="text-text-tertiary hover:text-text-primary"><X size={14}/></button>
                </div>
                
                {/* Ocultar Alocadas */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={!showAllocated} onChange={e => setShowAllocated(!e.target.checked)} className="form-checkbox text-accent border-border rounded-sm focus:ring-0" />
                  <span className="text-body text-text-secondary">Ocultar Agenda (Recomendado)</span>
                </label>

                {/* Filtro Data */}
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

                {/* Filtro Responsável */}
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

      {/* Abas Dinâmicas de Clientes */}
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

      {/* Listagem de Cards Read-Only */}
      <div className="flex-1 p-3 overflow-y-auto bg-bg-app/30 space-y-3 relative z-0 pb-12">
        {filteredTasks.length === 0 && (
          <div className="text-center p-6 text-text-tertiary text-small flex flex-col items-center gap-2 mt-4 opacity-70">
             <span className="text-2xl mb-2">📭</span>
             <p className="font-semibold text-body">A Caixa de Entrada está limpa.</p>
             <p className="text-[10px] max-w-[200px] leading-tight">As tarefas criadas ou filtadas não possuem pendências aqui. (Você pode ter filtrado ou alocado todas na Agenda já).</p>
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
             />
          )
        })}
      </div>

      {editingTask !== false && (
         <TaskModal 
            task={editingTask} 
            clients={clients} 
            onClose={() => setEditingTask(false)} 
            onDelete={editingTask && removeTask ? async () => {
               await removeTask(editingTask.id)
               setEditingTask(false)
            } : undefined}
            onSave={async (payload) => {
               if (editingTask === null) {
                  // Creating a new task
                  if (addTask) await addTask(payload)
               } else {
                  // Editing existing one
                  await updateTask(editingTask.id, payload)
               }
            }} 
         />
      )}

    </section>
  )
}
