import { useState, useMemo } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, X, CheckSquare } from 'lucide-react'
import { startOfWeek, addDays, setHours, format, addWeeks, subWeeks } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useDroppable, useDraggable } from '@dnd-kit/core'
import type { Database } from '../../types/database.types'

type Task = Database['public']['Tables']['tasks']['Row']
type Client = Database['public']['Tables']['clients']['Row']

const HOURS_START = 7
const HOURS = Array.from({ length: 14 }, (_, i) => i + HOURS_START) // 7h to 20h
const PIXELS_PER_HOUR = 80

// --- Subcomponentes de Drag and Drop --- 

function DroppableSlot({ date, hour }: { date: Date, hour: number }) {
  const slotDate = setHours(date, hour)
  const slotDateZeroed = new Date(slotDate)
  slotDateZeroed.setMinutes(0, 0, 0)
  
  const id = `AGENDA_SLOT_${slotDateZeroed.toISOString()}`
  const { isOver, setNodeRef } = useDroppable({ id })

  return (
    <div 
      ref={setNodeRef} 
      className={`absolute inset-0 z-0 transition-colors ${isOver ? 'bg-accent/10 outline-dashed outline-2 outline-accent outline-offset-[-2px]' : ''}`} 
    />
  )
}

function DraggableAgendaTask({ task, top, height, clientColor, clientName }: { task: Task, top: number, height: number, clientColor?: string, clientName?: string }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: String(task.id),
    data: { task }
  })
  
  const style = {
    top: `${top}px`,
    height: `${height}px`,
    ...(transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : {})
  }

  return (
    <div 
      ref={setNodeRef} 
      {...listeners} 
      {...attributes}
      className={`absolute left-1 right-2 bg-bg-surface rounded-radius-sm shadow-raised border border-border border-l-4 p-2 flex flex-col cursor-grab pointer-events-auto hover:-translate-y-[1px] transition-transform ${isDragging ? 'opacity-50 z-50 cursor-grabbing' : 'z-20'}`}
      style={{ ...style, borderLeftColor: clientColor || '#888888' }}
    >
      <div className={`flex justify-between items-start mb-1 ${height <= 50 ? 'h-full items-center' : ''}`}>
        <div className={`flex flex-col overflow-hidden leading-tight ${height <= 50 ? 'justify-center h-full' : ''}`}>
           <span className="text-body-lg font-medium truncate">{task.title}</span>
           {height > 50 && clientName && <span className="text-[10px] text-text-secondary truncate mt-[2px]">{clientName}</span>}
           {height <= 50 && clientName && <span className="text-[10px] text-text-secondary truncate mt-[2px] mr-2">{clientName}</span>}
        </div>
        
        {/* Lado Direito do Card */}
        <div className="flex items-center gap-1 shrink-0 ml-1">
           {height > 50 && (
             <div className="flex flex-col gap-[3px] mt-1 items-end opacity-80 shrink-0">
               <div className={`w-3.5 h-[3px] rounded-full ${task.priority === 1 ? 'bg-red' : task.priority === 2 ? 'bg-orange' : 'bg-gray-muted'}`} />
               <div className={`w-2.5 h-[3px] rounded-full ${task.priority === 1 ? 'bg-red' : task.priority === 2 ? 'bg-orange' : 'bg-gray-muted'}`} />
               <div className={`w-1.5 h-[3px] rounded-full ${task.priority === 1 ? 'bg-red' : 'bg-transparent'}`} />
             </div>
           )}
           <span className="text-[10px] text-text-tertiary whitespace-nowrap mt-0.5">{task.estimated_minutes}m</span>
        </div>
      </div>
    </div>
  )
}


export function AgendaGrid({ tasks, clients, addTask }: { tasks: Task[], clients: Client[], addTask: any }) {
  const [baseDate, setBaseDate] = useState(new Date()) 
  
  // Computes Mon-Fri exactly relative to current base view
  const monday = startOfWeek(baseDate, { weekStartsOn: 1 })
  const weekDays = useMemo(() => Array.from({ length: 5 }, (_, i) => addDays(monday, i)), [monday])

  // Puxa as tarefas Agendadas *desta semana exibida*
  const scheduledTasks = useMemo(() => {
    const visibleTasks: Task[] = []
    
    tasks.forEach(t => {
      if (!t.scheduled_at) return
      const taskDate = new Date(t.scheduled_at)
      const start = new Date(weekDays[0])
      start.setHours(0,0,0,0)
      const end = new Date(weekDays[4])
      end.setHours(23,59,59,999)
      
      // Standard inclusion - Se cai exatamente nesta semana
      if (taskDate >= start && taskDate <= end) {
        visibleTasks.push(t)
      } 
      // Lógica de Recorrência - Se for de semanas passadas mas é "Infinita (Recorrente)", espelhar pra esta.
      else if (t.is_recurrent && taskDate < end) {
        const matchingDay = weekDays.find(d => d.getDay() === taskDate.getDay())
        if (matchingDay) {
           const virtualDate = new Date(matchingDay)
           virtualDate.setHours(taskDate.getHours(), taskDate.getMinutes(), 0, 0)
           
           visibleTasks.push({ 
             ...t, 
             id: `${t.id}-ghost-${matchingDay.getTime()}`, // Pseudo-id pra o react key dnd
             scheduled_at: virtualDate.toISOString(), 
             status: 'A fazer' // Fantasmas do futuro sempre nascem "A Fazer" por padrão visual
           } as any)
        }
      }
    })
    return visibleTasks
  }, [tasks, weekDays])

  const nextWeek = () => setBaseDate(addWeeks(baseDate, 1))
  const prevWeek = () => setBaseDate(subWeeks(baseDate, 1))
  const today = () => setBaseDate(new Date())

  // Define total height explicitly para resolver bug de CSS (scroll vertical grid gap)
  const totalGridHeight = HOURS.length * PIXELS_PER_HOUR

  return (
    <section className="bg-bg-surface border border-border rounded-radius-md shadow-card flex flex-col h-full min-h-0 relative">
      {/* Header */}
      <header className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0 bg-bg-surface-raised sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <CalendarDays size={20} className="text-accent" strokeWidth={2} />
          <h2 className="text-section text-text-primary uppercase tracking-wide font-bold">
            {format(weekDays[0], "d 'de' MMM", { locale: ptBR })} — {format(weekDays[4], "d 'de' MMM", { locale: ptBR })}
          </h2>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={today} className="text-small font-medium text-text-secondary hover:text-text-primary px-3 py-1 bg-bg-app border border-border rounded-radius-sm transition-colors">
              Hoje
           </button>
           <div className="w-px h-4 bg-border" />
           <button onClick={prevWeek} className="text-text-secondary hover:bg-bg-surface p-1 rounded-radius-sm border border-transparent hover:border-border transition-colors cursor-pointer shadow-sm">
             <ChevronLeft size={18} strokeWidth={1.5} />
           </button>
           <button onClick={nextWeek} className="text-text-secondary hover:bg-bg-surface p-1 rounded-radius-sm border border-transparent hover:border-border transition-colors cursor-pointer shadow-sm">
             <ChevronRight size={18} strokeWidth={1.5} />
           </button>
        </div>
      </header>

      {/* Grid Overflow Container */}
      <div className="flex-1 overflow-y-auto flex flex-col relative bg-bg-app/30">
        
        {/* Days Header */}
        <div className="flex border-b border-border sticky top-0 bg-bg-surface z-20 shrink-0 shadow-[0_1px_0_0_var(--border)]">
          <div className="w-12 shrink-0 border-r border-border"></div>
          {weekDays.map((date) => (
            <div key={date.toISOString()} className="flex-1 text-center py-2 flex flex-col items-center justify-center border-r border-border last:border-r-0">
              <span className="text-label text-text-tertiary uppercase">{format(date, 'eee', { locale: ptBR })}</span>
              <span className="text-body-lg font-bold text-text-primary leading-tight">{format(date, 'd')}</span>
            </div>
          ))}
        </div>

        {/* Time Grid Matrix - Bugfix applying absolute explicit height to enforce full border paints */}
        <div className="flex-1 flex relative" style={{ height: totalGridHeight }}>
           
           {/* Eixo Y: Horários */}
           <div className="w-12 shrink-0 border-r border-border flex flex-col bg-bg-surface opacity-90 z-10">
             {HOURS.map((hour) => (
               <div key={hour} className="relative border-b border-transparent shrink-0" style={{ height: PIXELS_PER_HOUR }}>
                 <span className="text-mono text-[10px] text-text-tertiary absolute -top-[9px] right-2 bg-bg-surface px-0.5 leading-none">
                   {hour.toString().padStart(2, '0')}:00
                 </span>
               </div>
             ))}
           </div>

           {/* Colunas Verticais e Droppables */}
           <div className="flex-1 flex relative">
             
             {/* Background Lines Físicas e Droppables em Layer 0 */}
             {weekDays.map((date, colIdx) => (
               <div key={`col-${date.getTime()}`} className={`flex-1 border-r border-border/50 relative flex flex-col ${colIdx === 4 ? 'border-r-0' : ''}`}>
                  {HOURS.map((hour) => (
                    <div 
                       key={`cell-${date.getTime()}-${hour}`} 
                       className="w-full relative shrink-0 border-b border-border/40 hover:bg-accent/5 transition-colors group" 
                       style={{ height: PIXELS_PER_HOUR }}
                    >
                       {/* Elemento que capta o Hover do DND */}
                       <DroppableSlot date={date} hour={hour} />
                    </div>
                  ))}

                  {/* Renderizando as Tasks programadas HOJE (OVERLAYS NESSA COLUNA) */}
                  {scheduledTasks.map(task => {
                     const taskDate = new Date(task.scheduled_at!)
                     if (taskDate.getDate() !== date.getDate() || taskDate.getMonth() !== date.getMonth()) return null

                     const client = clients.find(c => c.id === task.client_id)
                     
                     // Matemáticas exatas
                     const hoursFromStart = (taskDate.getHours() + (taskDate.getMinutes() / 60)) - HOURS_START
                     const topPx = hoursFromStart * PIXELS_PER_HOUR
                     const heightPx = (task.estimated_minutes / 60) * PIXELS_PER_HOUR

                     // Evitar sumir pra baixo do calendário 
                     const safeTop = Math.min(topPx, totalGridHeight - heightPx)

                     return (
                       <DraggableAgendaTask 
                         key={task.id} 
                         task={task} 
                         top={safeTop} 
                         height={heightPx} 
                         clientColor={client?.color}
                         clientName={client?.name}
                       />
                     )
                  })}

               </div>
             ))}

           </div>
        </div>
      </div>

    </section>
  )
}
