import { useState } from 'react'
import { Layers, Play, Trash2, Calendar, BarChart2, Search, X, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useTaskTemplates, type TaskTemplate, type TemplateTask } from '../../hooks/useTaskTemplates'
import { useClients } from '../../hooks/useClients'
import { UseTemplateModal } from './UseTemplateModal'

const PRIORITY_LABEL = { 1: 'Baixa', 2: 'Média', 3: 'Alta' } as const
const PRIORITY_COLOR = {
  1: 'text-status-yellow',
  2: 'text-status-orange',
  3: 'text-status-red',
} as const

export function TemplatesPage() {
  const { templates, loading, fetchTemplateTasks, deleteTemplate } = useTaskTemplates()
  const { clients } = useClients()
  const [search, setSearch] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplate | null>(null)
  const [selectedTemplateTasks, setSelectedTemplateTasks] = useState<TemplateTask[]>([])
  const [loadingTasks, setLoadingTasks] = useState(false)
  const [useModalOpen, setUseModalOpen] = useState(false)

  const filtered = templates.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase())
  )

  const openDetail = async (tmpl: TaskTemplate) => {
    setSelectedTemplate(tmpl)
    setLoadingTasks(true)
    try {
      const tasks = await fetchTemplateTasks(tmpl.id)
      setSelectedTemplateTasks(tasks)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingTasks(false)
    }
  }

  const handleUse = async (tmpl: TaskTemplate) => {
    await openDetail(tmpl)
    setUseModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Excluir este modelo permanentemente?')) return
    await deleteTemplate(id)
    if (selectedTemplate?.id === id) setSelectedTemplate(null)
  }

  return (
    <main className="flex-1 h-screen overflow-hidden flex flex-col bg-bg-app animate-in fade-in duration-300">
      {/* Header */}
      <header className="px-6 pt-6 pb-5 shrink-0 border-b border-border bg-bg-surface">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-display text-text-primary mb-1 flex items-center gap-3">
              <Layers size={26} className="text-accent" />
              Central de Modelos
            </h1>
            <p className="text-body text-text-secondary">
              Fluxos de trabalho reutilizáveis para acelerar a criação de novos projetos.
            </p>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 min-h-0 flex overflow-hidden">

        {/* Left: grid */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="px-6 py-4 shrink-0 border-b border-border bg-bg-surface flex items-center gap-4">
            <div className="relative w-72">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input
                type="text"
                placeholder="Buscar modelos..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-bg-app border border-border rounded-radius-sm pl-8 pr-3 py-2 text-small focus:border-accent focus:outline-none transition-colors"
              />
            </div>
            <span className="text-small text-text-tertiary">
              {filtered.length} {filtered.length === 1 ? 'modelo' : 'modelos'}
            </span>
          </div>

          {/* Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center py-24 gap-2 text-text-tertiary">
                <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-28 text-center">
                <div className="w-16 h-16 rounded-radius-xl bg-bg-surface border border-border shadow-card flex items-center justify-center mb-5">
                  <Layers size={28} className="text-text-tertiary opacity-30" />
                </div>
                <p className="text-body-lg text-text-secondary font-medium mb-1.5">
                  {search ? 'Nenhum modelo encontrado' : 'Nenhum modelo criado ainda'}
                </p>
                <p className="text-small text-text-tertiary max-w-xs leading-relaxed">
                  {search
                    ? 'Tente uma busca diferente.'
                    : 'Acesse um cliente → aba Tarefas → botão "Salvar como Modelo" para criar seu primeiro modelo de fluxo de trabalho.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4 max-w-5xl">
                {filtered.map(tmpl => (
                  <div
                    key={tmpl.id}
                    onClick={() => openDetail(tmpl)}
                    className={`bg-bg-surface border rounded-radius-md p-5 cursor-pointer transition-all hover:shadow-raised group relative ${
                      selectedTemplate?.id === tmpl.id
                        ? 'border-accent shadow-raised'
                        : 'border-border hover:border-accent/40'
                    }`}
                  >
                    {/* Card header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-10 h-10 rounded-radius-sm bg-accent-light flex items-center justify-center shrink-0">
                        <Layers size={18} className="text-accent" />
                      </div>
                      {/* Hover actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={e => { e.stopPropagation(); handleUse(tmpl) }}
                          title="Usar modelo"
                          className="p-1.5 rounded hover:bg-accent-light text-text-tertiary hover:text-accent transition-colors"
                        >
                          <Play size={13} />
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); handleDelete(tmpl.id) }}
                          title="Excluir modelo"
                          className="p-1.5 rounded hover:bg-status-red/10 text-text-tertiary hover:text-status-red transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Name + description */}
                    <h3 className="text-body-lg font-semibold text-text-primary leading-snug mb-1">
                      {tmpl.name}
                    </h3>
                    {tmpl.description ? (
                      <p className="text-[11px] text-text-tertiary line-clamp-2 leading-relaxed mb-4">
                        {tmpl.description}
                      </p>
                    ) : (
                      <div className="mb-4" />
                    )}

                    {/* Metadata */}
                    <div className="flex items-center gap-3 pt-3 border-t border-border/60">
                      <span className="flex items-center gap-1 text-[11px] text-text-tertiary">
                        <BarChart2 size={10} />
                        {tmpl.use_count} {tmpl.use_count === 1 ? 'uso' : 'usos'}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-text-tertiary">
                        <Calendar size={10} />
                        {format(new Date(tmpl.created_at), 'dd/MM/yy', { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: detail panel */}
        {selectedTemplate && (
          <div className="w-[300px] shrink-0 border-l border-border bg-bg-surface flex flex-col h-full overflow-hidden animate-in slide-in-from-right-4 duration-200">
            {/* Panel header */}
            <div className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0 bg-bg-surface-raised">
              <div className="flex items-center gap-2 min-w-0">
                <Layers size={14} className="text-accent shrink-0" />
                <h3 className="text-section font-bold text-text-primary truncate">
                  {selectedTemplate.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="p-1.5 rounded hover:bg-bg-app text-text-tertiary shrink-0 ml-2"
              >
                <X size={14} />
              </button>
            </div>

            {/* Panel body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {selectedTemplate.description && (
                <p className="text-small text-text-secondary leading-relaxed">
                  {selectedTemplate.description}
                </p>
              )}

              {/* Metadata */}
              <div className="bg-bg-app rounded-radius-sm border border-border divide-y divide-border/60">
                {[
                  { label: 'Criado por', value: selectedTemplate.created_by?.split('@')[0] ?? '—' },
                  {
                    label: 'Data criada',
                    value: format(new Date(selectedTemplate.created_at), "dd 'de' MMM, yyyy", { locale: ptBR }),
                  },
                  {
                    label: 'Utilizado',
                    value: `${selectedTemplate.use_count} ${selectedTemplate.use_count === 1 ? 'vez' : 'vezes'}`,
                  },
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-center px-3 py-2.5">
                    <span className="text-small text-text-tertiary">{row.label}</span>
                    <span className="text-small text-text-primary font-medium">{row.value}</span>
                  </div>
                ))}
              </div>

              {/* Task list */}
              <div>
                <h4 className="text-label text-text-tertiary uppercase tracking-wide mb-2">
                  Modelo inclui
                </h4>
                <div className="bg-bg-app border border-border rounded-radius-sm overflow-hidden">
                  <div className="px-3 py-2.5 border-b border-border flex items-center justify-between bg-bg-surface-raised">
                    <span className="text-small font-semibold text-text-primary flex items-center gap-1.5">
                      <ChevronRight size={12} className="text-text-tertiary" />
                      Lista de tarefas
                    </span>
                    <span className="text-[10px] bg-bg-app border border-border text-text-tertiary px-2 py-0.5 rounded-full">
                      {selectedTemplateTasks.length} tarefas
                    </span>
                  </div>
                  {loadingTasks ? (
                    <div className="flex items-center justify-center py-8 gap-2 text-text-tertiary">
                      <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : selectedTemplateTasks.length === 0 ? (
                    <p className="text-[11px] text-text-tertiary p-3 italic text-center">
                      Nenhuma tarefa neste modelo.
                    </p>
                  ) : (
                    <div className="max-h-60 overflow-y-auto divide-y divide-border/50">
                      {selectedTemplateTasks.map((t, i) => (
                        <div key={t.id} className="px-3 py-2.5 flex items-center gap-2">
                          <span className="text-[10px] text-text-tertiary w-4 shrink-0 font-mono">{i + 1}</span>
                          <span className="flex-1 text-small text-text-secondary truncate">{t.title}</span>
                          <span className={`text-[10px] font-medium shrink-0 ${PRIORITY_COLOR[t.priority as 1 | 2 | 3] ?? 'text-text-tertiary'}`}>
                            {PRIORITY_LABEL[t.priority as 1 | 2 | 3] ?? '—'}
                          </span>
                          <span className="text-[10px] text-text-tertiary shrink-0 w-8 text-right">
                            {t.estimated_minutes}m
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Panel footer */}
            <div className="p-4 border-t border-border shrink-0">
              <button
                onClick={() => setUseModalOpen(true)}
                className="w-full bg-accent text-white py-2.5 rounded-radius-sm text-small font-bold hover:bg-accent-hover transition-colors shadow-card flex items-center justify-center gap-2"
              >
                <Play size={14} /> Usar Modelo
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Use template modal */}
      {useModalOpen && selectedTemplate && (
        <UseTemplateModal
          template={selectedTemplate}
          templateTasks={selectedTemplateTasks}
          clients={clients}
          onClose={() => setUseModalOpen(false)}
          onApplied={() => setUseModalOpen(false)}
        />
      )}
    </main>
  )
}
