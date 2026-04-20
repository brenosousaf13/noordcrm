import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { LayoutDashboard, Users, CheckSquare, FileText, CircleUser, LogOut } from 'lucide-react'
import { AgendaGrid } from '../components/dashboard/AgendaGrid'
import { TasksBoard } from '../components/dashboard/TasksBoard'
import { NotesPanel } from '../components/dashboard/NotesPanel'
import { ClientsPage } from '../components/clients/ClientsPage'
import { DndContext, pointerWithin, DragOverlay } from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { useTasks } from '../hooks/useTasks'
import { useClients } from '../hooks/useClients'

export function Dashboard() {
  const { signOut, user } = useAuth()
  const { tasks, updateTask, addTask } = useTasks()
  const { clients } = useClients()
  const [activeTab, setActiveTab] = useState('home')
  const [activeDragData, setActiveDragData] = useState<any>(null)

  const navItems = [
    { id: 'home', label: 'Home', icon: LayoutDashboard },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'tarefas', label: 'Tarefas', icon: CheckSquare },
    { id: 'notas', label: 'Notas', icon: FileText },
  ]

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragData(event.active.data.current)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveDragData(null)
    
    const { active, over } = event
    if (!over) return

    // active.id = Task ID uuid
    // over.id = Dropzone Identifier (ex: "AGENDA_SLOT_2026-04-18T09:00" ou "UNASSIGNED")
    const taskId = String(active.id)
    const dropzoneId = String(over.id)

    if (dropzoneId.startsWith('AGENDA_SLOT_')) {
       // Dragou pra dentro da agenda!
       const timestamp = dropzoneId.replace('AGENDA_SLOT_', '')
       try {
         await updateTask(taskId, { scheduled_at: timestamp })
       } catch(e) {
         console.error(e)
       }
    } else if (dropzoneId === 'UNASSIGNED') {
       // Pode ser que permitamos jogar de volta pra listagem de unassigned
       try {
         await updateTask(taskId, { scheduled_at: null })
       } catch(e) {
         console.error(e)
       }
    }
  }

  return (
    <div className="min-h-screen bg-bg-app flex overflow-hidden">
      {/* Menu Lateral Estático Slim */}
      <aside className="w-[100px] bg-bg-surface border-r border-border flex flex-col py-6 relative z-50 shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        
        {/* Logo / Top spacer */}
        <div className="w-full flex items-center justify-center mb-8 px-2">
            <div className="w-10 h-10 bg-accent text-white rounded-radius-md flex items-center justify-center font-display font-black text-xl shadow-sm">
               N
            </div>
        </div>

        <div className="flex-1 w-full space-y-3 px-3">
          {navItems.map((item) => {
            const isActive = activeTab === item.id
            const Icon = item.icon
            const isClients = item.id === 'clientes'

            return (
              <div key={item.id} className="relative group">
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex flex-col items-center justify-center py-3 rounded-radius-md transition-all duration-200 ${
                    isActive 
                      ? 'bg-accent-light text-accent shadow-sm ring-1 ring-accent/20' 
                      : 'text-text-secondary hover:bg-bg-app hover:text-text-primary'
                  }`}
                >
                  <Icon size={24} className="mb-1" strokeWidth={1.5} />
                  <span className={`text-[10px] tracking-wide font-medium ${isActive ? 'font-bold' : ''}`}>
                      {item.label}
                  </span>
                </button>
                
                {/* Popover Hover Submenu para Clientes */}
                {isClients && (
                  <div className="absolute left-[calc(100%+8px)] top-0 w-[240px] bg-bg-surface border border-border shadow-modal rounded-radius-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 -translate-x-2 group-hover:translate-x-0 z-[100] flex flex-col overflow-hidden">
                     <div className="px-4 py-3 bg-bg-surface-raised border-b border-border flex items-center justify-between">
                        <span className="font-semibold text-small text-text-primary uppercase tracking-wide">Meus Clientes</span>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setActiveTab('clientes') /* Focar aba clientes foca a UI de gerenciar, não pedido, mas já resolve o +! */ }}
                          className="bg-accent text-white p-1 rounded-sm hover:bg-accent-light hover:text-accent transition-colors"
                          title="Novo Cliente"
                        >
                           <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                        </button>
                     </div>
                     <div className="max-h-[300px] overflow-y-auto p-2 flex flex-col gap-1">
                        {clients.map(c => (
                           <button 
                             key={c.id} 
                             className="text-left px-3 py-2 text-small text-text-secondary hover:bg-bg-app hover:text-text-primary rounded-radius-sm transition-colors flex items-center gap-2 truncate"
                           >
                             <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                             <span className="truncate">{c.name}</span>
                           </button>
                        ))}
                        {clients.length === 0 && <span className="text-small text-text-tertiary p-2 text-center text-[11px]">Nenhum cliente aqui.</span>}
                     </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* User / Logout */}
        <div className="w-full px-3 mt-auto border-t border-border pt-6 space-y-3">
          <button 
            className={`w-full flex flex-col items-center justify-center p-2 rounded-radius-sm transition-all duration-200 text-text-secondary hover:bg-bg-app hover:text-text-primary`}
            title={user?.email}
          >
            <CircleUser size={24} strokeWidth={1.5} className="mb-0.5" />
            <span className="text-[9px] tracking-tight truncate w-full text-center max-w-full italic">{user?.email?.split('@')[0]}</span>
          </button>
          
          <button 
            onClick={signOut}
            className={`w-full flex flex-col items-center justify-center py-2.5 rounded-radius-sm transition-all duration-200 text-status-red hover:bg-status-red/10 border border-transparent hover:border-status-red/30`}
          >
            <LogOut size={22} strokeWidth={1.5} />
            <span className="text-[10px] font-bold mt-1 uppercase tracking-wide">Sair</span>
          </button>
        </div>
      </aside>

      {/* Views Dinâmicas */}
      {activeTab === 'clientes' ? (
        <ClientsPage />
      ) : activeTab === 'home' ? (
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} collisionDetection={pointerWithin}>
           <main className="flex-1 p-5 h-screen overflow-hidden flex flex-col gap-5 relative z-0 animate-in fade-in duration-300">
             
             {/* Linha Superior: Agenda (Full Width, ~45% Altura) */}
             <div className="h-[45%] shrink-0 flex flex-col relative w-full min-h-0">
                <AgendaGrid tasks={tasks} clients={clients} />
             </div>

             {/* Linha Inferior: Tarefas (Lado Esquerdo) + Notas (Lado Direito) */}
             <div className="flex-1 min-h-0 flex gap-5 w-full relative">
               
               <div className="flex-[1.25] min-w-0 flex flex-col h-full relative">
                  <TasksBoard tasks={tasks} clients={clients} addTask={addTask} />
               </div>

               <div className="flex-1 min-w-0 flex flex-col h-full relative">
                  <NotesPanel />
               </div>

             </div>
             
             {/* Fantasma do Drag and Drop */}
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
      ) : (
        <main className="flex-1 p-4 h-screen overflow-hidden flex items-center justify-center relative">
          <div className="absolute inset-0 bg-bg-app/90 z-50 flex items-center justify-center">
            <div className="bg-bg-surface p-8 rounded-radius-md shadow-card border border-border text-center flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-200">
               <span className="text-display opacity-20">🚧</span>
               <div>
                  <h3 className="text-section font-semibold mb-1">Visão Exclusiva: Em Breve</h3>
                  <p className="text-body text-text-secondary">O módulo completo ficará nesta tela.</p>
               </div>
               <button onClick={() => setActiveTab('home')} className="mt-2 text-small bg-accent text-white px-4 py-2 rounded-radius-sm hover:opacity-90 font-semibold transition-opacity">
                  Voltar para Home
               </button>
            </div>
          </div>
        </main>
      )}
    </div>
  )
}
