import { useState } from 'react'
import { useClients } from '../../hooks/useClients'
import { useTasks } from '../../hooks/useTasks'
import { Plus, Users, X, MapPin, Search, Building2, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import type { Database } from '../../types/database.types'
import { ClientProfile } from './ClientProfile'

type Client = Database['public']['Tables']['clients']['Row']

const COLORS = ['#4FFFB0', '#FF4444', '#FFAA00', '#4488FF', '#AA44FF', '#FF007F']

interface ClientsPageProps {
  onNavigateToDoc: (docId: string) => void
}

export function ClientsPage({ onNavigateToDoc }: ClientsPageProps) {
  const { clients, loading, addClient, removeClient, updateClient } = useClients()
  const { tasks, addTask } = useTasks()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editingClient, setEditingClient] = useState<Partial<Client> | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const filtered = clients.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
  const selectedClient = clients.find(c => c.id === selectedId) ?? null

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingClient?.name) return
    setSubmitting(true)
    try {
      if (editingClient.id) {
        await updateClient(editingClient.id, {
          name: editingClient.name,
          color: editingClient.color,
          email: editingClient.email,
          phone: editingClient.phone,
          document: editingClient.document,
          address: editingClient.address,
          description: editingClient.description
        })
      } else {
        const created = await addClient({
          name: editingClient.name,
          color: editingClient.color || COLORS[0],
          email: editingClient.email ?? null,
          phone: editingClient.phone ?? null,
          document: editingClient.document ?? null,
          address: editingClient.address ?? null,
          description: editingClient.description ?? null
        })
        if (created?.[0]?.id) setSelectedId(created[0].id)
      }
      setEditingClient(null)
    } catch (err) {
      console.error(err)
      alert('Erro ao salvar cliente.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Excluir permanentemente este cliente e seus dados?')) return
    await removeClient(id)
    if (selectedId === id) setSelectedId(null)
  }

  return (
    <main className="flex-1 h-screen overflow-hidden flex bg-bg-app animate-in fade-in duration-300">
      {/* ── Left Sidebar ── */}
      <aside className={`${sidebarCollapsed ? 'w-[48px]' : 'w-[272px]'} shrink-0 bg-bg-surface border-r border-border flex flex-col h-full transition-all duration-200 overflow-hidden`}>
        {sidebarCollapsed ? (
          /* Collapsed state — just color dots + expand button */
          <div className="flex flex-col items-center py-4 gap-3">
            <button
              onClick={() => setSidebarCollapsed(false)}
              title="Expandir menu"
              className="w-8 h-8 flex items-center justify-center rounded-radius-sm text-text-tertiary hover:text-text-primary hover:bg-bg-app transition-colors"
            >
              <PanelLeftOpen size={15} />
            </button>
            <div className="w-full border-t border-border my-1" />
            {filtered.map(c => (
              <button
                key={c.id}
                onClick={() => { setSidebarCollapsed(false); setSelectedId(c.id) }}
                title={c.name}
                className={`w-7 h-7 rounded-full border-2 shrink-0 transition-all ${c.id === selectedId ? 'border-accent scale-110' : 'border-bg-surface hover:scale-110'}`}
                style={{ backgroundColor: c.color }}
              />
            ))}
          </div>
        ) : (
          <>
            {/* Sidebar header */}
            <div className="px-4 pt-5 pb-3 shrink-0">
              <div className="flex items-center justify-between mb-3">
                <h1 className="text-section font-bold text-text-primary flex items-center gap-2">
                  <Users size={16} className="text-accent" /> Clientes
                </h1>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setSidebarCollapsed(true)}
                    title="Colapsar menu"
                    className="w-7 h-7 flex items-center justify-center rounded-radius-sm text-text-tertiary hover:text-text-primary hover:bg-bg-app transition-colors"
                  >
                    <PanelLeftClose size={14} />
                  </button>
                  <button
                    onClick={() => setEditingClient({ color: COLORS[0] })}
                    title="Novo Cliente"
                    className="w-7 h-7 flex items-center justify-center rounded-radius-sm bg-accent text-white hover:bg-accent-hover transition-colors shadow-card"
                  >
                    <Plus size={14} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-bg-app border border-border rounded-radius-sm pl-8 pr-3 py-1.5 text-small focus:border-accent focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Client list */}
            <div className="flex-1 overflow-y-auto px-2 pb-4">
              {loading ? (
                <div className="flex items-center justify-center py-10 gap-2 text-text-tertiary">
                  <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <Users size={32} className="text-text-tertiary opacity-20 mb-2" />
                  <p className="text-small text-text-tertiary">
                    {searchTerm ? 'Nenhum resultado.' : 'Nenhum cliente cadastrado.'}
                  </p>
                </div>
              ) : (
                filtered.map(c => {
                  const active = c.id === selectedId
                  const activeTasks = tasks.filter(t => t.client_id === c.id && t.status !== 'Concluído').length
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedId(c.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-radius-sm mb-1 transition-colors flex items-center gap-3 group ${
                        active
                          ? 'bg-accent-light border border-accent/20'
                          : 'hover:bg-bg-surface-raised border border-transparent'
                      }`}
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: c.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`text-small font-medium truncate ${active ? 'text-accent' : 'text-text-primary'}`}>
                          {c.name}
                        </p>
                        {activeTasks > 0 && (
                          <p className="text-[10px] text-text-tertiary mt-0.5">
                            {activeTasks} {activeTasks === 1 ? 'tarefa ativa' : 'tarefas ativas'}
                          </p>
                        )}
                      </div>
                    </button>
                  )
                })
              )}
            </div>

            <div className="px-4 py-3 border-t border-border shrink-0">
              <p className="text-[10px] text-text-tertiary">
                {filtered.length} {filtered.length === 1 ? 'cliente' : 'clientes'}
              </p>
            </div>
          </>
        )}
      </aside>

      {/* ── Right Panel ── */}
      <div className="flex-1 overflow-hidden">
        {selectedClient ? (
          <ClientProfile
            client={selectedClient}
            tasks={tasks}
            onEdit={() => setEditingClient(selectedClient)}
            onDelete={() => handleDelete(selectedClient.id)}
            onNavigateToDoc={onNavigateToDoc}
            addTask={addTask}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-8 gap-4">
            <div className="w-16 h-16 rounded-radius-xl bg-bg-surface border border-border shadow-card flex items-center justify-center">
              <Users size={28} className="text-text-tertiary opacity-40" />
            </div>
            <div>
              <p className="text-body-lg text-text-secondary font-medium">Selecione um cliente</p>
              <p className="text-small text-text-tertiary mt-1">Escolha um cliente na lista para ver todos os detalhes.</p>
            </div>
            <button
              onClick={() => setEditingClient({ color: COLORS[0] })}
              className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-radius-sm text-small font-semibold hover:bg-accent-hover transition-colors shadow-card"
            >
              <Plus size={14} /> Novo Cliente
            </button>
          </div>
        )}
      </div>

      {/* ── Edit / Create Modal ── */}
      {editingClient && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[99998] flex items-center justify-center p-4">
          <div className="bg-bg-surface w-full max-w-[620px] rounded-radius-md shadow-modal border border-border flex flex-col animate-in zoom-in-95 duration-200">

            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0 bg-bg-surface-raised rounded-t-radius-md">
              <h2 className="text-section text-text-primary flex items-center gap-2 font-bold uppercase tracking-wide">
                <Building2 size={18} className="text-accent" />
                {editingClient.id ? 'Editar Cliente' : 'Novo Cliente'}
              </h2>
              <button onClick={() => setEditingClient(null)} className="text-text-tertiary hover:text-status-red p-1.5 rounded-full hover:bg-status-red/10 transition-colors">
                <X size={18} />
              </button>
            </div>

            <form id="client-form" onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">

              <div>
                <label className="text-label text-text-secondary block mb-1.5">RAZÃO SOCIAL *</label>
                <input
                  autoFocus required
                  type="text"
                  value={editingClient.name || ''}
                  onChange={e => setEditingClient({ ...editingClient, name: e.target.value })}
                  className="w-full bg-bg-app border border-border rounded-radius-sm px-3 py-2.5 text-body focus:border-accent focus:outline-none transition-colors"
                  placeholder="Nome da empresa ou cliente..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-label text-text-secondary block mb-1.5">E-MAIL</label>
                  <input
                    type="email"
                    value={editingClient.email || ''}
                    onChange={e => setEditingClient({ ...editingClient, email: e.target.value })}
                    className="w-full bg-bg-app border border-border rounded-radius-sm px-3 py-2.5 text-body focus:border-accent focus:outline-none transition-colors"
                    placeholder="contato@empresa.com"
                  />
                </div>
                <div>
                  <label className="text-label text-text-secondary block mb-1.5">TELEFONE / WHATSAPP</label>
                  <input
                    type="text"
                    value={editingClient.phone || ''}
                    onChange={e => setEditingClient({ ...editingClient, phone: e.target.value })}
                    className="w-full bg-bg-app border border-border rounded-radius-sm px-3 py-2.5 text-body focus:border-accent focus:outline-none transition-colors"
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>

              <div className="grid grid-cols-[1.5fr_1fr] gap-4">
                <div>
                  <label className="text-label text-text-secondary block mb-1.5">CPF / CNPJ</label>
                  <input
                    type="text"
                    value={editingClient.document || ''}
                    onChange={e => setEditingClient({ ...editingClient, document: e.target.value })}
                    className="w-full bg-bg-app border border-border rounded-radius-sm px-3 py-2.5 text-mono text-small focus:border-accent focus:outline-none transition-colors"
                    placeholder="00.000.000/0001-00"
                  />
                </div>
                <div>
                  <label className="text-label text-text-secondary block mb-1.5">COR</label>
                  <div className="flex gap-2 items-center h-[42px] px-2 bg-bg-app border border-border rounded-radius-sm">
                    {COLORS.map(c => (
                      <button
                        type="button"
                        key={c}
                        onClick={() => setEditingClient({ ...editingClient, color: c })}
                        className={`w-5 h-5 rounded border border-white/20 cursor-pointer ring-offset-bg-app transition-all ${
                          editingClient.color === c
                            ? 'ring-2 ring-offset-2 ring-accent scale-110 border-transparent'
                            : 'hover:scale-110 opacity-60 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-label text-text-secondary block mb-1.5">ENDEREÇO</label>
                <div className="relative">
                  <MapPin size={15} className="absolute left-3 top-[13px] text-text-tertiary" />
                  <input
                    type="text"
                    value={editingClient.address || ''}
                    onChange={e => setEditingClient({ ...editingClient, address: e.target.value })}
                    className="w-full bg-bg-app border border-border rounded-radius-sm pl-9 pr-3 py-2.5 text-body focus:border-accent focus:outline-none transition-colors"
                    placeholder="Logradouro, Nº, Bairro, Cidade..."
                  />
                </div>
              </div>

              <div>
                <label className="text-label text-text-secondary block mb-1.5">NOTAS / CONTEXTO</label>
                <textarea
                  value={editingClient.description || ''}
                  onChange={e => setEditingClient({ ...editingClient, description: e.target.value })}
                  className="w-full bg-bg-app border border-border rounded-radius-sm px-3 py-2.5 text-body focus:border-accent focus:outline-none transition-colors h-20 resize-none"
                  placeholder="Informações de contexto para o time..."
                />
              </div>
            </form>

            <div className="px-6 py-4 border-t border-border bg-bg-surface-raised flex justify-end gap-3 shrink-0 rounded-b-radius-md">
              <button
                type="button"
                onClick={() => setEditingClient(null)}
                className="px-4 py-2 text-small font-semibold text-text-secondary hover:text-text-primary hover:bg-bg-surface border border-transparent hover:border-border rounded-radius-sm transition-all"
              >
                Cancelar
              </button>
              <button
                disabled={submitting}
                type="submit"
                form="client-form"
                className="bg-accent text-white px-6 py-2 rounded-radius-sm font-bold text-small shadow-card hover:bg-accent-hover disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Salvando...' : editingClient.id ? 'Salvar Alterações' : 'Criar Cliente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
