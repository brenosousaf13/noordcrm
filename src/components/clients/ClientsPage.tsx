import { useState } from 'react'
import { useClients } from '../../hooks/useClients'
import { Plus, Users, X, Mail, Phone, MapPin, Search, Building2, UploadCloud, File, Trash2, Edit3, FileText } from 'lucide-react'
import type { Database } from '../../types/database.types'

type Client = Database['public']['Tables']['clients']['Row']

const COLORS = ['#4FFFB0', '#FF4444', '#FFAA00', '#4488FF', '#AA44FF', '#FF007F']

export function ClientsPage() {
  const { clients, loading, addClient, removeClient, updateClient } = useClients()
  const [searchTerm, setSearchTerm] = useState('')
  const [editingClient, setEditingClient] = useState<Partial<Client> | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const filtered = clients.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))

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
        await addClient({
          name: editingClient.name,
          color: editingClient.color || COLORS[0],
          email: editingClient.email ?? null,
          phone: editingClient.phone ?? null,
          document: editingClient.document ?? null,
          address: editingClient.address ?? null,
          description: editingClient.description ?? null
        })
      }
      setEditingClient(null)
    } catch (err) {
      console.error(err)
      alert("Erro ao salvar cliente.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex-1 p-6 h-screen overflow-hidden flex flex-col relative bg-bg-app animate-in fade-in duration-300">
      {/* Header */}
      <header className="flex justify-between items-end mb-6 shrink-0">
        <div>
          <h1 className="text-display text-text-primary mb-2 flex items-center gap-3">
             <Users size={28} className="text-accent" />
             Carteira de Clientes
          </h1>
          <p className="text-body text-text-secondary">Gerencie contatos, contratos e informações ricas dos clientes.</p>
        </div>
        <button 
          onClick={() => setEditingClient({ color: COLORS[0] })}
          className="bg-accent text-white px-5 py-2.5 rounded-radius-sm font-semibold flex items-center gap-2 hover:bg-accent-light transition-colors shadow-card"
        >
          <Plus size={18} strokeWidth={2.5}/> Adicionar Cliente
        </button>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 bg-bg-surface border border-border rounded-radius-md shadow-card flex flex-col relative overflow-hidden">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-bg-surface-raised/50">
          <div className="relative w-80">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input 
              type="text" 
              placeholder="Buscar clientes por nome..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-bg-surface border border-border rounded-radius-sm pl-9 pr-3 py-2 text-body focus:border-accent focus:outline-none transition-colors focus:shadow-raised"
            />
          </div>
          <div className="text-small text-text-tertiary font-medium">
            {filtered.length} {filtered.length === 1 ? 'cliente encontrado' : 'clientes encontrados'}
          </div>
        </div>

        {/* Table View */}
        <div className="flex-1 overflow-y-auto bg-bg-app/30">
          {loading ? (
             <div className="flex h-full items-center justify-center text-text-tertiary gap-2">
               <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
               Carregando banco de dados...
             </div>
          ) : filtered.length === 0 ? (
             <div className="flex flex-col h-full items-center justify-center text-text-tertiary gap-3">
               <Users size={48} className="opacity-20" />
               <p className="text-body-lg">Nenhum cliente encotrado.</p>
             </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-bg-surface sticky top-0 border-b border-border z-10 shadow-[0_1px_0_0_var(--border)]">
                <tr>
                  <th className="py-3 px-4 text-label text-text-tertiary font-semibold w-8"></th>
                  <th className="py-3 px-4 text-label text-text-tertiary font-semibold">Cliente & Resumo</th>
                  <th className="py-3 px-4 text-label text-text-tertiary font-semibold">Contatos Diretos</th>
                  <th className="py-3 px-4 text-label text-text-tertiary font-semibold">Registo Oficial</th>
                  <th className="py-3 px-4 text-label text-text-tertiary font-semibold w-24">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} className="border-b border-border/50 hover:bg-bg-surface-raised transition-colors group">
                    <td className="py-3 px-4 align-top pt-5">
                      <div className="w-4 h-4 rounded-sm border border-white/10 shadow-[0_0_8px_rgba(0,0,0,0.15)]" style={{ backgroundColor: c.color }} />
                    </td>
                    <td className="py-3 px-4 max-w-[280px]">
                      <p className="text-body font-bold text-text-primary">{c.name}</p>
                      {c.description ? (
                         <p className="text-small text-text-tertiary mt-1 line-clamp-2 leading-relaxed">{c.description}</p>
                      ) : (
                         <p className="text-small text-text-tertiary mt-1 italic opacity-50">Sem descrição adicional.</p>
                      )}
                    </td>
                    <td className="py-3 px-4 space-y-2 align-top pt-4">
                      {c.email && <div className="flex items-center gap-2 text-small text-text-secondary"><Mail size={13} className="text-text-tertiary"/> {c.email}</div>}
                      {c.phone && <div className="flex items-center gap-2 text-small text-text-secondary"><Phone size={13} className="text-text-tertiary"/> {c.phone}</div>}
                      {!c.email && !c.phone && <span className="text-small text-text-tertiary italic">Dados não informados</span>}
                    </td>
                    <td className="py-3 px-4 align-top pt-4">
                       {c.document 
                         ? <span className="text-mono text-small bg-bg-app px-2 py-1 rounded border border-border">{c.document}</span> 
                         : <span className="text-small text-text-tertiary">-</span>}
                       {c.address && <div className="flex items-start gap-1.5 text-[11px] text-text-tertiary mt-2 leading-tight max-w-[180px]"><MapPin size={12} className="shrink-0 mt-0.5"/> {c.address}</div>}
                    </td>
                    <td className="py-3 px-4 align-top pt-4">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setEditingClient(c)} className="p-1.5 text-text-secondary hover:text-accent hover:bg-accent-light rounded transition-colors" title="Editar Ficha">
                           <Edit3 size={16} strokeWidth={2} />
                        </button>
                        <button onClick={() => { if(window.confirm('Excluir permanentemente este cliente e suas notas?')) removeClient(c.id) }} className="p-1.5 text-text-secondary hover:text-status-red hover:bg-status-red/10 rounded transition-colors" title="Excluir Definitivo">
                           <Trash2 size={16} strokeWidth={2} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* OVERLAY MODAL: FORMULÁRIO EXTENDIDO */}
      {editingClient && (
        <div className="absolute inset-0 bg-bg-app/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           {/* Box gigante */}
           <div className="bg-bg-surface w-full max-w-[850px] h-fit max-h-[90vh] rounded-radius-md shadow-2xl border border-border flex flex-col animate-in zoom-in-95 duration-200">
             
             {/* Modal Header */}
             <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0 bg-bg-surface-raised">
               <h2 className="text-section text-text-primary flex items-center gap-2 font-bold uppercase tracking-wide">
                 <Building2 size={20} className="text-accent" />
                 {editingClient.id ? 'Ficha do Cliente' : 'Novo Cadastro'}
               </h2>
               <button onClick={() => setEditingClient(null)} className="text-text-tertiary hover:text-status-red p-1.5 rounded-full hover:bg-status-red/10 transition-colors"><X size={20}/></button>
             </div>

             {/* Modal Body: Grid 2 colunas */}
             <div className="flex-1 overflow-y-auto p-6 flex gap-8">
               
               {/* Lado Esquerdo: Form inputs principais */}
               <form id="client-form" onSubmit={handleSave} className="flex-1 space-y-5">
                 
                 <div>
                    <label className="text-label text-text-secondary block mb-1.5">COD / RAZÃO SOCIAL *</label>
                    <input autoFocus required type="text" value={editingClient.name || ''} onChange={e => setEditingClient({...editingClient, name: e.target.value})} className="w-full bg-bg-app border border-border rounded-radius-sm px-3 py-2.5 text-body focus:border-accent focus:outline-none transition-colors shadow-sm" placeholder="Nome da empresa..." />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="text-label text-text-secondary block mb-1.5">E-MAIL PRINCIPAL</label>
                      <input type="email" value={editingClient.email || ''} onChange={e => setEditingClient({...editingClient, email: e.target.value})} className="w-full bg-bg-app border border-border rounded-radius-sm px-3 py-2.5 text-body focus:border-accent focus:outline-none transition-colors shadow-sm" placeholder="contato@empresa.com" />
                   </div>
                   <div>
                      <label className="text-label text-text-secondary block mb-1.5">WHATSAPP / TELEFONE</label>
                      <input type="text" value={editingClient.phone || ''} onChange={e => setEditingClient({...editingClient, phone: e.target.value})} className="w-full bg-bg-app border border-border rounded-radius-sm px-3 py-2.5 text-body focus:border-accent focus:outline-none transition-colors shadow-sm" placeholder="(11) 99999-9999" />
                   </div>
                 </div>

                 <div className="grid grid-cols-[1.5fr_1fr] gap-4">
                   <div>
                      <label className="text-label text-text-secondary block mb-1.5">CPF / CNPJ</label>
                      <input type="text" value={editingClient.document || ''} onChange={e => setEditingClient({...editingClient, document: e.target.value})} className="w-full bg-bg-app border border-border rounded-radius-sm px-3 py-2.5 text-mono text-small focus:border-accent focus:outline-none transition-colors shadow-sm" placeholder="00.000.000/0001-00" />
                   </div>
                   <div>
                      <label className="text-label text-text-secondary block mb-1.5">COR DO CLIENTE</label>
                      <div className="flex gap-2 items-center h-[42px] px-2 bg-bg-app border border-border rounded-radius-sm shadow-sm">
                        {COLORS.map(c => (
                          <button type="button" key={c} onClick={() => setEditingClient({...editingClient, color: c})} className={`w-6 h-6 rounded border border-white/20 cursor-pointer ring-offset-bg-app transition-all ${editingClient.color === c ? 'ring-2 ring-offset-2 ring-accent scale-110 border-transparent' : 'hover:scale-110 opacity-60 hover:opacity-100'}`} style={{ backgroundColor: c }} />
                        ))}
                      </div>
                   </div>
                 </div>

                 <div>
                    <label className="text-label text-text-secondary block mb-1.5">ENDEREÇO OFICIAL</label>
                    <div className="relative shadow-sm">
                      <MapPin size={16} className="absolute left-3 top-[13px] text-text-tertiary" />
                      <input type="text" value={editingClient.address || ''} onChange={e => setEditingClient({...editingClient, address: e.target.value})} className="w-full bg-bg-app border border-border rounded-radius-sm pl-9 pr-3 py-2.5 text-body focus:border-accent focus:outline-none transition-colors" placeholder="Logradouro, Nº, Bairro, Cidade..." />
                    </div>
                 </div>

                 <div>
                    <label className="text-label text-text-secondary block mb-1.5">NOTAS EXTRAS / CONTEXTO</label>
                    <textarea value={editingClient.description || ''} onChange={e => setEditingClient({...editingClient, description: e.target.value})} className="w-full bg-bg-app border border-border rounded-radius-sm px-3 py-2.5 text-body focus:border-accent focus:outline-none transition-colors h-24 resize-none shadow-sm" placeholder="Informações de contexto para o time..." />
                 </div>

               </form>

               {/* Lado Direito: Storage / Arquivos */}
               <div className="w-[280px] shrink-0 border-l border-border pl-8 flex flex-col pt-1">
                  <div className="mb-4">
                    <h3 className="text-label text-text-secondary mb-1">MÍDIA (Aba Futura)</h3>
                    <p className="text-small text-text-tertiary leading-tight">Módulo de uploads e contratos Supabase entrará na Fase 2.</p>
                  </div>
                  
                  {/* Mock Visual (ainda síncrono com Storage) */}
                  <div className="border-2 border-dashed border-border rounded-radius-sm p-6 flex flex-col items-center justify-center text-center bg-bg-app/50 hover:bg-bg-app transition-colors hover:border-accent/50 cursor-pointer group mb-4">
                     <UploadCloud size={28} className="text-text-tertiary group-hover:text-accent mb-2 transition-colors" />
                     <span className="text-small font-semibold text-text-secondary group-hover:text-text-primary">Anexar Documento</span>
                     <span className="text-[10px] text-text-tertiary mt-1">Solte aqui o PDF ou Imagem</span>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2 opacity-50 pointer-events-none grayscale">
                     <div className="border border-border bg-bg-app p-2 rounded flex items-center justify-between">
                        <div className="flex items-center gap-2 overflow-hidden">
                           <FileText size={14} className="text-accent shrink-0" />
                           <span className="text-small text-text-secondary truncate">Contrato_Q3.pdf</span>
                        </div>
                     </div>
                     <div className="border border-border bg-bg-app p-2 rounded flex items-center justify-between">
                        <div className="flex items-center gap-2 overflow-hidden">
                           <File size={14} className="text-blue shrink-0" />
                           <span className="text-small text-text-secondary truncate">Brandbook.pdf</span>
                        </div>
                     </div>
                  </div>
               </div>
             </div>

             {/* Modal Footer */}
             <div className="px-6 py-4 border-t border-border bg-bg-surface-raised flex justify-end gap-3 shrink-0 rounded-b-radius-md">
               <button type="button" onClick={() => setEditingClient(null)} className="px-5 py-2 text-small font-semibold text-text-secondary hover:text-text-primary hover:bg-bg-surface border border-transparent hover:border-border rounded-radius-sm transition-all">Cancelar</button>
               <button disabled={submitting} type="submit" form="client-form" className="bg-accent text-white px-8 py-2 rounded-radius-sm font-bold text-small shadow-raised hover:opacity-90 disabled:opacity-50 transition-opacity">
                  {submitting ? 'Salvando...' : 'Gravar Ficha'}
               </button>
             </div>
           </div>
        </div>
      )}
    </main>
  )
}
