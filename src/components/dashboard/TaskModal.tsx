import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { CheckSquare, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Database } from '../../types/database.types'
import { format } from 'date-fns'

type Task = Database['public']['Tables']['tasks']['Row']
type Client = Database['public']['Tables']['clients']['Row']

interface TaskModalProps {
  task?: Task | null
  clients: Client[]
  onSave: (payload: Partial<Task>) => Promise<void>
  onClose: () => void
}

export function TaskModal({ task, clients, onSave, onClose }: TaskModalProps) {
  const teamUsers = [
    { id: 'brenosousaf13@gmail.com', name: 'Breno' },
    { id: 'lucassousaf01@gmail.com', name: 'Lucas' },
    { id: 'marceladneves@yahoo.com.br', name: 'Marcela' },
  ]

  const [draftTitle, setDraftTitle] = useState(task?.title || '')
  const [draftClientId, setDraftClientId] = useState(task?.client_id || '')
  const [draftEstimated, setDraftEstimated] = useState(task?.estimated_minutes || 60)
  const [draftPriority, setDraftPriority] = useState<1|2|3>(task?.priority || 2)
  // Mask to force binary DB status on save
  const [draftStatus, setDraftStatus] = useState<'A fazer' | 'Concluído'>(
    (task?.status === 'Concluído' || task?.is_done) ? 'Concluído' : 'A fazer'
  )
  const [draftAssignedTo, setDraftAssignedTo] = useState(task?.assigned_to || 'brenosousaf13@gmail.com')
  const [draftIsRecurrent, setDraftIsRecurrent] = useState(task?.is_recurrent || false)
  const [draftFile, setDraftFile] = useState<File | null>(null)
  const [draftStartDate, setDraftStartDate] = useState<Date | null>(task?.start_date ? new Date(task.start_date) : null)
  const [draftDeadlineDate, setDraftDeadlineDate] = useState<Date | null>(task?.deadline ? new Date(task.deadline) : null)
  const [isUploading, setIsUploading] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!draftTitle) return
    
    setIsUploading(true)
    let fileUrl: string | null = task?.file_url || null
    
    if (draftFile) {
       const fileExt = draftFile.name.split('.').pop()
       const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
       
       const { data: uploadData, error: uploadError } = await supabase.storage
         .from('clients-files')
         .upload(`tasks/${fileName}`, draftFile)
         
       if (uploadError) {
         console.error("Upload falhou: ", uploadError)
         alert('Erro ao subir anexo para o servidor.')
       } else if (uploadData) {
         const { data: publicUrlData } = supabase.storage.from('clients-files').getPublicUrl(uploadData.path)
         fileUrl = publicUrlData.publicUrl
       }
    }
    
    try {
      await onSave({
        title: draftTitle,
        client_id: draftClientId || null,
        estimated_minutes: draftEstimated,
        priority: draftPriority,
        status: draftStatus, // Forced to binary A Fazer/Concluído
        is_done: draftStatus === 'Concluído',
        assigned_to: draftAssignedTo,
        is_recurrent: draftIsRecurrent,
        file_url: fileUrl,
        // Only set schedule as null if CREATING. If editing, preserve the timeline!
        scheduled_at: task ? task.scheduled_at : null,
        start_date: draftStartDate ? draftStartDate.toISOString() : null,
        deadline: draftDeadlineDate ? draftDeadlineDate.toISOString() : null
      })
      onClose()
    } catch(err) {
      alert("Erro ao salvar tarefa.")
      console.error(err)
    } finally {
      setIsUploading(false)
    }
  }

  // Anti-scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = 'auto' }
  }, [])

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-bg-app/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
       {/* Click fora para fechar */}
       <div className="absolute inset-0" onClick={onClose} />
       <form onSubmit={handleSave} className="bg-bg-surface rounded-radius-md shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-border w-full max-w-[650px] flex flex-col overflow-hidden animate-in zoom-in-90 duration-200 max-h-[90vh] relative z-10">
          
          <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-bg-surface-raised sticky top-0 shrink-0 z-10">
             <div>
                <h3 className="font-bold text-h3 text-text-primary leading-none mb-1">{task ? 'Editar Missão' : 'Cadastrar na Inbox'}</h3>
                {!task && <p className="text-small text-text-tertiary">Ela cairá no quadro para ser alocada depois.</p>}
             </div>
             <button type="button" onClick={onClose} className="text-text-tertiary hover:text-text-primary transition-colors p-1 rounded-radius-sm hover:bg-bg-surface cursor-pointer">
                <X size={24} strokeWidth={1.5} />
             </button>
          </div>

          <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
             <div className="flex flex-col gap-5">
               <div className="flex gap-4">
                 <div className="space-y-1.5 flex-[1.5]">
                   <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Missão Principal</label>
                   <input autoFocus required type="text" placeholder="Ex: Analisar Estratégia..." value={draftTitle} onChange={e => setDraftTitle(e.target.value)} className="w-full text-body px-3 py-2 bg-bg-surface border border-border rounded-radius-sm focus:border-accent focus:outline-none focus:shadow-[0_0_0_2px_rgba(var(--accent),0.2)] transition-shadow leading-tight" />
                 </div>
                 <div className="space-y-1.5 flex-1">
                   <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Cliente (Projeto)</label>
                   <select required value={draftClientId} onChange={e => setDraftClientId(e.target.value)} className="w-full text-body px-3 py-[9px] bg-bg-surface border border-border rounded-radius-sm focus:border-accent outline-none font-medium cursor-pointer">
                      <option value="" disabled>Selecione um cliente...</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                   </select>
                 </div>
               </div>

               <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 bg-bg-app/50 p-4 border border-border rounded-radius-sm">
                 <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider flex items-center gap-1">👤 Responsável</label>
                   <select value={draftAssignedTo} onChange={e => setDraftAssignedTo(e.target.value)} className="w-full text-small px-2 py-1.5 bg-bg-surface border border-border rounded-radius-sm outline-none cursor-pointer">
                      {teamUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                   </select>
                 </div>
                 <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider flex items-center gap-1">📌 Fase</label>
                   <select value={draftStatus} onChange={e => setDraftStatus(e.target.value as any)} className="w-full text-small px-2 py-1.5 bg-bg-surface border border-border rounded-radius-sm outline-none cursor-pointer">
                      <option value="A fazer">A Fazer</option>
                      <option value="Concluído">Feito</option>
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

               <div className="flex gap-4">
                 <div className="space-y-1.5 flex-1">
                   <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Início</label>
                   <input type="datetime-local" value={draftStartDate ? format(draftStartDate, "yyyy-MM-dd'T'HH:mm") : ''} onChange={e => setDraftStartDate(e.target.value ? new Date(e.target.value) : null)} className="w-full text-small px-3 py-2 bg-bg-surface border border-border rounded-radius-sm focus:border-accent outline-none text-text-secondary font-mono" />
                 </div>
                 <div className="space-y-1.5 flex-1">
                   <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Prazo (Deadline)</label>
                   <input type="datetime-local" value={draftDeadlineDate ? format(draftDeadlineDate, "yyyy-MM-dd'T'HH:mm") : ''} onChange={e => setDraftDeadlineDate(e.target.value ? new Date(e.target.value) : null)} className="w-full text-small px-3 py-2 bg-bg-surface border border-border rounded-radius-sm focus:border-accent outline-none text-text-secondary font-mono" />
                 </div>
               </div>

               <div className="flex gap-4 mt-2 mb-2 items-center">
                 <div className="flex-1 space-y-1.5 bg-bg-app/30 border border-dashed border-border p-3 rounded-radius-sm relative group overflow-hidden hover:border-accent/40 transition-colors cursor-pointer">
                    <label className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider mb-2 flex items-center justify-between w-full cursor-pointer">
                       <span>{task?.file_url ? 'Substituir Anexo Original' : 'Anexar Arquivos (Opcional)'}</span>
                       <span className="text-[10px] text-accent font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap overflow-hidden">Selecionar...</span>
                    </label>
                    <input type="file" onChange={e => setDraftFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <div className="text-small text-text-primary px-3 py-1.5 bg-bg-surface border border-border rounded-radius-sm font-medium w-full truncate">
                       {draftFile ? draftFile.name : (task?.file_url ? 'Documento já anexado 🔗' : 'Nenhum documento anexado')}
                    </div>
                 </div>

                 <div className="shrink-0 pt-4 px-4 cursor-pointer">
                    <label className="flex items-center gap-2 cursor-pointer select-none group">
                       <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${draftIsRecurrent ? 'bg-accent border-accent text-white' : 'bg-bg-surface border-border group-hover:border-text-tertiary text-transparent'}`}>
                         <CheckSquare size={14} strokeWidth={3} fill="currentColor" className="opacity-100" />
                       </div>
                       <div className="flex flex-col cursor-pointer">
                          <span className="text-body font-bold text-text-primary leading-tight">Tarefa Recorrente</span>
                          <span className="text-[10px] text-text-tertiary mt-[2px] max-w-[150px] leading-[1.1]">Vai reaparecer semanalmente.</span>
                       </div>
                    </label>
                    <input type="checkbox" className="hidden" checked={draftIsRecurrent} onChange={e => setDraftIsRecurrent(e.target.checked)} />
                 </div>
               </div>
             </div>
          </div>

          <div className="px-6 py-4 border-t border-border bg-bg-surface-raised flex justify-end gap-3 sticky bottom-0 shrink-0 z-10">
             <button type="button" onClick={onClose} className="px-5 py-2.5 text-body font-semibold text-text-secondary hover:text-text-primary hover:bg-bg-app rounded-radius-sm transition-colors border border-transparent hover:border-border">
                {task ? 'Cancelar' : 'Descartar Entrada'}
             </button>
             <button type="submit" disabled={isUploading} className="px-6 py-2.5 text-body font-bold text-white bg-accent rounded-radius-sm shadow-[0_2px_10px_rgba(var(--accent),0.2)] hover:shadow-[0_4px_15px_rgba(var(--accent),0.3)] hover:-translate-y-[1px] active:translate-y-0 transition-all flex items-center justify-center gap-2 min-w-[200px]">
                {isUploading ? <span className="animate-pulse">Salvando...</span> : task ? 'Salvar Alterações' : 'Puxar para Inbox'}
             </button>
          </div>
       </form>
    </div>,
    document.body
  )
}
