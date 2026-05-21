import { useState } from 'react'
import { ChevronRight, ChevronDown, Plus, Trash2, FileText, Search } from 'lucide-react'
import type { Document } from '../../hooks/useDocuments'
import type { Database } from '../../types/database.types'

type Client = Database['public']['Tables']['clients']['Row']

interface DocumentSidebarProps {
  documents: Document[]
  selectedId: string | null
  onSelect: (id: string) => void
  onAdd: (parentId?: string | null) => void
  onDelete: (id: string) => void
  clients: Client[]
  filterClientId: string | null
  onFilterChange: (clientId: string | null) => void
}

interface TreeItemProps {
  doc: Document
  depth: number
  allDocs: Document[]
  selectedId: string | null
  onSelect: (id: string) => void
  onAdd: (parentId: string) => void
  onDelete: (id: string) => void
}

function TreeItem({ doc, depth, allDocs, selectedId, onSelect, onAdd, onDelete }: TreeItemProps) {
  const children = allDocs.filter(d => d.parent_id === doc.id)
  const [expanded, setExpanded] = useState(false)
  const isSelected = selectedId === doc.id

  return (
    <div>
      <div
        className={`group flex items-center gap-1 rounded-radius-sm transition-colors cursor-pointer ${
          isSelected ? 'bg-accent-light text-accent' : 'hover:bg-bg-app text-text-secondary hover:text-text-primary'
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px`, paddingRight: '8px', paddingTop: '6px', paddingBottom: '6px' }}
      >
        <button
          className={`w-4 h-4 shrink-0 flex items-center justify-center rounded transition-colors ${children.length === 0 ? 'opacity-0 pointer-events-none' : 'hover:bg-border'}`}
          onClick={e => { e.stopPropagation(); setExpanded(v => !v) }}
        >
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </button>

        <button
          className="flex items-center gap-1.5 flex-1 min-w-0 text-left"
          onClick={() => onSelect(doc.id)}
        >
          <span className="text-sm shrink-0">{doc.icon ?? '📄'}</span>
          <span className="text-small truncate font-medium">{doc.title || 'Sem título'}</span>
        </button>

        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 shrink-0 transition-opacity">
          <button
            onClick={e => { e.stopPropagation(); onAdd(doc.id) }}
            className="w-5 h-5 flex items-center justify-center rounded hover:bg-accent-light hover:text-accent transition-colors"
            title="Nova subpágina"
          >
            <Plus size={11} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onDelete(doc.id) }}
            className="w-5 h-5 flex items-center justify-center rounded hover:bg-status-red/10 hover:text-status-red transition-colors"
            title="Excluir"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>

      {expanded && children.map(child => (
        <TreeItem
          key={child.id}
          doc={child}
          depth={depth + 1}
          allDocs={allDocs}
          selectedId={selectedId}
          onSelect={onSelect}
          onAdd={onAdd}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}

export function DocumentSidebar({
  documents,
  selectedId,
  onSelect,
  onAdd,
  onDelete,
  clients,
  filterClientId,
  onFilterChange,
}: DocumentSidebarProps) {
  const [search, setSearch] = useState('')

  const rootDocs = documents.filter(d => d.parent_id === null)
  const filteredRoots = search
    ? documents.filter(d => d.title.toLowerCase().includes(search.toLowerCase()))
    : rootDocs

  return (
    <div className="w-[260px] shrink-0 h-full flex flex-col border-r border-border bg-bg-surface">
      {/* Header */}
      <div className="px-4 py-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <span className="text-section font-semibold text-text-primary">Documentos</span>
          <button
            onClick={() => onAdd(null)}
            className="w-7 h-7 flex items-center justify-center rounded-radius-sm bg-accent text-white hover:bg-accent-hover transition-colors"
            title="Novo documento"
          >
            <Plus size={14} />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Pesquisar documentos..."
            className="w-full pl-7 pr-3 py-1.5 text-small bg-bg-app border border-border rounded-radius-sm outline-none focus:border-accent transition-colors placeholder:text-text-tertiary"
          />
        </div>
      </div>

      {/* Client filter */}
      <div className="px-4 py-2 border-b border-border">
        <select
          value={filterClientId ?? ''}
          onChange={e => onFilterChange(e.target.value || null)}
          className="w-full text-small bg-bg-app border border-border rounded-radius-sm px-2 py-1.5 outline-none focus:border-accent transition-colors text-text-secondary"
        >
          <option value="">Todos os clientes</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Document tree */}
      <div className="flex-1 overflow-y-auto py-2 px-2">
        {filteredRoots.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <FileText size={32} className="text-text-tertiary mb-3 opacity-40" />
            <p className="text-small text-text-tertiary">
              {search ? 'Nenhum documento encontrado' : 'Nenhum documento ainda'}
            </p>
            {!search && (
              <button
                onClick={() => onAdd(null)}
                className="mt-3 text-small text-accent hover:underline font-medium"
              >
                Criar primeiro documento
              </button>
            )}
          </div>
        ) : (
          filteredRoots.map(doc => (
            <TreeItem
              key={doc.id}
              doc={doc}
              depth={0}
              allDocs={documents}
              selectedId={selectedId}
              onSelect={onSelect}
              onAdd={onAdd}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </div>
  )
}
