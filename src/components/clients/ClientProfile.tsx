import { useEffect, useRef, useState } from 'react'
import {
  Mail, Phone, MapPin, FileText, Edit3, Trash2,
  CheckSquare, BookOpen, ImageIcon, Plus, Download,
  X, Clock, AlertCircle, CheckCircle2, Circle, UploadCloud,
  ExternalLink, Building2, Globe, Lock, Link2, Film
} from 'lucide-react'
import { TaskModal } from '../dashboard/TaskModal'
import { format, isToday, isTomorrow, isPast, differenceInCalendarDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useClientFiles } from '../../hooks/useClientFiles'
import { DocumentEditor } from '../documents/DocumentEditor'
import type { Database } from '../../types/database.types'
import { useDocuments } from '../../hooks/useDocuments'
import { useClients } from '../../hooks/useClients'
import { ClientTasksTab } from './ClientTasksTab'

type Client = Database['public']['Tables']['clients']['Row']
type Task = Database['public']['Tables']['tasks']['Row']

interface ClientProfileProps {
  client: Client
  tasks: Task[]
  onEdit: () => void
  onDelete: () => void
  onNavigateToDoc: (docId: string) => void
  addTask?: (payload: any) => Promise<any>
  updateTask: (id: string, payload: any) => Promise<void>
  removeTask: (id: string) => Promise<void>
}

type Tab = 'overview' | 'tasks' | 'docs' | 'media'

const STATUS_CONFIG = {
  'A fazer': { color: 'text-status-blue bg-status-blue/10 border-status-blue/20', icon: Circle },
  'Fazendo': { color: 'text-status-orange bg-status-orange/10 border-status-orange/20', icon: Clock },
  'Concluído': { color: 'text-accent bg-accent-light border-accent/20', icon: CheckCircle2 },
  'Atrasado': { color: 'text-status-red bg-status-red/10 border-status-red/20', icon: AlertCircle },
}



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
    <div className="flex gap-[2px] items-end" title={priority === 3 ? 'Alta' : priority === 2 ? 'Média' : 'Baixa'}>
      <div className={`w-[3px] h-1.5 rounded-full ${priority >= 1 ? (priority === 1 ? 'bg-status-yellow' : priority === 2 ? 'bg-status-orange' : 'bg-status-red') : 'bg-border'}`} />
      <div className={`w-[3px] h-2.5 rounded-full ${priority >= 2 ? (priority === 2 ? 'bg-status-orange' : 'bg-status-red') : 'bg-border'}`} />
      <div className={`w-[3px] h-3.5 rounded-full ${priority === 3 ? 'bg-status-red' : 'bg-border'}`} />
    </div>
  )
}

function FileCard({ name, onDelete, getUrl }: { name: string; clientId: string; onDelete: () => void; getUrl: () => string }) {
  const url = getUrl()
  const isImage = /\.(jpe?g|png|gif|webp|svg|avif)$/i.test(name)
  const isVideo = /\.(mp4|mov|avi|webm|mkv)$/i.test(name)
  const isPDF = /\.pdf$/i.test(name)
  const displayName = name.replace(/^\d+_/, '')
  const short = displayName.length > 28 ? displayName.slice(0, 26) + '…' : displayName

  return (
    <div className="group relative bg-bg-surface border border-border rounded-radius-md overflow-hidden hover:shadow-raised transition-shadow">
      {isImage ? (
        <a href={url} target="_blank" rel="noopener noreferrer">
          <img src={url} alt={displayName} className="w-full h-28 object-cover bg-bg-app" />
        </a>
      ) : isVideo ? (
        <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center h-28 bg-bg-app hover:bg-bg-surface-raised transition-colors">
          <Film size={32} className="text-status-blue opacity-50" />
        </a>
      ) : (
        <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center h-28 bg-bg-app hover:bg-bg-surface-raised transition-colors">
          <FileText size={32} className={isPDF ? 'text-status-red opacity-60' : 'text-text-tertiary opacity-40'} />
        </a>
      )}
      <div className="px-2.5 py-2 flex items-center justify-between gap-2">
        <span className="text-[11px] text-text-secondary truncate" title={displayName}>{short}</span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <a href={url} download={displayName} className="p-1 rounded hover:bg-bg-app text-text-tertiary hover:text-accent transition-colors">
            <Download size={12} />
          </a>
          <button onClick={onDelete} className="p-1 rounded hover:bg-status-red/10 text-text-tertiary hover:text-status-red transition-colors">
            <X size={12} />
          </button>
        </div>
      </div>
    </div>
  )
}

export function ClientProfile({ client, tasks, onEdit, onDelete, onNavigateToDoc, addTask, updateTask, removeTask }: ClientProfileProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [editingTask, setEditingTask] = useState<Task | null | false>(false)
  const [openDocId, setOpenDocId] = useState<string | null>(null)
  const [linkDocOpen, setLinkDocOpen] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { clients: allClients } = useClients()
  const { documents, addDocument, updateDocument, generateShareToken, revokeShareToken } = useDocuments()
  const { files, loading: filesLoading, fetchFiles, uploadFile, deleteFile, getPublicUrl } = useClientFiles()

  const clientTasks = tasks.filter(t => t.client_id === client.id)
  const clientDocs = documents.filter(d => d.client_id === client.id)
  const unlinkedDocs = documents.filter(d => !d.client_id)

  useEffect(() => {
    if (activeTab === 'media') fetchFiles(client.id)
  }, [activeTab, client.id, fetchFiles])

  useEffect(() => {
    setEditingTask(false)
    setOpenDocId(null)
    setUploadError(null)
  }, [client.id])

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList?.length) return
    setUploading(true)
    setUploadError(null)
    try {
      for (const file of Array.from(fileList)) {
        await uploadFile(client.id, file)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setUploadError(msg)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleCreateDoc = async () => {
    try {
      const doc = await addDocument(null, client.id)
      if (doc) setOpenDocId(doc.id)
    } catch (err) {
      console.error('Erro ao criar documento:', err)
    }
  }

  const handleLinkDoc = async (docId: string) => {
    await updateDocument(docId, { client_id: client.id })
    setLinkDocOpen(false)
  }

  const openDoc = documents.find(d => d.id === openDocId) ?? null

  const tabs: { id: Tab; label: string; icon: typeof CheckSquare; count?: number }[] = [
    { id: 'overview', label: 'Visão Geral', icon: Building2 },
    { id: 'tasks', label: 'Tarefas', icon: CheckSquare, count: clientTasks.filter(t => t.status !== 'Concluído').length },
    { id: 'docs', label: 'Documentos', icon: BookOpen, count: clientDocs.length },
    { id: 'media', label: 'Mídia', icon: ImageIcon, count: files.length },
  ]

  return (
    <div className="flex-1 flex flex-col h-full bg-bg-app overflow-hidden">
      {/* ── Profile Header ── */}
      <div className="shrink-0">
        {/* Faixa colorida: nome + botões + contatos */}
        <div className="px-6 pt-5 pb-4 border-b" style={{ background: `linear-gradient(135deg, ${client.color}18 0%, ${client.color}06 100%)`, borderColor: `${client.color}30` }}>
          <div className="flex items-end justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-radius-md border-2 border-bg-surface shadow-raised" style={{ backgroundColor: client.color }} />
              <div>
                <h2 className="text-section font-bold text-text-primary leading-tight">{client.name}</h2>
                {client.description && (
                  <p className="text-small text-text-tertiary mt-0.5 line-clamp-1 max-w-md">{client.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={onEdit} className="flex items-center gap-1.5 px-3 py-1.5 text-small text-text-secondary hover:text-text-primary bg-bg-app border border-border rounded-radius-sm hover:border-accent/50 transition-colors">
                <Edit3 size={13} /> Editar
              </button>
              <button onClick={onDelete} className="flex items-center gap-1.5 px-3 py-1.5 text-small text-status-red bg-status-red/5 border border-status-red/20 rounded-radius-sm hover:bg-status-red/10 transition-colors">
                <Trash2 size={13} /> Excluir
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-3">
            {client.email && (
              <a href={`mailto:${client.email}`} className="flex items-center gap-1.5 text-small text-text-tertiary hover:text-accent transition-colors">
                <Mail size={12} /> {client.email}
              </a>
            )}
            {client.phone && (
              <span className="flex items-center gap-1.5 text-small text-text-tertiary">
                <Phone size={12} /> {client.phone}
              </span>
            )}
            {client.document && (
              <span className="flex items-center gap-1.5 text-mono text-small text-text-tertiary">
                {client.document}
              </span>
            )}
          </div>
        </div>
        {/* Barra de abas — fundo branco */}
        <div className="bg-bg-surface border-b border-border px-6 flex items-center gap-0">
          {tabs.map(tab => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-small font-medium border-b-2 transition-colors ${
                  active ? 'border-accent text-accent' : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
                }`}
              >
                <Icon size={13} />
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${active ? 'bg-accent text-white' : 'bg-bg-app text-text-tertiary'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Tab Content ── */}
      <div className="flex-1 overflow-y-auto">

        {/* ── VISÃO GERAL ── */}
        {activeTab === 'overview' && (
          <div className="p-6 grid grid-cols-3 gap-5 max-w-5xl">
            <div className="col-span-2 space-y-5">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Tarefas ativas', value: clientTasks.filter(t => t.status !== 'Concluído').length, color: client.color, sub: `${clientTasks.filter(t => t.status === 'Atrasado').length} atrasadas` },
                  { label: 'Concluídas', value: clientTasks.filter(t => t.status === 'Concluído').length, color: '#1A9E6E', sub: `de ${clientTasks.length} total` },
                  { label: 'Documentos', value: clientDocs.length, color: '#3B82F6', sub: 'neste cliente' },
                ].map(stat => (
                  <div key={stat.label} className="bg-bg-surface rounded-radius-md border border-border p-4 shadow-card">
                    <div className="text-2xl font-display font-bold mb-1" style={{ color: stat.color }}>{stat.value}</div>
                    <div className="text-small font-medium text-text-primary">{stat.label}</div>
                    <div className="text-[11px] text-text-tertiary mt-0.5">{stat.sub}</div>
                  </div>
                ))}
              </div>

              {clientTasks.length > 0 && (
                <div className="bg-bg-surface rounded-radius-md border border-border shadow-card overflow-hidden">
                  <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                    <span className="text-label font-semibold text-text-secondary uppercase tracking-wide">Tarefas Recentes</span>
                    <button onClick={() => setActiveTab('tasks')} className="text-small text-accent hover:underline">Ver todas →</button>
                  </div>
                  <div className="divide-y divide-border/50">
                    {clientTasks.slice(0, 4).map(task => {
                      const cfg = STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG['A fazer']
                      return (
                        <button key={task.id} onClick={() => setEditingTask(task)} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-bg-app transition-colors text-left">
                          <PriorityBars priority={task.priority} />
                          <span className="flex-1 text-small text-text-primary truncate">{task.title}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${cfg.color}`}>{task.status}</span>
                          <DeadlineBadge deadline={task.deadline} isDone={task.is_done} />
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {clientDocs.length > 0 && (
                <div className="bg-bg-surface rounded-radius-md border border-border shadow-card overflow-hidden">
                  <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                    <span className="text-label font-semibold text-text-secondary uppercase tracking-wide">Documentos Recentes</span>
                    <button onClick={() => setActiveTab('docs')} className="text-small text-accent hover:underline">Ver todos →</button>
                  </div>
                  <div className="divide-y divide-border/50">
                    {clientDocs.slice(0, 3).map(doc => (
                      <button key={doc.id} onClick={() => { setActiveTab('docs'); setOpenDocId(doc.id) }} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-bg-app transition-colors text-left">
                        <span className="text-sm">{doc.icon ?? '📄'}</span>
                        <span className="flex-1 text-small text-text-primary truncate">{doc.title}</span>
                        <span className="text-[11px] text-text-tertiary shrink-0">
                          {format(new Date(doc.updated_at), 'dd/MM', { locale: ptBR })}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="bg-bg-surface rounded-radius-md border border-border shadow-card p-4">
                <h4 className="text-label font-semibold text-text-secondary uppercase tracking-wide mb-3">Informações</h4>
                <div className="space-y-3">
                  {client.email && (
                    <div>
                      <div className="text-[10px] text-text-tertiary uppercase tracking-wide mb-0.5">E-mail</div>
                      <a href={`mailto:${client.email}`} className="text-small text-accent hover:underline flex items-center gap-1.5">
                        <Mail size={12} /> {client.email}
                      </a>
                    </div>
                  )}
                  {client.phone && (
                    <div>
                      <div className="text-[10px] text-text-tertiary uppercase tracking-wide mb-0.5">Telefone</div>
                      <span className="text-small text-text-secondary flex items-center gap-1.5">
                        <Phone size={12} /> {client.phone}
                      </span>
                    </div>
                  )}
                  {client.document && (
                    <div>
                      <div className="text-[10px] text-text-tertiary uppercase tracking-wide mb-0.5">CPF / CNPJ</div>
                      <span className="text-mono text-small text-text-secondary">{client.document}</span>
                    </div>
                  )}
                  {client.address && (
                    <div>
                      <div className="text-[10px] text-text-tertiary uppercase tracking-wide mb-0.5">Endereço</div>
                      <span className="text-small text-text-secondary flex items-start gap-1.5">
                        <MapPin size={12} className="shrink-0 mt-0.5" /> {client.address}
                      </span>
                    </div>
                  )}
                  {!client.email && !client.phone && !client.document && !client.address && (
                    <p className="text-small text-text-tertiary italic">Nenhuma informação de contato cadastrada.</p>
                  )}
                </div>
              </div>
              {client.description && (
                <div className="bg-bg-surface rounded-radius-md border border-border shadow-card p-4">
                  <h4 className="text-label font-semibold text-text-secondary uppercase tracking-wide mb-2">Descrição</h4>
                  <p className="text-small text-text-secondary leading-relaxed">{client.description}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAREFAS ── */}
        {activeTab === 'tasks' && (
          <ClientTasksTab
            client={client}
            tasks={tasks}
            addTask={addTask}
            updateTask={updateTask}
            removeTask={removeTask}
          />
        )}

        {/* ── DOCUMENTOS ── */}
        {activeTab === 'docs' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-section font-semibold text-text-primary">
                {clientDocs.length} {clientDocs.length === 1 ? 'documento' : 'documentos'}
              </h3>
              <div className="flex items-center gap-2">
                {unlinkedDocs.length > 0 && (
                  <button
                    onClick={() => setLinkDocOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-bg-surface text-text-secondary border border-border rounded-radius-sm text-small font-semibold hover:border-accent/50 hover:text-text-primary transition-colors"
                  >
                    <Link2 size={14} /> Vincular existente
                  </button>
                )}
                <button
                  onClick={handleCreateDoc}
                  className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-radius-sm text-small font-semibold hover:bg-accent-hover transition-colors"
                >
                  <Plus size={14} /> Novo Documento
                </button>
              </div>
            </div>

            {clientDocs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <BookOpen size={36} className="text-text-tertiary opacity-25 mb-3" />
                <p className="text-body text-text-tertiary mb-4">Nenhum documento para este cliente ainda.</p>
                <div className="flex items-center gap-3">
                  {unlinkedDocs.length > 0 && (
                    <button onClick={() => setLinkDocOpen(true)} className="flex items-center gap-1.5 text-small text-text-secondary hover:text-text-primary font-medium border border-border px-3 py-1.5 rounded-radius-sm hover:border-accent/50 transition-colors">
                      <Link2 size={12} /> Vincular documento ({unlinkedDocs.length})
                    </button>
                  )}
                  <button onClick={handleCreateDoc} className="text-small text-accent hover:underline font-medium">Criar primeiro documento</button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3 max-w-4xl">
                {clientDocs.map(doc => (
                  <button
                    key={doc.id}
                    onClick={() => setOpenDocId(doc.id)}
                    className="bg-bg-surface border border-border rounded-radius-md p-4 text-left hover:shadow-raised hover:border-accent/30 transition-all group"
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <span className="text-xl">{doc.icon ?? '📄'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-small font-semibold text-text-primary truncate group-hover:text-accent transition-colors">{doc.title || 'Sem título'}</p>
                        <p className="text-[11px] text-text-tertiary mt-0.5">
                          {format(new Date(doc.updated_at), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {doc.is_public ? (
                        <span className="flex items-center gap-1 text-[10px] text-accent font-medium"><Globe size={10} /> Público</span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] text-text-tertiary"><Lock size={10} /> Privado</span>
                      )}
                      <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span
                          role="button"
                          title="Abrir na página de Docs"
                          onClick={e => { e.stopPropagation(); onNavigateToDoc(doc.id) }}
                          className="p-0.5 rounded hover:bg-bg-app text-text-tertiary hover:text-accent transition-colors cursor-pointer"
                        >
                          <BookOpen size={11} />
                        </span>
                        <ExternalLink size={10} className="text-text-tertiary" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── MÍDIA ── */}
        {activeTab === 'media' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-section font-semibold text-text-primary">
                {files.length} {files.length === 1 ? 'arquivo' : 'arquivos'}
              </h3>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-radius-sm text-small font-semibold hover:bg-accent-hover disabled:opacity-60 transition-colors"
              >
                <UploadCloud size={14} /> {uploading ? 'Enviando...' : 'Enviar Arquivo'}
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip,.rar"
              className="hidden"
              onChange={e => handleUpload(e.target.files)}
            />

            {/* Error banner */}
            {uploadError && (
              <div className="mb-4 px-4 py-3 bg-status-red/10 border border-status-red/30 rounded-radius-sm flex items-start gap-3">
                <AlertCircle size={15} className="text-status-red shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-small font-semibold text-status-red">Erro no upload</p>
                  <p className="text-[11px] text-status-red/80 mt-0.5 break-words">{uploadError}</p>
                  <p className="text-[11px] text-text-tertiary mt-1.5">
                    Verifique se o bucket <code className="font-mono bg-bg-app px-1 rounded border border-border">clients-files</code> existe no Supabase Storage com acesso público habilitado.
                  </p>
                </div>
                <button onClick={() => setUploadError(null)} className="text-status-red/50 hover:text-status-red shrink-0">
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setIsDragOver(true) }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={e => { e.preventDefault(); setIsDragOver(false); handleUpload(e.dataTransfer.files) }}
              onClick={() => !uploading && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-radius-md transition-all mb-5 cursor-pointer ${
                isDragOver
                  ? 'border-accent bg-accent-light'
                  : 'border-border hover:border-accent/50 hover:bg-bg-surface-raised/50'
              } ${files.length === 0 ? 'p-10 flex flex-col items-center justify-center' : 'py-3 flex items-center justify-center'}`}
            >
              {files.length === 0 ? (
                <>
                  <UploadCloud size={36} className={`mb-3 transition-colors ${isDragOver ? 'text-accent' : 'text-text-tertiary opacity-30'}`} />
                  <p className="text-body text-text-secondary font-medium">
                    {uploading ? 'Enviando arquivos...' : 'Arraste arquivos ou clique para enviar'}
                  </p>
                  <p className="text-small text-text-tertiary mt-1.5">Imagens, vídeos, PDFs, planilhas, contratos…</p>
                </>
              ) : (
                <p className="text-small text-text-tertiary">
                  {isDragOver ? '📂 Solte para adicionar' : uploading ? 'Enviando...' : '+ Arraste mais arquivos aqui'}
                </p>
              )}
            </div>

            {filesLoading ? (
              <div className="flex items-center justify-center py-12 gap-2 text-text-tertiary">
                <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                <span className="text-small">Carregando arquivos...</span>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-3 max-w-4xl">
                {files.map(file => (
                  <FileCard
                    key={file.id}
                    name={file.name}
                    clientId={client.id}
                    onDelete={async () => {
                      try { await deleteFile(client.id, file.name) }
                      catch (err) { console.error(err) }
                    }}
                    getUrl={() => getPublicUrl(client.id, file.name)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Task Edit Modal (overview tab) ── */}
      {editingTask !== false && editingTask !== null && (
        <TaskModal
          task={editingTask}
          clients={allClients}
          onClose={() => setEditingTask(false)}
          onDelete={async () => { await removeTask(editingTask.id); setEditingTask(false) }}
          onSave={async payload => { await updateTask(editingTask.id, payload) }}
        />
      )}

      {/* ── Link Document Modal ── */}
      {linkDocOpen && (
        <div className="fixed inset-0 z-[99999] bg-black/40 flex items-center justify-center p-4" onClick={() => setLinkDocOpen(false)}>
          <div className="bg-bg-surface rounded-radius-md shadow-modal w-full max-w-md animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-section font-bold text-text-primary flex items-center gap-2">
                <Link2 size={16} className="text-accent" /> Vincular Documento
              </h3>
              <button onClick={() => setLinkDocOpen(false)} className="p-1.5 rounded hover:bg-bg-app text-text-tertiary">
                <X size={16} />
              </button>
            </div>
            <p className="px-6 pt-3 pb-1 text-small text-text-tertiary">
              Selecione um documento sem cliente associado para vinculá-lo a <strong className="text-text-primary">{client.name}</strong>.
            </p>
            <div className="px-2 py-2 max-h-72 overflow-y-auto">
              {unlinkedDocs.length === 0 ? (
                <p className="text-small text-text-tertiary text-center py-8 italic">Nenhum documento sem cliente.</p>
              ) : (
                <div className="divide-y divide-border/50">
                  {unlinkedDocs.map(doc => (
                    <button
                      key={doc.id}
                      onClick={() => handleLinkDoc(doc.id)}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-bg-app rounded transition-colors text-left"
                    >
                      <span className="text-lg">{doc.icon ?? '📄'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-small font-medium text-text-primary truncate">{doc.title || 'Sem título'}</p>
                        <p className="text-[11px] text-text-tertiary">
                          {format(new Date(doc.updated_at), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      <span className="text-[10px] text-accent font-semibold shrink-0">Vincular →</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="px-6 py-3 border-t border-border bg-bg-surface-raised rounded-b-radius-md flex justify-end">
              <button onClick={() => setLinkDocOpen(false)} className="px-4 py-1.5 text-small text-text-secondary hover:text-text-primary transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Document Editor Modal ── */}
      {openDoc && (
        <div className="fixed inset-0 z-[99999] bg-black/40 flex items-center justify-center p-4">
          <div className="bg-bg-surface rounded-radius-md shadow-modal w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-3 border-b border-border shrink-0 bg-bg-surface-raised">
              <div className="flex items-center gap-2 text-small text-text-tertiary">
                <span className="text-sm">{openDoc.icon ?? '📄'}</span>
                <span className="font-medium text-text-primary">{openDoc.title || 'Sem título'}</span>
              </div>
              <button onClick={() => setOpenDocId(null)} className="p-1.5 rounded hover:bg-bg-app text-text-secondary transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <DocumentEditor
                document={openDoc}
                allDocuments={documents}
                onUpdate={updateDocument}
                clients={[client]}
                onGenerateShare={generateShareToken}
                onRevokeShare={revokeShareToken}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
