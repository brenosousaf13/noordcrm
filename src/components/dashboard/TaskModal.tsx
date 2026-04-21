import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Repeat, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Database } from '../../types/database.types'
import { format } from 'date-fns'

type Task = Database['public']['Tables']['tasks']['Row']
type Client = Database['public']['Tables']['clients']['Row']

interface TaskModalProps {
  task?: Task | null
  clients: Client[]
  currentUserEmail?: string
  onSave: (payload: Partial<Task>) => Promise<void>
  onDelete?: () => Promise<void>
  onClose: () => void
}

const DURATION_OPTIONS = [
  { value: 30, label: '30 min' },
  { value: 60, label: '60 min (1h)' },
  { value: 90, label: '90 min (1h30)' },
  { value: 120, label: '120 min (2h)' },
]

export function TaskModal({ task, clients, currentUserEmail, onSave, onDelete, onClose }: TaskModalProps) {
  const teamUsers = [
    { id: 'brenosousaf13@gmail.com', name: 'Breno' },
    { id: 'lucassousaf01@gmail.com', name: 'Lucas' },
    { id: 'marceladneves@yahoo.com.br', name: 'Marcela' },
  ]

  const [draftTitle, setDraftTitle] = useState(task?.title || '')
  const [draftDescription, setDraftDescription] = useState(task?.description || '')
  const [draftClientId, setDraftClientId] = useState(task?.client_id || '')
  const [draftEstimated, setDraftEstimated] = useState(task?.estimated_minutes || 60)
  const [draftPriority, setDraftPriority] = useState<1|2|3>(task?.priority || 2)
  const [draftStatus, setDraftStatus] = useState<'A fazer' | 'Concluído'>(
    (task?.status === 'Concluído' || task?.is_done) ? 'Concluído' : 'A fazer'
  )
  const [draftAssignedTo, setDraftAssignedTo] = useState(
    task?.assigned_to || currentUserEmail || 'brenosousaf13@gmail.com'
  )
  const [draftIsRecurrent, setDraftIsRecurrent] = useState(task?.is_recurrent || false)
  const [draftRecurrence, setDraftRecurrence] = useState(task?.recurrence || 'weekly')
  const [draftFile, setDraftFile] = useState<File | null>(null)
  const [draftDeadlineDate, setDraftDeadlineDate] = useState<string>(
    task?.deadline ? format(new Date(task.deadline.includes('T') ? task.deadline : task.deadline + 'T00:00:00'), 'yyyy-MM-dd') : ''
  )
  const [isUploading, setIsUploading] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const formRef = useRef<HTMLFormElement>(null)

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
        status: draftStatus,
        is_done: draftStatus === 'Concluído',
        assigned_to: draftAssignedTo,
        is_recurrent: draftIsRecurrent,
        recurrence: draftIsRecurrent ? draftRecurrence : null,
        file_url: fileUrl,
        scheduled_at: task ? task.scheduled_at : null,
        start_date: null,
        deadline: draftDeadlineDate || null,
        description: draftDescription || null
      })
      onClose()
    } catch(err) {
      alert("Erro ao salvar tarefa.")
      console.error(err)
    } finally {
      setIsUploading(false)
    }
  }

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = 'auto' }
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault()
        formRef.current?.requestSubmit()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-bg-app/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
       <div className="absolute inset-0" onClick={onClose} />
       <form ref={formRef} onSubmit={handleSave} className="bg-bg-surface rounded-radius-md shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-border w-full max-w-[600px] flex flex-col overflow-hidden animate-in zoom-in-90 duration-200 max-h-[90vh] relative z-10">

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

               {/* Título + Cliente */}
               <div className="flex gap-4">
                 <div className="space-y-1.5 flex-[1.5]">
                   <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Missão Principal</label>
                   <input autoFocus required type="text" placeholder="Ex: Analisar Estratégia..." value={draftTitle} onChange={e => setDraftTitle(e.target.value)} className="w-full text-body px-3 py-2 bg-bg-surface border border-border rounded-radius-sm focus:border-accent focus:outline-none focus:shadow-[0_0_0_2px_rgba(var(--accent),0.2)] transition-shadow leading-tight" />
                 </div>
                 <div className="space-y-1.5 flex-1">
                   <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Cliente (Projeto)</label>
                   <select required value={draftClientId} onChange={e => setDraftClientId(e.target.value)} className="w-full text-body px-3 py-[9px] bg-bg-surface border border-border rounded-radius-sm focus:border-accent outline-none font-medium cursor-pointer">
                      <option value="" disabled>Selecione...</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                   </select>
                 </div>
               </div>

               {/* Descrição */}
               <div className="space-y-1.5 border border-border bg-bg-app/30 p-1.5 rounded-radius-sm focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 transition-all">
                  <textarea
                    placeholder="Escreva detalhes, passos ou uma descrição desta tarefa..."
                    value={draftDescription}
                    onChange={e => setDraftDescription(e.target.value)}
                    className="w-full text-small px-3 py-2 bg-transparent outline-none h-20 resize-none custom-scrollbar"
                  />
               </div>

               {/* Grid principal: Urgência, Estimativa, Prazo */}
               <div className="grid grid-cols-3 gap-4 bg-bg-app/50 p-4 border border-border rounded-radius-sm">
                 <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">🚩 Urgência</label>
                   <select value={draftPriority} onChange={e => setDraftPriority(Number(e.target.value) as 1|2|3)} className="w-full text-small px-2 py-1.5 bg-bg-surface border border-border rounded-radius-sm outline-none cursor-pointer">
                      <option value={1}>Alta</option>
                      <option value={2}>Média</option>
                      <option value={3}>Baixa</option>
                   </select>
                 </div>
                 <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">⏱️ Estimativa</label>
                   <select value={draftEstimated} onChange={e => setDraftEstimated(Number(e.target.value))} className="w-full text-small px-2 py-1.5 bg-bg-surface border border-border rounded-radius-sm outline-none cursor-pointer">
                      {DURATION_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                   </select>
                 </div>
                 <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">📅 Prazo</label>
                   <input type="date" value={draftDeadlineDate} onChange={e => setDraftDeadlineDate(e.target.value)} className="w-full text-small px-2 py-1.5 bg-bg-surface border border-border rounded-radius-sm focus:border-accent outline-none text-text-secondary font-mono" />
                 </div>
               </div>

               {/* Toggle opções avançadas */}
               <button
                 type="button"
                 onClick={() => setShowAdvanced(!showAdvanced)}
                 className="flex items-center gap-2 text-[11px] font-bold text-text-tertiary uppercase tracking-wider hover:text-text-secondary transition-colors w-fit"
               >
                 {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                 {showAdvanced ? 'Ocultar opções avançadas' : 'Mostrar opções avançadas'}
               </button>

               {/* Campos avançados (ocultos por padrão) */}
               {showAdvanced && (
                 <div className="flex flex-col gap-4 animate-in slide-in-from-top-2 duration-200">

                   {/* Responsável + Fase */}
                   <div className="grid grid-cols-2 gap-4 bg-bg-app/50 p-4 border border-border rounded-radius-sm">
                     <div className="space-y-1.5">
                       <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">👤 Responsável</label>
                       <select value={draftAssignedTo} onChange={e => setDraftAssignedTo(e.target.value)} className="w-full text-small px-2 py-1.5 bg-bg-surface border border-border rounded-radius-sm outline-none cursor-pointer">
                          {teamUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                       </select>
                     </div>
                     <div className="space-y-1.5">
                       <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">📌 Fase</label>
                       <select value={draftStatus} onChange={e => setDraftStatus(e.target.value as any)} className="w-full text-small px-2 py-1.5 bg-bg-surface border border-border rounded-radius-sm outline-none cursor-pointer">
                          <option value="A fazer">A Fazer</option>
                          <option value="Concluído">Feito</option>
                       </select>
                     </div>
                   </div>

                   {/* Anexo */}
                   <div className="space-y-1.5">
                     <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Anexar Arquivo</label>
                     <div className="relative bg-bg-app/30 border border-dashed border-border rounded-radius-sm hover:border-accent/40 transition-colors cursor-pointer group overflow-hidden">
                        <input type="file" onChange={e => setDraftFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                        <div className="text-small text-text-primary px-3 py-[7px] font-medium w-full truncate flex items-center justify-between">
                           <span className="truncate">{draftFile ? draftFile.name : (task?.file_url ? '🔗 Anexado' : 'Nenhum')}</span>
                           <span className="text-[10px] text-accent font-medium opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">Selecionar</span>
                        </div>
                     </div>
                   </div>

                   {/* Recorrência */}
                   <div className="border border-border rounded-radius-sm overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setDraftIsRecurrent(!draftIsRecurrent)}
                        className={`w-full flex items-center gap-3 px-4 py-3 transition-all cursor-pointer ${
                          draftIsRecurrent
                            ? 'bg-accent/10 border-b border-accent/20'
                            : 'bg-bg-app/30 hover:bg-bg-app/50'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-radius-sm flex items-center justify-center transition-all ${
                          draftIsRecurrent ? 'bg-accent text-white' : 'bg-bg-surface border border-border text-text-tertiary'
                        }`}>
                          <Repeat size={16} strokeWidth={2} />
                        </div>
                        <div className="flex-1 text-left">
                           <span className={`text-body font-bold leading-tight ${draftIsRecurrent ? 'text-accent' : 'text-text-primary'}`}>Tarefa Recorrente</span>
                           <p className="text-[10px] text-text-tertiary mt-0.5 leading-tight">
                             {draftIsRecurrent ? 'Ativada — escolha a frequência abaixo' : 'Desativada — clique para ativar'}
                           </p>
                        </div>
                        <div className={`w-10 h-[22px] rounded-full transition-all relative ${draftIsRecurrent ? 'bg-accent' : 'bg-border'}`}>
                          <div className={`absolute top-[3px] w-4 h-4 bg-white rounded-full shadow-sm transition-all ${draftIsRecurrent ? 'left-[22px]' : 'left-[3px]'}`} />
                        </div>
                      </button>

                      {draftIsRecurrent && (
                        <div className="px-4 py-3 bg-bg-surface flex flex-wrap gap-2 animate-in slide-in-from-top-2 duration-200">
                          {[
                            { value: 'daily', label: 'Diária', icon: '📆' },
                            { value: 'weekly', label: 'Semanal', icon: '📅' },
                            { value: 'biweekly', label: 'Quinzenal', icon: '🗓️' },
                            { value: 'monthly', label: 'Mensal', icon: '📋' },
                            { value: 'custom', label: 'Personalizado', icon: '⚙️' },
                          ].map(opt => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setDraftRecurrence(opt.value)}
                              className={`px-3 py-1.5 rounded-radius-sm text-small font-medium transition-all border cursor-pointer ${
                                draftRecurrence === opt.value
                                  ? 'bg-accent text-white border-accent shadow-sm'
                                  : 'bg-bg-surface border-border text-text-secondary hover:border-accent/40 hover:text-text-primary'
                              }`}
                            >
                              <span className="mr-1">{opt.icon}</span> {opt.label}
                            </button>
                          ))}
                        </div>
                      )}
                   </div>

                 </div>
               )}

             </div>
          </div>

          <div className="px-6 py-4 border-t border-border bg-bg-surface-raised flex items-center justify-between sticky bottom-0 shrink-0 z-10">
             <div>
               {task && onDelete && (
                 <button
                   type="button"
                   onClick={async () => {
                     if (confirm('Tem certeza que deseja apagar esta tarefa? Essa ação não pode ser desfeita.')) {
                       await onDelete()
                     }
                   }}
                   className="flex items-center gap-1.5 px-3 py-2 text-small font-semibold text-status-red hover:bg-status-red/10 rounded-radius-sm transition-colors border border-transparent hover:border-status-red/30 cursor-pointer"
                 >
                   <Trash2 size={14} strokeWidth={2} /> Apagar
                 </button>
               )}
             </div>
             <div className="flex items-center gap-3">
               <span className="text-[10px] text-text-tertiary hidden sm:block">Ctrl+Enter para salvar</span>
               <button type="button" onClick={onClose} className="px-5 py-2.5 text-body font-semibold text-text-secondary hover:text-text-primary hover:bg-bg-app rounded-radius-sm transition-colors border border-transparent hover:border-border">
                  {task ? 'Cancelar' : 'Descartar'}
               </button>
               <button type="submit" disabled={isUploading} className="px-6 py-2.5 text-body font-bold text-white bg-accent rounded-radius-sm shadow-[0_2px_10px_rgba(var(--accent),0.2)] hover:shadow-[0_4px_15px_rgba(var(--accent),0.3)] hover:-translate-y-[1px] active:translate-y-0 transition-all flex items-center justify-center gap-2 min-w-[180px]">
                  {isUploading ? <span className="animate-pulse">Salvando...</span> : task ? 'Salvar Alterações' : 'Puxar para Inbox'}
               </button>
             </div>
          </div>
       </form>
    </div>,
    document.body
  )
}
