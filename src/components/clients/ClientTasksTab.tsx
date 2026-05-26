import { useState, useEffect, useRef } from 'react'
import {
  Plus, X, Layers, User, CheckCircle2, Clock, AlertCircle, Circle,
  ChevronRight, MoreHorizontal, Trash2, Edit2, CheckSquare
} from 'lucide-react'
import { useTaskLists, type TaskList } from '../../hooks/useTaskLists'
import { useClients } from '../../hooks/useClients'
import { TaskModal } from '../dashboard/TaskModal'
import { SaveTemplateModal } from '../templates/SaveTemplateModal'
import type { Database } from '../../types/database.types'
import { format, isToday, isTomorrow, isPast, differenceInCalendarDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type Client = Database['public']['Tables']['clients']['Row']
type Task = Database['public']['Tables']['tasks']['Row']
type TaskFilter = 'all' | 'A fazer' | 'Fazendo' | 'Concluído' | 'Atrasado'

const STATUS_CONFIG = {
  'A fazer': { color: 'text-status-blue bg-status-blue/10 border-status-blue/20', icon: Circle },
  'Fazendo': { color: 'text-status-orange bg-status-orange/10 border-status-orange/20', icon: Clock },
  'Concluído': { color: 'text-accent bg-accent-light border-accent/20', icon: CheckCircle2 },
  'Atrasado': { color: 'text-status-red bg-status-red/10 border-status-red/20', icon: AlertCircle },
}

const TEAM_USERS = [
  { email: 'brenosousaf13@gmail.com', label: 'Breno' },
  { email: 'lucassousaf01@gmail.com', label: 'Lucas' },
  { email: 'marceladneves@yahoo.com.br', label: 'Marcela' },
]

function DeadlineBadge({ deadline, isDone }: { deadline: string | null; isDone: boolean }) {
  if (!deadline) return null
  const ref = new Date(deadline + 'T00:00:00')
  const days = differenceInCalendarDays(ref, new Date())
  const isLate = isPast(ref) && !isToday(ref) && !isDone
  const isRed = !isDone && (isLate || days <= 3)
  let label = format(ref, 'dd/MM', { locale: ptBR })
  if (isToday(ref)) label = 'HOJE'
  else if (isTomorrow(ref)) label = 'AMANHÃ'
  else if (days >= 2 && days <= 6) label = format(ref, 'EEE', { locale: ptBR }).toUpperCase().replace('.', '')
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${isRed ? 'text-status-red bg-[#FEE2E2] border-[#FCA5A5]' : 'text-text-tertiary bg-bg-app border-border'}`}>
      {label}
    </span>
  )
}

function PriorityBars({ priority }: { priority: 1 | 2 | 3 }) {
  return (
    <div className="flex gap-[2px] items-end">
      <div className={`w-[3px] h-1.5 rounded-full ${priority >= 1 ? (priority === 1 ? 'bg-status-yellow' : priority === 2 ? 'bg-status-orange' : 'bg-status-red') : 'bg-border'}`} />
      <div className={`w-[3px] h-2.5 rounded-full ${priority >= 2 ? (priority === 2 ? 'bg-status-orange' : 'bg-status-red') : 'bg-border'}`} />
      <div className={`w-[3px] h-3.5 rounded-full ${priority === 3 ? 'bg-status-red' : 'bg-border'}`} />
    </div>
  )
}

function TaskRow({ task, onClick }: { task: Task; onClick: () => void }) {
  const cfg = STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG['A fazer']
  return (
    <tr onClick={onClick} className="border-b border-border/50 hover:bg-bg-app transition-colors cursor-pointer last:border-0">
      <td className="px-4 py-3"><PriorityBars priority={task.priority} /></td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {task.is_done && <CheckCircle2 size={13} className="text-accent shrink-0" />}
          <span className={`text-small ${task.is_done ? 'line-through text-text-tertiary' : 'text-text-primary'}`}>{task.title}</span>
        </div>
        {task.description && <p className="text-[11px] text-text-tertiary mt-0.5 line-clamp-1">{task.description}</p>}
      </td>
      <td className="px-4 py-3">
        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${cfg.color}`}>{task.status}</span>
      </td>
      <td className="px-4 py-3"><DeadlineBadge deadline={task.deadline} isDone={task.is_done} /></td>
      <td className="px-4 py-3">
        {task.assigned_to
          ? <span className="text-small text-text-tertiary">{TEAM_USERS.find(u => u.email === task.assigned_to)?.label ?? task.assigned_to.split('@')[0]}</span>
          : <span className="text-[11px] text-text-tertiary italic">—</span>
        }
      </td>
      <td className="px-4 py-3">
        <span className="text-mono text-small text-text-tertiary">{task.estimated_minutes}m</span>
      </td>
    </tr>
  )
}

const TABLE_HEADERS = (
  <thead className="border-b border-border bg-bg-app/40">
    <tr>
      <th className="px-4 py-2 text-label text-text-tertiary uppercase tracking-wide w-8">P</th>
      <th className="px-4 py-2 text-label text-text-tertiary uppercase tracking-wide">Tarefa</th>
      <th className="px-4 py-2 text-label text-text-tertiary uppercase tracking-wide">Status</th>
      <th className="px-4 py-2 text-label text-text-tertiary uppercase tracking-wide">Prazo</th>
      <th className="px-4 py-2 text-label text-text-tertiary uppercase tracking-wide">Responsável</th>
      <th className="px-4 py-2 text-label text-text-tertiary uppercase tracking-wide w-16">Tempo</th>
    </tr>
  </thead>
)

function ListSection({
  list, tasks, collapsed, onToggleCollapse, onAddTask, onRename, onDelete, onTaskClick,
}: {
  list: TaskList
  tasks: Task[]
  collapsed: boolean
  onToggleCollapse: () => void
  onAddTask: () => void
  onRename: (name: string) => void
  onDelete: () => void
  onTaskClick: (task: Task) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(list.name)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const handle = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [menuOpen])

  const commitRename = () => {
    setEditing(false)
    const trimmed = editName.trim()
    if (trimmed && trimmed !== list.name) onRename(trimmed)
    else setEditName(list.name)
  }

  return (
    <div className="bg-bg-surface rounded-radius-md border border-border shadow-card overflow-visible mb-4">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-bg-surface-raised rounded-t-radius-md group border-b border-border/60">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="shrink-0 text-text-tertiary hover:text-text-primary transition-colors"
        >
          <ChevronRight size={13} className={`transition-transform duration-150 ${!collapsed ? 'rotate-90' : ''}`} />
        </button>

        {editing ? (
          <input
            autoFocus
            value={editName}
            onChange={e => setEditName(e.target.value)}
            onBlur={commitRename}
            onKeyDown={e => {
              if (e.key === 'Enter') commitRename()
              if (e.key === 'Escape') { setEditing(false); setEditName(list.name) }
            }}
            className="flex-1 text-small font-semibold bg-transparent border-b border-accent outline-none"
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <span
            className="flex-1 text-small font-semibold text-text-primary select-none cursor-text"
            onDoubleClick={() => { setEditName(list.name); setEditing(true) }}
          >
            {list.name}
          </span>
        )}

        <span className="text-[10px] text-text-tertiary bg-bg-app border border-border px-1.5 py-0.5 rounded-full shrink-0">
          {tasks.length}
        </span>

        <button
          type="button"
          onClick={onAddTask}
          className="flex items-center gap-1 px-2 py-1 text-[11px] text-accent hover:bg-accent-light rounded-radius-sm transition-colors font-semibold opacity-0 group-hover:opacity-100"
        >
          <Plus size={11} /> Tarefa
        </button>

        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen(v => !v)}
            className="p-1 rounded hover:bg-bg-app text-text-tertiary hover:text-text-primary transition-colors opacity-0 group-hover:opacity-100"
          >
            <MoreHorizontal size={14} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-44 bg-bg-surface border border-border rounded-radius-sm shadow-modal z-30 overflow-hidden">
              <button
                type="button"
                onClick={() => { setEditName(list.name); setEditing(true); setMenuOpen(false) }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-small text-text-secondary hover:bg-bg-app hover:text-text-primary transition-colors"
              >
                <Edit2 size={12} /> Renomear lista
              </button>
              <button
                type="button"
                onClick={() => { onDelete(); setMenuOpen(false) }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-small text-status-red hover:bg-status-red/5 transition-colors"
              >
                <Trash2 size={12} /> Excluir lista
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Task table */}
      {!collapsed && (
        tasks.length === 0 ? (
          <div className="px-6 py-6 text-center">
            <p className="text-small text-text-tertiary italic">Nenhuma tarefa nesta lista.</p>
            <button
              type="button"
              onClick={onAddTask}
              className="mt-2 text-[11px] text-accent hover:underline font-medium"
            >
              + Adicionar tarefa
            </button>
          </div>
        ) : (
          <table className="w-full text-left">
            {TABLE_HEADERS}
            <tbody>
              {tasks.map(task => (
                <TaskRow key={task.id} task={task} onClick={() => onTaskClick(task)} />
              ))}
            </tbody>
          </table>
        )
      )}
    </div>
  )
}

interface ClientTasksTabProps {
  client: Client
  tasks: Task[]
  addTask?: (payload: any) => Promise<any>
  onTaskClick: (task: Task) => void
}

export function ClientTasksTab({ client, tasks, addTask, onTaskClick }: ClientTasksTabProps) {
  const { lists, addList, updateList, deleteList } = useTaskLists(client.id)
  const { clients: allClients } = useClients()

  const [taskFilter, setTaskFilter] = useState<TaskFilter>('all')
  const [assigneeFilter, setAssigneeFilter] = useState('all')
  const [collapsedLists, setCollapsedLists] = useState<Set<string>>(new Set())
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false)
  const [templateSavedName, setTemplateSavedName] = useState<string | null>(null)
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [createListId, setCreateListId] = useState<string | null>(null)
  const [addingList, setAddingList] = useState(false)
  const [newListName, setNewListName] = useState('')
  const newListInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (addingList) newListInputRef.current?.focus() }, [addingList])

  // Reset filters when client changes
  useEffect(() => {
    setTaskFilter('all')
    setAssigneeFilter('all')
    setCollapsedLists(new Set())
  }, [client.id])

  const clientTasks = tasks.filter(t => t.client_id === client.id)
  const filteredTasks = clientTasks
    .filter(t => taskFilter === 'all' || t.status === taskFilter)
    .filter(t => assigneeFilter === 'all' || t.assigned_to === assigneeFilter)

  const taskCounts = {
    all: clientTasks.length,
    'A fazer': clientTasks.filter(t => t.status === 'A fazer').length,
    'Fazendo': clientTasks.filter(t => t.status === 'Fazendo').length,
    'Concluído': clientTasks.filter(t => t.status === 'Concluído').length,
    'Atrasado': clientTasks.filter(t => t.status === 'Atrasado').length,
  }

  // Group filtered tasks by list_id
  const tasksByListId = new Map<string | null, Task[]>()
  tasksByListId.set(null, [])
  lists.forEach(l => tasksByListId.set(l.id, []))
  filteredTasks.forEach(t => {
    const lid = t.list_id ?? null
    const key = lid && tasksByListId.has(lid) ? lid : null
    tasksByListId.get(key)!.push(t)
  })

  const ungroupedTasks = tasksByListId.get(null) ?? []

  const toggleCollapse = (listId: string) => {
    setCollapsedLists(prev => {
      const next = new Set(prev)
      if (next.has(listId)) next.delete(listId); else next.add(listId)
      return next
    })
  }

  const handleOpenTaskModal = (listId: string | null) => {
    setCreateListId(listId)
    setTaskModalOpen(true)
  }

  const handleCommitList = async () => {
    const name = newListName.trim()
    if (name) await addList(name)
    setNewListName('')
    setAddingList(false)
  }

  const hasContent = lists.length > 0 || clientTasks.length > 0

  return (
    <div className="p-6">
      {/* Template saved toast */}
      {templateSavedName && (
        <div className="mb-4 px-4 py-3 bg-accent-light border border-accent/30 rounded-radius-sm flex items-center gap-3">
          <Layers size={14} className="text-accent shrink-0" />
          <p className="text-small text-accent font-medium flex-1">
            Modelo "<strong>{templateSavedName}</strong>" salvo com sucesso!
          </p>
          <button onClick={() => setTemplateSavedName(null)} className="text-accent/60 hover:text-accent">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {(['all', 'A fazer', 'Fazendo', 'Concluído', 'Atrasado'] as TaskFilter[]).map(f => (
            <button
              key={f}
              onClick={() => setTaskFilter(f)}
              className={`px-3 py-1.5 rounded-radius-sm text-small font-medium transition-colors border ${
                taskFilter === f
                  ? 'bg-accent text-white border-accent'
                  : 'bg-bg-surface text-text-secondary border-border hover:border-accent/50 hover:text-text-primary'
              }`}
            >
              {f === 'all' ? 'Todas' : f}
              <span className="ml-1.5 opacity-60 text-[10px]">
                {f === 'all' ? taskCounts.all : taskCounts[f as keyof typeof taskCounts]}
              </span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {addTask && (
            <button
              onClick={() => handleOpenTaskModal(null)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-small text-white bg-accent rounded-radius-sm hover:bg-accent-hover transition-colors shadow-card"
            >
              <Plus size={12} /> Nova Tarefa
            </button>
          )}
          <button
            onClick={() => setSaveTemplateOpen(true)}
            disabled={clientTasks.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-small text-text-secondary bg-bg-surface border border-border rounded-radius-sm hover:border-accent/50 hover:text-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Layers size={12} /> Salvar como Modelo
          </button>
          <User size={12} className="text-text-tertiary" />
          <div className="flex items-center gap-1 bg-bg-surface border border-border rounded-radius-sm p-0.5">
            <button
              onClick={() => setAssigneeFilter('all')}
              className={`px-2.5 py-1 rounded text-small transition-colors ${assigneeFilter === 'all' ? 'bg-bg-surface-raised text-text-primary font-semibold shadow-sm' : 'text-text-tertiary hover:text-text-secondary'}`}
            >
              Todos
            </button>
            {TEAM_USERS.map(u => (
              <button
                key={u.email}
                onClick={() => setAssigneeFilter(u.email)}
                className={`px-2.5 py-1 rounded text-small transition-colors ${assigneeFilter === u.email ? 'bg-bg-surface-raised text-text-primary font-semibold shadow-sm' : 'text-text-tertiary hover:text-text-secondary'}`}
              >
                {u.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Empty state */}
      {!hasContent && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <CheckSquare size={36} className="text-text-tertiary opacity-25 mb-3" />
          <p className="text-body-lg text-text-secondary font-medium mb-1">Nenhuma tarefa ainda</p>
          <p className="text-small text-text-tertiary mb-5 max-w-sm leading-relaxed">
            Crie uma lista para organizar as tarefas por tema (ex: Marca, Mercado) ou adicione tarefas diretamente.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAddingList(true)}
              className="flex items-center gap-2 px-4 py-2 bg-bg-surface border border-border rounded-radius-sm text-small font-semibold text-text-secondary hover:border-accent/50 hover:text-text-primary transition-colors"
            >
              <Plus size={13} /> Nova Lista
            </button>
            {addTask && (
              <button
                onClick={() => handleOpenTaskModal(null)}
                className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-radius-sm text-small font-semibold hover:bg-accent-hover transition-colors shadow-card"
              >
                <Plus size={13} /> Nova Tarefa
              </button>
            )}
          </div>
        </div>
      )}

      {/* Named list sections */}
      {lists.map(list => (
        <ListSection
          key={list.id}
          list={list}
          tasks={tasksByListId.get(list.id) ?? []}
          collapsed={collapsedLists.has(list.id)}
          onToggleCollapse={() => toggleCollapse(list.id)}
          onAddTask={() => handleOpenTaskModal(list.id)}
          onRename={name => updateList(list.id, { name })}
          onDelete={() => {
            if (window.confirm(`Excluir a lista "${list.name}"?\n\nAs tarefas serão mantidas, mas ficarão sem lista.`)) deleteList(list.id)
          }}
          onTaskClick={onTaskClick}
        />
      ))}

      {/* Ungrouped tasks ("Sem lista") */}
      {(ungroupedTasks.length > 0 || (lists.length === 0 && clientTasks.length > 0)) && (
        <div className="bg-bg-surface rounded-radius-md border border-border shadow-card overflow-hidden mb-4">
          <div className="flex items-center gap-2 px-4 py-3 bg-bg-surface-raised border-b border-border/60">
            <span className="flex-1 text-small font-semibold text-text-tertiary italic">Sem lista</span>
            <span className="text-[10px] text-text-tertiary bg-bg-app border border-border px-1.5 py-0.5 rounded-full shrink-0">
              {ungroupedTasks.length}
            </span>
          </div>
          {ungroupedTasks.length === 0 ? (
            <div className="px-6 py-6 text-center">
              <p className="text-small text-text-tertiary italic">Nenhuma tarefa sem lista.</p>
            </div>
          ) : (
            <table className="w-full text-left">
              {TABLE_HEADERS}
              <tbody>
                {ungroupedTasks.map(task => (
                  <TaskRow key={task.id} task={task} onClick={() => onTaskClick(task)} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Nova Lista input / button */}
      {hasContent && (
        addingList ? (
          <div className="flex items-center gap-3 p-4 bg-bg-surface rounded-radius-md border border-accent/30 shadow-card">
            <Plus size={14} className="text-accent shrink-0" />
            <input
              ref={newListInputRef}
              value={newListName}
              onChange={e => setNewListName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleCommitList()
                if (e.key === 'Escape') { setAddingList(false); setNewListName('') }
              }}
              placeholder="Nome da lista (ex: Marca, Desenvolvimento, Entrega…)"
              className="flex-1 text-small bg-transparent outline-none text-text-primary placeholder:text-text-tertiary"
            />
            <button
              type="button"
              onClick={handleCommitList}
              className="text-[11px] font-bold text-white bg-accent px-3 py-1.5 rounded-radius-sm hover:bg-accent-hover transition-colors shrink-0"
            >
              Criar Lista
            </button>
            <button
              type="button"
              onClick={() => { setAddingList(false); setNewListName('') }}
              className="text-[11px] text-text-secondary hover:text-text-primary transition-colors shrink-0"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAddingList(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-small text-text-tertiary hover:text-accent hover:bg-bg-surface-raised transition-colors rounded-radius-sm border border-dashed border-border hover:border-accent/40 mt-1"
          >
            <Plus size={13} /> Nova Lista
          </button>
        )
      )}

      {/* Task create modal */}
      {taskModalOpen && addTask && (
        <TaskModal
          task={null}
          clients={allClients}
          defaultClientId={client.id}
          defaultListId={createListId ?? undefined}
          onSave={async (payload) => { await addTask(payload) }}
          onClose={() => { setTaskModalOpen(false); setCreateListId(null) }}
        />
      )}

      {/* Save Template Modal */}
      {saveTemplateOpen && (
        <SaveTemplateModal
          clientName={client.name}
          tasks={clientTasks}
          onClose={() => setSaveTemplateOpen(false)}
          onSaved={name => {
            setTemplateSavedName(name)
            setTimeout(() => setTemplateSavedName(null), 5000)
          }}
        />
      )}
    </div>
  )
}
