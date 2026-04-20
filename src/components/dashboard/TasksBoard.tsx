import { useState, useMemo } from 'react'
import { CheckSquare, Paperclip, Clock, Zap, Plus, X } from 'lucide-react'
import { useDraggable } from '@dnd-kit/core'
import { supabase } from '../../lib/supabase'
import type { Database } from '../../types/database.types'
import { format, isToday, isTomorrow, isPast } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type Task = Database['public']['Tables']['tasks']['Row']
type Client = Database['public']['Tables']['clients']['Row']

export function DraggableTaskCard({ task, clientColor, clientName }: { task: Task, clientColor?: string, clientName?: string }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: String(task.id),
    data: { task, type: 'board_task', clientColor, clientName }
  })

  // Escondemos o visual original ou deixamos opaco durante o Drag, pois o DragOverlay cuidará disso
  if (isDragging) {
     return <div ref={setNodeRef} className="bg-bg-surface-raised rounded-radius-sm border-2 border-dashed border-border opacity-50 min-h-[80px]" />
  }

  const isDone = task.status === 'Concluído' || task.is_done
  let deadlineLabel = null
  let isLate = false

  if (task.deadline) {
    const d = new Date(task.deadline)
    if (isToday(d)) deadlineLabel = `ALERTA HOJE às ${format(d, 'HH:mm')}`
    else if (isTomorrow(d)) deadlineLabel = `AMANHÃ às ${format(d, 'HH:mm')}`
    else deadlineLabel = format(d, "dd/MM 'às' HH:mm", { locale: ptBR })
    
    if (isPast(d) && !isDone) isLate = true
  }
  
  // Trata nomes dos usuários (Mock hardcoded pra display local das tags de email)
  let userName = "N/A"
  if (task.assigned_to) {
     if (task.assigned_to.includes('breno')) userName = "Breno"
     else if (task.assigned_to.includes('lucas')) userName = "Lucas"
     else if (task.assigned_to.includes('marcela')) userName = "Marcela"
  }

  return (
    <div 
      ref={setNodeRef} 
      {...listeners} 
      {...attributes}
      className={`bg-bg-surface rounded-radius-sm shadow-card border border-border border-l-4 p-3 hover:shadow-raised hover:-translate-y-[1px] transition-all cursor-grab flex flex-col min-h-[80px] ${isDone ? 'opacity-60 grayscale-[0.5]' : ''}`}
      style={{ borderLeftColor: clientColor || '#888888' }}
    >
      <div className="flex justify-between items-start">
         <div className="flex-1 mr-2">
           <div className="flex items-start gap-2">
             <h3 className={`text-body-lg leading-tight line-clamp-2 ${isDone ? 'text-text-tertiary line-through' : 'text-text-primary'}`}>
                {task.title}
             </h3>
             <span className={`text-mono text-[10px] font-semibold px-1.5 py-[2px] rounded-radius-sm whitespace-nowrap mt-0.5 shrink-0 hidden sm:flex items-center gap-1 ${isDone ? 'text-text-tertiary bg-bg-surface-raised border border-border line-through' : 'text-accent bg-accent-light'}`}>
                <Clock size={10} /> {task.estimated_minutes}m
             </span>
             {task.file_url && (
                <a href={task.file_url} target="_blank" rel="noreferrer" className="text-text-secondary hover:text-accent mt-0.5 p-1 rounded-radius-sm bg-bg-surface-raised cursor-pointer z-50 relative pointer-events-auto" onClick={(e) => e.stopPropagation()} title="Abrir Anexo Cimentado">
                   <Paperclip size={12} />
                </a>
             )}
           </div>
           
           <div className="flex items-center gap-2 mt-1.5 flex-wrap">
             {clientName && <p className={`text-small font-medium ${isDone ? 'text-text-tertiary line-through' : 'text-text-secondary'}`}>{clientName}</p>}
             
             {/* Tag de Status Real */}
             <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-radius-sm ${
                task.status === 'Fazendo' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                task.status === 'Concluído' || task.is_done ? 'bg-green-100 text-green-700 border border-green-200' :
                task.status === 'Atrasado' || isLate ? 'bg-red-100 text-red-700 border border-red-200' :
                'bg-bg-surface-raised text-text-tertiary border border-border'
             }`}>
                {isLate && !isDone ? 'ATRASADO / DEADLINE' : task.status || 'A fazer'}
             </span>
             
             {/* Responsável */}
             {userName !== "N/A" && (
                <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-radius-sm bg-bg-surface-raised text-text-secondary border border-border flex items-center gap-1">
                   👤 {userName}
                </span>
             )}
             
             {/* Recurring Badge */}
             {task.is_recurrent && (
                <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-radius-sm bg-[#EEF2FC] text-[#3355A0] border border-[#D5E0F9] flex items-center gap-1" title="Renova toda semana">
                   <Zap size={9} fill="currentColor" /> Recorrente
                </span>
             )}
           </div>
         </div>

         {/* Data + Priority */}
         <div className="flex flex-col items-end gap-2 shrink-0">
            {deadlineLabel && (
              <span className={`text-mono text-[9px] font-bold px-1.5 py-0.5 rounded-radius-sm border ${isLate && !isDone ? 'text-status-red bg-[#FEE2E2] border-[#FCA5A5]' : isDone ? 'text-text-tertiary bg-bg-surface-raised border-border opacity-50' : 'text-status-orange bg-[#FEF3C7] border-[#FDE68A]'}`}>
                {deadlineLabel}
              </span>
            )}
            
            {/* 3 tracinhos = alta */}
            {!isDone && (
              <div className="flex flex-col gap-[3px] items-end mt-1" title={task.priority === 1 ? 'Alta' : task.priority === 2 ? 'Média' : 'Baixa'}>
                <div className={`w-3.5 h-[3px] rounded-full ${task.priority === 1 ? 'bg-red' : task.priority === 2 ? 'bg-orange' : 'bg-gray-muted'}`} />
                <div className={`w-2.5 h-[3px] rounded-full ${task.priority === 1 ? 'bg-red' : task.priority === 2 ? 'bg-orange' : 'bg-gray-muted'}`} />
                <div className={`w-1.5 h-[3px] rounded-full ${task.priority === 1 ? 'bg-red' : 'bg-transparent'}`} />
              </div>
            )}
         </div>
      </div>
    </div>
  )
}

export function TasksBoard({ tasks, clients, addTask }: { tasks: Task[], clients: Client[], addTask?: any }) {
  const [activeClientTab, setActiveClientTab] = useState<string>('todas')

  // ---------- MOTOR DE CRIAÇÃO (MIGRADO DA AGENDA) ----------
  const teamUsers = [
    { id: 'brenosousaf13@gmail.com', name: 'Breno' },
    { id: 'lucassousaf01@gmail.com', name: 'Lucas' },
    { id: 'marceladneves@yahoo.com.br', name: 'Marcela' },
  ]

  const [showDraft, setShowDraft] = useState(false)
  const [draftTitle, setDraftTitle] = useState('')
  const [draftClientId, setDraftClientId] = useState('')
  const [draftEstimated, setDraftEstimated] = useState(60)
  const [draftPriority, setDraftPriority] = useState<1|2|3>(2)
  const [draftStatus, setDraftStatus] = useState<'A fazer' | 'Fazendo' | 'Concluído' | 'Atrasado'>('A fazer')
  const [draftAssignedTo, setDraftAssignedTo] = useState('brenosousaf13@gmail.com')
  const [draftIsRecurrent, setDraftIsRecurrent] = useState(false)
  const [draftFile, setDraftFile] = useState<File | null>(null)
  const [draftStartDate, setDraftStartDate] = useState<Date | null>(null)
  const [draftDeadlineDate, setDraftDeadlineDate] = useState<Date | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleCreateDraft = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!draftTitle || !addTask) return
    
    setIsUploading(true)
    let fileUrl: string | null = null
    
    if (draftFile) {
       const fileExt = draftFile.name.split('.').pop()
       const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
       
       const { data: uploadData, error: uploadError } = await supabase.storage
         .from('clients-files')
         .upload(`tasks/${fileName}`, draftFile)
         
       if (uploadError) {
         console.error("Upload falhou: ", uploadError)
         alert('Erro ao subir anexo para o servidor. Tente sem aspas no nome do arquivo.')
       } else if (uploadData) {
         const { data: publicUrlData } = supabase.storage.from('clients-files').getPublicUrl(uploadData.path)
         fileUrl = publicUrlData.publicUrl
       }
    }
    
    try {
      await addTask({
        title: draftTitle,
        client_id: draftClientId || null,
        estimated_minutes: draftEstimated,
        priority: draftPriority,
        status: draftStatus,
        assigned_to: draftAssignedTo,
        is_recurrent: draftIsRecurrent,
        file_url: fileUrl,
        scheduled_at: null, // Nasce fora do calendário! Será alocada via Drag and Drop
        start_date: draftStartDate ? draftStartDate.toISOString() : null,
        deadline: draftDeadlineDate ? draftDeadlineDate.toISOString() : null
      })
      
      setShowDraft(false) 
      setDraftTitle('')
      setDraftClientId('')
      setDraftEstimated(60)
      setDraftPriority(2)
      setDraftStatus('A fazer')
      setDraftIsRecurrent(false)
      setDraftFile(null)
      setDraftStartDate(null)
      setDraftDeadlineDate(null)
    } catch(err) {
      alert("Erro ao salvar tarefa.")
      console.error(err)
    } finally {
      setIsUploading(false)
    }
  }
  // -------------------------------------------------------------

  // Filtragem Limpa para Read-Only Board espelhado
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      // Oculta tarefas que já estão atreladas rigidamente à Agenda se o time preferir, MAS como o pedido atual não especificou, vamos ignorar.
      // Regra de aba Cliente: Se for 'todas', mostra tudo. Senão, filtra pelo client_id exato.
      if (activeClientTab !== 'todas' && t.client_id !== activeClientTab) return false
      return true
    })
  }, [tasks, activeClientTab])

  // Identificação de clientes únicos que possuem tarefas para criar as Abas Dinâmicas Automaticamente
  const availableClientsTabs = useMemo(() => {
    return clients.filter(c => tasks.some(t => t.client_id === c.id))
  }, [clients, tasks])

  return (
    <section className="bg-bg-surface border border-border rounded-radius-md shadow-card flex flex-col h-full min-h-0 relative">
      <header className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0 bg-bg-surface-raised z-10 sticky top-0">
        <div className="flex items-center gap-2">
          <CheckSquare size={18} className="text-text-secondary" strokeWidth={1.5} />
          <h2 className="text-section text-text-secondary uppercase">Quadro Central de Tarefas Ativas</h2>
        </div>
        <button onClick={() => setShowDraft(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-small font-semibold text-white bg-accent hover:bg-accent-light hover:text-accent border border-accent transition-colors rounded-radius-sm shadow-sm group">
          <Plus size={16} strokeWidth={2} className="group-hover:rotate-90 transition-transform" /> Nova Tarefa
        </button>
      </header>

      {/* Abas Dinâmicas de Clientes */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-border overflow-x-auto shrink-0 scrollbar-hide z-10 bg-bg-surface shadow-[0_1px_0_0_var(--border)] min-h-[45px]">
         <button 
           onClick={() => setActiveClientTab('todas')}
           className={`px-3 py-1 rounded-radius-sm text-small font-semibold transition-colors shrink-0 ${activeClientTab === 'todas' ? 'bg-accent text-white' : 'bg-transparent text-text-secondary hover:bg-bg-surface-raised'}`}>
           Todas
         </button>
         {availableClientsTabs.map(c => (
           <button 
             key={c.id}
             onClick={() => setActiveClientTab(c.id)}
             className={`px-3 py-1 rounded-radius-sm text-small font-semibold transition-colors shrink-0 ${activeClientTab === c.id ? 'bg-accent text-white' : 'bg-transparent text-text-secondary hover:bg-bg-surface-raised'}`}>
             {c.name}
           </button>
         ))}
      </div>

      {/* Listagem de Cards Read-Only */}
      <div className="flex-1 p-3 overflow-y-auto bg-bg-app/30 space-y-3 relative z-0">
        {filteredTasks.length === 0 && (
          <div className="text-center p-6 text-text-tertiary text-small flex flex-col items-center gap-2 mt-4">
             <span className="text-2xl opacity-20">📭</span>
             <p>Nenhuma missão de combate encontrada para esta aba.</p>
             <p className="text-[10px]">As tarefas são criadas diretamente clicando nos horários da Agenda.</p>
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
             />
          )
        })}
      </div>

      {/* SUPER MODAL DE CRIAÇÃO (Migrado da Agenda) */}
      {showDraft && (
        <div className="fixed inset-0 z-[100] bg-bg-app/40 backdrop-blur-[2px] flex items-center justify-center p-4 animate-in fade-in duration-200">
           <form onSubmit={handleCreateDraft} className="bg-bg-surface rounded-radius-md shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-border w-full max-w-[650px] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh]">
              
              <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-bg-surface-raised sticky top-0 shrink-0 z-10">
                 <div>
                    <h3 className="font-bold text-h3 text-text-primary leading-none mb-1">Cadastrar Missão na Inbox</h3>
                    <p className="text-small text-text-tertiary">Ela cairá aqui na Inbox para ser alocada na Agenda depois.</p>
                 </div>
                 <button type="button" onClick={() => setShowDraft(false)} className="text-text-tertiary hover:text-text-primary transition-colors p-1 rounded-radius-sm hover:bg-bg-surface cursor-pointer">
                    <X size={24} strokeWidth={1.5} />
                 </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                 <div className="flex flex-col gap-5">
                   
                   {/* ROW 1: Título e Cliente */}
                   <div className="flex gap-4">
                     <div className="space-y-1.5 flex-[1.5]">
                       <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Missão Principal</label>
                       <input autoFocus required type="text" placeholder="Ex: Analisar Estratégia Mensal..." value={draftTitle} onChange={e => setDraftTitle(e.target.value)} className="w-full text-body px-3 py-2 bg-bg-surface border border-border rounded-radius-sm focus:border-accent focus:outline-none focus:shadow-[0_0_0_2px_rgba(var(--accent),0.2)] transition-shadow leading-tight" />
                     </div>
                     <div className="space-y-1.5 flex-1">
                       <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Cliente (Projeto)</label>
                       <select required value={draftClientId} onChange={e => setDraftClientId(e.target.value)} className="w-full text-body px-3 py-[9px] bg-bg-surface border border-border rounded-radius-sm focus:border-accent outline-none font-medium cursor-pointer">
                          <option value="" disabled>Selecione um cliente...</option>
                          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                       </select>
                     </div>
                   </div>

                   {/* ROW 2: Grid Complexa de Metadata */}
                   <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 bg-bg-app/50 p-4 border border-border rounded-radius-sm">
                     
                     <div className="space-y-1.5">
                       <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider flex items-center gap-1">👤 Responsável</label>
                       <select value={draftAssignedTo} onChange={e => setDraftAssignedTo(e.target.value)} className="w-full text-small px-2 py-1.5 bg-bg-surface border border-border rounded-radius-sm outline-none cursor-pointer">
                          {teamUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                       </select>
                     </div>

                     <div className="space-y-1.5">
                       <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider flex items-center gap-1">📌 Fase (Status)</label>
                       <select value={draftStatus} onChange={e => setDraftStatus(e.target.value as any)} className="w-full text-small px-2 py-1.5 bg-bg-surface border border-border rounded-radius-sm outline-none cursor-pointer">
                          <option value="A fazer">A Fazer</option>
                          <option value="Fazendo">Em Execução</option>
                          <option value="Concluído">Concluída</option>
                          <option value="Atrasado">Atrasada</option>
                       </select>
                     </div>

                     <div className="space-y-1.5">
                       <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider flex items-center gap-1">🚩 Urgência</label>
                       <select value={draftPriority} onChange={e => setDraftPriority(Number(e.target.value) as 1|2|3)} className="w-full text-small px-2 py-1.5 bg-bg-surface border border-border rounded-radius-sm outline-none cursor-pointer">
                          <option value={1}>Alta Severidade</option>
                          <option value={2}>Média/Padrão</option>
                          <option value={3}>Baixa</option>
                       </select>
                     </div>

                     <div className="space-y-1.5">
                       <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider flex items-center gap-1">⏱️ Estimativa</label>
                       <div className="relative">
                         <input type="number" min="5" step="5" required value={draftEstimated} onChange={e => setDraftEstimated(Number(e.target.value))} className="w-full text-small pl-3 pr-8 py-1.5 bg-bg-surface border border-border rounded-radius-sm focus:border-accent outline-none" />
                         <span className="text-[10px] text-text-tertiary absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">min</span>
                       </div>
                     </div>

                   </div>

                   {/* ROW 3: DATAS */}
                   <div className="flex gap-4">
                     <div className="space-y-1.5 flex-1">
                       <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Início Agendado (Start Date)</label>
                       <input 
                         type="datetime-local" 
                         value={draftStartDate ? format(draftStartDate, "yyyy-MM-dd'T'HH:mm") : ''}
                         onChange={e => setDraftStartDate(e.target.value ? new Date(e.target.value) : null)}
                         className="w-full text-small px-3 py-2 bg-bg-surface border border-border rounded-radius-sm focus:border-accent outline-none text-text-secondary font-mono" 
                       />
                     </div>
                     <div className="space-y-1.5 flex-1">
                       <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Prazo Fatal (Deadline)</label>
                       <input 
                         type="datetime-local" 
                         value={draftDeadlineDate ? format(draftDeadlineDate, "yyyy-MM-dd'T'HH:mm") : ''}
                         onChange={e => setDraftDeadlineDate(e.target.value ? new Date(e.target.value) : null)}
                         className="w-full text-small px-3 py-2 bg-bg-surface border border-border rounded-radius-sm focus:border-accent outline-none text-text-secondary font-mono" 
                       />
                     </div>
                   </div>

                   {/* ROW 4: Extra Options (File and Checkboxes) */}
                   <div className="flex gap-4 mt-2 mb-2 items-center">
                     
                     <div className="flex-1 space-y-1.5 bg-bg-app/30 border border-dashed border-border p-3 rounded-radius-sm relative group overflow-hidden hover:border-accent/40 transition-colors cursor-pointer">
                        <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider mb-2 flex items-center justify-between w-full cursor-pointer">
                           <span>Anexar Arquivos (Opcional)</span>
                           <span className="text-[10px] text-accent font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap overflow-hidden">Selecionar...</span>
                        </label>
                        <input type="file" onChange={e => setDraftFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                        <div className="text-small text-text-primary px-3 py-1.5 bg-bg-surface border border-border rounded-radius-sm font-medium w-full truncate">
                           {draftFile ? draftFile.name : 'Nenhum documento anexado'}
                        </div>
                     </div>

                     <div className="shrink-0 pt-4 px-4 cursor-pointer">
                        <label className="flex items-center gap-2 cursor-pointer select-none group">
                           <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${draftIsRecurrent ? 'bg-accent border-accent text-white' : 'bg-bg-surface border-border group-hover:border-text-tertiary text-transparent'}`}>
                             <CheckSquare size={14} strokeWidth={3} fill="currentColor" className="opacity-100" />
                           </div>
                           <div className="flex flex-col cursor-pointer">
                              <span className="text-body font-bold text-text-primary leading-tight">Tarefa Recorrente</span>
                              <span className="text-[10px] text-text-tertiary mt-[2px] max-w-[150px] leading-[1.1]">Vai sempre reaparecer semanalmente para fazer.</span>
                           </div>
                        </label>
                        {/* Hidden native checkbox to bind functionality */}
                        <input type="checkbox" className="hidden" checked={draftIsRecurrent} onChange={e => setDraftIsRecurrent(e.target.checked)} />
                     </div>

                   </div>

                 </div>
              </div>

              {/* ACTION FOOTER */}
              <div className="px-6 py-4 border-t border-border bg-bg-surface-raised flex justify-end gap-3 sticky bottom-0 shrink-0 z-10">
                 <button type="button" onClick={() => setShowDraft(false)} className="px-5 py-2.5 text-body font-semibold text-text-secondary hover:text-text-primary hover:bg-bg-app rounded-radius-sm transition-colors border border-transparent hover:border-border">
                    Descartar Entrada
                 </button>
                 <button type="submit" disabled={isUploading} className="px-6 py-2.5 text-body font-bold text-white bg-accent rounded-radius-sm shadow-[0_2px_10px_rgba(var(--accent),0.2)] hover:shadow-[0_4px_15px_rgba(var(--accent),0.3)] hover:-translate-y-[1px] active:translate-y-0 transition-all flex items-center justify-center gap-2 min-w-[200px]">
                    {isUploading ? (
                      <span className="animate-pulse">Fazendo Upload e Salvando...</span>
                    ) : (
                      'Puxar para Inbox'
                    )}
                 </button>
              </div>
           </form>
        </div>
      )}
    </section>
  )
}
