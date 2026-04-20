import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { LayoutDashboard, Users, CheckSquare, FileText, CircleUser, LogOut, PanelLeftOpen, PanelLeftClose } from 'lucide-react'
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('home')
  const [activeDragData, setActiveDragData] = useState<any>(null)

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)

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
      {/* Menu Lateral */}
      <aside className={`${isSidebarOpen ? 'w-[220px]' : 'w-[64px]'} bg-bg-surface border-r border-border flex flex-col py-4 transition-all duration-200 overflow-hidden relative z-10 shrink-0`}>
        {/* Toggle Nav */}
        <div className="w-full flex items-center justify-center mb-4 px-2">
           <button 
             onClick={toggleSidebar}
             className={`w-full flex items-center h-10 rounded-radius-sm text-text-secondary hover:bg-bg-surface-raised transition-colors ${isSidebarOpen ? 'justify-end px-3' : 'justify-center px-0'}`}
           >
             {isSidebarOpen ? <PanelLeftClose size={20} strokeWidth={1.5} className="shrink-0" /> : <PanelLeftOpen size={20} strokeWidth={1.5} className="shrink-0" />}
           </button>
        </div>

        <div className="flex-1 w-full space-y-2 px-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.id
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center h-10 rounded-radius-sm transition-colors ${
                  isSidebarOpen ? 'px-3' : 'justify-center px-0'
                } ${
                  isActive 
                    ? 'bg-accent-light text-accent' 
                    : 'text-text-secondary hover:bg-bg-surface-raised'
                }`}
              >
                <Icon size={20} className="shrink-0" strokeWidth={1.5} />
                <div className={`overflow-hidden transition-all duration-200 flex items-center ${isSidebarOpen ? 'w-[150px] opacity-100 ml-3' : 'w-0 opacity-0 ml-0'}`}>
                  <span className={`whitespace-nowrap ${isActive ? 'font-semibold text-body' : 'font-medium text-body'}`}>
                    {item.label}
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        {/* User / Logout */}
        <div className="w-full px-2 mt-auto border-t border-border pt-4 space-y-2">
          <div className={`w-full flex items-center h-10 rounded-radius-sm text-text-secondary hover:bg-bg-surface-raised transition-colors cursor-pointer ${isSidebarOpen ? 'px-3' : 'justify-center px-0'}`}>
            <CircleUser size={20} className="shrink-0" strokeWidth={1.5} />
            <div className={`overflow-hidden transition-all duration-200 flex items-center ${isSidebarOpen ? 'w-[150px] opacity-100 ml-3' : 'w-0 opacity-0 ml-0'}`}>
              <p className="text-small truncate">{user?.email}</p>
            </div>
          </div>
          <button 
            onClick={signOut}
            className={`w-full flex items-center h-10 rounded-radius-sm text-status-red hover:bg-[#FEE2E2] transition-colors ${isSidebarOpen ? 'px-3' : 'justify-center px-0'}`}
          >
            <LogOut size={20} className="shrink-0" strokeWidth={1.5} />
            <div className={`overflow-hidden transition-all duration-200 flex items-center ${isSidebarOpen ? 'w-[150px] opacity-100 ml-3' : 'w-0 opacity-0 ml-0'}`}>
              <span className="text-body font-medium whitespace-nowrap">Sair</span>
            </div>
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
