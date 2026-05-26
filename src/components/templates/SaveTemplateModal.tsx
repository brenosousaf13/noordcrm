import { useState } from 'react'
import { X, Layers } from 'lucide-react'
import { useTaskTemplates } from '../../hooks/useTaskTemplates'
import { useAuth } from '../../contexts/AuthContext'
import type { Database } from '../../types/database.types'

type Task = Database['public']['Tables']['tasks']['Row']

interface SaveTemplateModalProps {
  clientName: string
  tasks: Task[]
  onClose: () => void
  onSaved: (templateName: string) => void
}

export function SaveTemplateModal({ clientName, tasks, onClose, onSaved }: SaveTemplateModalProps) {
  const { saveTemplate } = useTaskTemplates()
  const { user } = useAuth()
  const [name, setName] = useState(clientName + ' — Modelo')
  const [description, setDescription] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(tasks.filter(t => t.status !== 'Concluído').map(t => t.id))
  )
  const [saving, setSaving] = useState(false)

  const toggle = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  const handleSave = async () => {
    if (!name.trim() || selectedIds.size === 0) return
    setSaving(true)
    try {
      const selected = tasks.filter(t => selectedIds.has(t.id))
      const templateTasks = selected.map((t, i) => ({
        title: t.title,
        description: t.description ?? null,
        status: t.status,
        priority: t.priority,
        estimated_minutes: t.estimated_minutes,
        assigned_to: t.assigned_to ?? null,
        sort_order: i,
      }))
      await saveTemplate(name.trim(), description.trim() || null, templateTasks, user?.email ?? null)
      onSaved(name.trim())
      onClose()
    } catch (err) {
      console.error(err)
      alert('Erro ao salvar modelo.')
    } finally {
      setSaving(false)
    }
  }

  const PRIORITY_LABEL = { 1: 'Baixa', 2: 'Média', 3: 'Alta' } as const

  return (
    <div className="fixed inset-0 z-[99999] bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-bg-surface rounded-radius-md shadow-modal w-full max-w-lg max-h-[88vh] flex flex-col animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0 bg-bg-surface-raised rounded-t-radius-md">
          <h2 className="text-section font-bold text-text-primary flex items-center gap-2">
            <Layers size={17} className="text-accent" />
            Salvar como Modelo
          </h2>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-bg-app text-text-tertiary">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div>
            <label className="text-label text-text-secondary block mb-1.5">NOME DO MODELO *</label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-bg-app border border-border rounded-radius-sm px-3 py-2.5 text-body focus:border-accent focus:outline-none transition-colors"
              placeholder="Ex: Gestão de Loja Virtual"
            />
          </div>

          <div>
            <label className="text-label text-text-secondary block mb-1.5">DESCRIÇÃO (opcional)</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              className="w-full bg-bg-app border border-border rounded-radius-sm px-3 py-2.5 text-body focus:border-accent focus:outline-none transition-colors resize-none"
              placeholder="Para qual tipo de projeto este modelo é indicado..."
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-label text-text-secondary">
                TAREFAS A INCLUIR ({selectedIds.size}/{tasks.length})
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedIds(new Set(tasks.map(t => t.id)))}
                  className="text-[11px] text-accent hover:underline"
                >
                  Todas
                </button>
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="text-[11px] text-text-tertiary hover:underline"
                >
                  Nenhuma
                </button>
              </div>
            </div>
            <div className="bg-bg-app border border-border rounded-radius-sm max-h-56 overflow-y-auto divide-y divide-border/50">
              {tasks.length === 0 ? (
                <p className="text-small text-text-tertiary italic p-4 text-center">
                  Nenhuma tarefa neste cliente.
                </p>
              ) : (
                tasks.map(task => (
                  <label
                    key={task.id}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-bg-surface-raised cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(task.id)}
                      onChange={() => toggle(task.id)}
                      className="w-3.5 h-3.5 accent-[#1A9E6E] shrink-0"
                    />
                    <span className="flex-1 text-small text-text-primary truncate">{task.title}</span>
                    <span className="text-[10px] text-text-tertiary shrink-0 mr-1">
                      {PRIORITY_LABEL[task.priority as 1 | 2 | 3]}
                    </span>
                    <span className="text-[10px] text-text-tertiary shrink-0">
                      {task.estimated_minutes}m
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-bg-surface-raised flex justify-end gap-3 rounded-b-radius-md shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-small text-text-secondary hover:text-text-primary transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim() || selectedIds.size === 0}
            className="bg-accent text-white px-6 py-2 rounded-radius-sm text-small font-bold hover:bg-accent-hover disabled:opacity-50 transition-colors shadow-card"
          >
            {saving ? 'Salvando...' : 'Salvar Modelo'}
          </button>
        </div>
      </div>
    </div>
  )
}
