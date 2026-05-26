import { useState, useEffect, useRef, useCallback } from 'react'
import { Plus, X, ChevronRight, Flag, User2, Check } from 'lucide-react'
import { useSubtasks } from '../../hooks/useSubtasks'
import type { Subtask } from '../../hooks/useSubtasks'

const TEAM_USERS = [
  { id: 'brenosousaf13@gmail.com', name: 'Breno', initial: 'B' },
  { id: 'lucassousaf01@gmail.com', name: 'Lucas', initial: 'L' },
  { id: 'marceladneves@yahoo.com.br', name: 'Marcela', initial: 'M' },
]

const PRIORITY_CONFIG = {
  1: { label: 'Baixa', color: 'text-status-yellow' },
  2: { label: 'Média', color: 'text-status-orange' },
  3: { label: 'Alta', color: 'text-status-red' },
} as const

function getUserInitial(email: string | null) {
  if (!email) return '?'
  const u = TEAM_USERS.find(u => u.id === email)
  return u ? u.initial : email[0].toUpperCase()
}

function getUserName(email: string | null) {
  if (!email) return null
  return TEAM_USERS.find(u => u.id === email)?.name ?? email.split('@')[0]
}

function SubtaskRow({
  subtask,
  onToggle,
  onUpdate,
  onDelete,
}: {
  subtask: Subtask
  onToggle: (id: string, done: boolean) => void
  onUpdate: (id: string, payload: Partial<Subtask>) => void
  onDelete: (id: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(subtask.title)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  const commitEdit = useCallback(() => {
    setEditing(false)
    const trimmed = editTitle.trim()
    if (trimmed && trimmed !== subtask.title) onUpdate(subtask.id, { title: trimmed })
    else setEditTitle(subtask.title)
  }, [editTitle, subtask.id, subtask.title, onUpdate])

  const nextPriority = (p: number) => (p >= 3 ? 1 : p + 1) as 1 | 2 | 3

  return (
    <div className="group flex items-center gap-2 px-3 py-2 hover:bg-bg-app/60 border-b border-border/40 last:border-0 transition-colors">
      {/* Status toggle */}
      <button
        type="button"
        onClick={() => onToggle(subtask.id, !subtask.is_done)}
        className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${
          subtask.is_done
            ? 'bg-accent border-accent text-white'
            : 'border-border bg-transparent hover:border-accent/60'
        }`}
      >
        {subtask.is_done && <Check size={10} strokeWidth={3} />}
      </button>

      {/* Title */}
      {editing ? (
        <input
          ref={inputRef}
          value={editTitle}
          onChange={e => setEditTitle(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={e => {
            if (e.key === 'Enter') commitEdit()
            if (e.key === 'Escape') { setEditing(false); setEditTitle(subtask.title) }
          }}
          className="flex-1 text-small bg-transparent border-b border-accent outline-none py-0.5"
        />
      ) : (
        <span
          onClick={() => setEditing(true)}
          className={`flex-1 text-small cursor-text select-none truncate transition-colors ${
            subtask.is_done ? 'line-through text-text-tertiary' : 'text-text-primary hover:text-accent'
          }`}
        >
          {subtask.title}
        </span>
      )}

      {/* Assignee */}
      <div className="relative shrink-0">
        <select
          value={subtask.assigned_to ?? ''}
          onChange={e => onUpdate(subtask.id, { assigned_to: e.target.value || null })}
          className="absolute inset-0 opacity-0 w-full cursor-pointer"
          title="Responsável"
        >
          <option value="">—</option>
          {TEAM_USERS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-opacity pointer-events-none ${
            subtask.assigned_to
              ? 'bg-accent-light text-accent'
              : 'bg-bg-app border border-border text-text-tertiary opacity-0 group-hover:opacity-100'
          }`}
          title={getUserName(subtask.assigned_to) ?? 'Responsável'}
        >
          {subtask.assigned_to ? getUserInitial(subtask.assigned_to) : <User2 size={11} />}
        </div>
      </div>

      {/* Priority */}
      <button
        type="button"
        onClick={() => onUpdate(subtask.id, { priority: nextPriority(subtask.priority) })}
        title={PRIORITY_CONFIG[subtask.priority as 1 | 2 | 3]?.label ?? 'Prioridade'}
        className={`shrink-0 transition-opacity ${
          subtask.priority !== 2
            ? PRIORITY_CONFIG[subtask.priority as 1 | 2 | 3]?.color
            : 'text-text-tertiary opacity-0 group-hover:opacity-100'
        }`}
      >
        <Flag size={13} strokeWidth={subtask.priority === 3 ? 2.5 : 1.5} fill={subtask.priority === 3 ? 'currentColor' : 'none'} />
      </button>

      {/* Delete */}
      <button
        type="button"
        onClick={() => onDelete(subtask.id)}
        className="shrink-0 text-text-tertiary hover:text-status-red transition-colors opacity-0 group-hover:opacity-100"
      >
        <X size={13} />
      </button>
    </div>
  )
}

export function SubtasksSection({ taskId }: { taskId: string }) {
  const { subtasks, loading, fetchSubtasks, addSubtask, toggleSubtask, updateSubtask, deleteSubtask } = useSubtasks(taskId)
  const [collapsed, setCollapsed] = useState(false)
  const [adding, setAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const newInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { fetchSubtasks() }, [fetchSubtasks])
  useEffect(() => { if (adding) newInputRef.current?.focus() }, [adding])

  const commitAdd = async () => {
    const trimmed = newTitle.trim()
    if (trimmed) await addSubtask(trimmed)
    setNewTitle('')
    setAdding(false)
  }

  const doneCount = subtasks.filter(s => s.is_done).length
  const total = subtasks.length

  const progressPct = total > 0 ? Math.round((doneCount / total) * 100) : 0

  return (
    <div className="border border-border rounded-radius-sm overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 bg-bg-surface-raised cursor-pointer select-none hover:bg-bg-app/50 transition-colors"
        onClick={() => setCollapsed(v => !v)}
      >
        <ChevronRight
          size={13}
          className={`text-text-tertiary shrink-0 transition-transform ${collapsed ? '' : 'rotate-90'}`}
        />
        <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">
          Subtarefas
        </span>
        {total > 0 && (
          <>
            <span className="text-[11px] text-text-tertiary">
              {doneCount}/{total}
            </span>
            {/* Progress bar */}
            <div className="flex-1 h-1 bg-border rounded-full overflow-hidden mx-1">
              <div
                className="h-full bg-accent rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </>
        )}
        <button
          type="button"
          onClick={e => { e.stopPropagation(); setCollapsed(false); setAdding(true) }}
          className="ml-auto p-1 rounded hover:bg-bg-app text-text-tertiary hover:text-accent transition-colors shrink-0"
          title="Adicionar subtarefa"
        >
          <Plus size={13} />
        </button>
      </div>

      {/* Body */}
      {!collapsed && (
        <div>
          {/* Column headers */}
          {total > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-bg-app/30 border-b border-border/60">
              <div className="w-5 shrink-0" />
              <span className="flex-1 text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Nome</span>
              <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider w-6 text-center">Resp.</span>
              <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider w-5 text-center">Pri.</span>
              <div className="w-4 shrink-0" />
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex justify-center py-5">
              <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Subtask rows */}
          {!loading && subtasks.map(sub => (
            <SubtaskRow
              key={sub.id}
              subtask={sub}
              onToggle={toggleSubtask}
              onUpdate={updateSubtask}
              onDelete={deleteSubtask}
            />
          ))}

          {/* Add row */}
          {adding ? (
            <div className="flex items-center gap-2 px-3 py-2 border-t border-border/40 bg-bg-app/40">
              <div className="w-5 h-5 rounded-full border-2 border-border shrink-0" />
              <input
                ref={newInputRef}
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { e.preventDefault(); commitAdd() }
                  if (e.key === 'Escape') { setAdding(false); setNewTitle('') }
                }}
                placeholder="Nome da subtarefa..."
                className="flex-1 text-small bg-transparent outline-none text-text-primary placeholder:text-text-tertiary"
              />
              <button
                type="button"
                onClick={commitAdd}
                className="text-[11px] font-bold text-white bg-accent px-3 py-1 rounded-radius-sm hover:bg-accent-hover transition-colors shrink-0"
              >
                Salvar
              </button>
              <button
                type="button"
                onClick={() => { setAdding(false); setNewTitle('') }}
                className="text-[11px] text-text-secondary hover:text-text-primary transition-colors shrink-0"
              >
                Cancelar
              </button>
            </div>
          ) : (
            !loading && (
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="w-full flex items-center gap-2 px-3 py-2 text-small text-text-tertiary hover:text-accent hover:bg-bg-app/40 transition-colors border-t border-border/30"
              >
                <Plus size={12} /> Adicionar subtarefa
              </button>
            )
          )}
        </div>
      )}
    </div>
  )
}
