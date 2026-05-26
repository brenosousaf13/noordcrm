import { useState } from 'react'
import { X, Layers, ChevronDown, CheckSquare } from 'lucide-react'
import { useTaskTemplates, type TaskTemplate, type TemplateTask } from '../../hooks/useTaskTemplates'
import type { Database } from '../../types/database.types'

type Client = Database['public']['Tables']['clients']['Row']
type ArchiveMode = 'none' | 'include' | 'reactivate'
type DateMode = 'as_is' | 'remap'
type ImportMode = 'all' | 'custom'

interface UseTemplateModalProps {
  template: TaskTemplate
  templateTasks: TemplateTask[]
  clients: Client[]
  onClose: () => void
  onApplied: () => void
}

export function UseTemplateModal({
  template,
  templateTasks,
  clients,
  onClose,
  onApplied,
}: UseTemplateModalProps) {
  const { applyTemplate } = useTaskTemplates()
  const [folderName, setFolderName] = useState(template.name)
  const [selectedClientId, setSelectedClientId] = useState<string>(clients[0]?.id ?? '')
  const [importMode, setImportMode] = useState<ImportMode>('all')
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(
    new Set(templateTasks.map(t => t.id))
  )
  const [dateMode, setDateMode] = useState<DateMode>('as_is')
  const [dateOffset, setDateOffset] = useState<number>(7)
  const [archiveMode, setArchiveMode] = useState<ArchiveMode>('none')
  const [applying, setApplying] = useState(false)
  const [success, setSuccess] = useState(false)

  const activeCount =
    importMode === 'all' ? templateTasks.length : selectedTaskIds.size

  const toggleTask = (id: string) => {
    setSelectedTaskIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleApply = async () => {
    if (!selectedClientId) return
    setApplying(true)
    try {
      await applyTemplate(template.id, selectedClientId, {
        taskIds: importMode === 'custom' ? Array.from(selectedTaskIds) : undefined,
        dateOffsetDays: dateMode === 'remap' ? dateOffset : 0,
        includeArchived: archiveMode !== 'none',
        reactivate: archiveMode === 'reactivate',
      })
      setSuccess(true)
      setTimeout(() => {
        onApplied()
        onClose()
      }, 900)
    } catch (err) {
      console.error(err)
      alert('Erro ao aplicar modelo.')
      setApplying(false)
    }
  }

  const selectedClient = clients.find(c => c.id === selectedClientId)

  return (
    <div
      className="fixed inset-0 z-[99999] bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-bg-surface rounded-radius-md shadow-modal w-full max-w-[560px] max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0 bg-bg-surface-raised rounded-t-radius-md">
          <h2 className="text-section font-bold text-text-primary flex items-center gap-2">
            <Layers size={17} className="text-accent" />
            Usar modelo de Pasta
          </h2>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-bg-app text-text-tertiary">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Nome da pasta */}
          <div>
            <label className="text-label text-text-secondary block mb-1.5">NOME DA PASTA</label>
            <input
              type="text"
              value={folderName}
              onChange={e => setFolderName(e.target.value)}
              className="w-full bg-bg-app border border-border rounded-radius-sm px-3 py-2.5 text-body focus:border-accent focus:outline-none transition-colors"
            />
          </div>

          {/* Onde criar */}
          <div>
            <label className="text-label text-text-secondary block mb-1.5">ONDE CRIAR (CLIENTE) *</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: selectedClient?.color ?? '#ccc' }} />
              <select
                value={selectedClientId}
                onChange={e => setSelectedClientId(e.target.value)}
                className="w-full bg-bg-app border border-border rounded-radius-sm pl-8 pr-8 py-2.5 text-body focus:border-accent focus:outline-none appearance-none transition-colors"
              >
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
            </div>
          </div>

          {/* Opções de importação */}
          <div>
            <label className="text-label text-text-secondary block mb-2">OPÇÕES DE IMPORTAÇÃO</label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: 'all' as ImportMode, label: '✦ Importar tudo', sub: 'Todas as tarefas serão criadas.' },
                { value: 'custom' as ImportMode, label: '≡ Personalizar itens', sub: 'Escolha quais tarefas importar.' },
              ] as const).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setImportMode(opt.value)}
                  className={`p-3 rounded-radius-sm border text-left transition-all ${
                    importMode === opt.value
                      ? 'border-accent bg-accent-light shadow-sm'
                      : 'border-border bg-bg-app hover:border-accent/40'
                  }`}
                >
                  <p className={`text-small font-semibold ${importMode === opt.value ? 'text-accent' : 'text-text-primary'}`}>
                    {opt.label}
                  </p>
                  <p className="text-[11px] text-text-tertiary mt-0.5 leading-tight">{opt.sub}</p>
                </button>
              ))}
            </div>

            {importMode === 'custom' && (
              <div className="mt-3 bg-bg-app border border-border rounded-radius-sm max-h-44 overflow-y-auto divide-y divide-border/50">
                {templateTasks.map(t => (
                  <label
                    key={t.id}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-bg-surface-raised cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTaskIds.has(t.id)}
                      onChange={() => toggleTask(t.id)}
                      className="w-3.5 h-3.5 accent-[#1A9E6E] shrink-0"
                    />
                    <span className="flex-1 text-small text-text-primary truncate">{t.title}</span>
                    <span className="text-[10px] text-text-tertiary">{t.estimated_minutes}m</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Datas */}
          <div>
            <label className="text-label text-text-secondary block mb-2">DATAS DE INÍCIO E FIM</label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: 'as_is' as DateMode, label: '📅 Importar como está', sub: 'Datas estáticas, sem prazo definido.' },
                { value: 'remap' as DateMode, label: '↻ Remapear datas', sub: 'Definir prazo padrão a partir de hoje.' },
              ] as const).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setDateMode(opt.value)}
                  className={`p-3 rounded-radius-sm border text-left transition-all ${
                    dateMode === opt.value
                      ? 'border-accent bg-accent-light shadow-sm'
                      : 'border-border bg-bg-app hover:border-accent/40'
                  }`}
                >
                  <p className={`text-small font-semibold ${dateMode === opt.value ? 'text-accent' : 'text-text-primary'}`}>
                    {opt.label}
                  </p>
                  <p className="text-[11px] text-text-tertiary mt-0.5 leading-tight">{opt.sub}</p>
                </button>
              ))}
            </div>
            {dateMode === 'remap' && (
              <div className="mt-3 flex items-center gap-3 bg-bg-app border border-border rounded-radius-sm px-4 py-3">
                <label className="text-small text-text-secondary shrink-0">
                  Prazo padrão (dias a partir de hoje):
                </label>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={dateOffset}
                  onChange={e => setDateOffset(Math.max(1, Number(e.target.value)))}
                  className="w-20 bg-bg-surface border border-border rounded-radius-sm px-3 py-1.5 text-small text-center focus:border-accent focus:outline-none transition-colors"
                />
                <span className="text-small text-text-tertiary">dias</span>
              </div>
            )}
          </div>

          {/* Tarefas arquivadas */}
          <div>
            <label className="text-label text-text-secondary block mb-2">
              VOCÊ DESEJA INCLUIR TAREFAS CONCLUÍDAS?
            </label>
            <div className="space-y-2 bg-bg-app border border-border rounded-radius-sm p-4">
              {([
                { value: 'none' as ArchiveMode, label: 'Não' },
                { value: 'include' as ArchiveMode, label: 'Sim, incluir tarefas concluídas' },
                { value: 'reactivate' as ArchiveMode, label: 'Sim, incluir e reabrir como "A fazer"' },
              ] as const).map(opt => (
                <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="radio"
                    name="archive"
                    value={opt.value}
                    checked={archiveMode === opt.value}
                    onChange={() => setArchiveMode(opt.value)}
                    className="accent-[#1A9E6E]"
                  />
                  <span className={`text-small transition-colors ${archiveMode === opt.value ? 'text-text-primary font-medium' : 'text-text-secondary group-hover:text-text-primary'}`}>
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-bg-surface-raised flex items-center justify-between gap-3 rounded-b-radius-md shrink-0">
          <p className="text-[11px] text-text-tertiary leading-tight">
            Serão criadas <strong className="text-text-primary">{activeCount}</strong> tarefa(s) para o cliente <strong className="text-text-primary">{selectedClient?.name ?? '—'}</strong>.
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-small text-text-secondary hover:text-text-primary transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleApply}
              disabled={applying || !selectedClientId || (importMode === 'custom' && selectedTaskIds.size === 0)}
              className={`flex items-center gap-2 px-6 py-2 rounded-radius-sm text-small font-bold transition-all shadow-card ${
                success
                  ? 'bg-accent text-white'
                  : 'bg-accent text-white hover:bg-accent-hover disabled:opacity-50'
              }`}
            >
              {success ? (
                <><CheckSquare size={14} /> Aplicado!</>
              ) : applying ? (
                <><div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Aplicando...</>
              ) : (
                'Usar modelo'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
