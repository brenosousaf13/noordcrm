import { useState, useMemo } from 'react'
import { FileText, Search, Plus, Trash2, Clock, X, Home } from 'lucide-react'
import { useNotes } from '../../hooks/useNotes'
import { RTE } from '../notes/RTE'
import type { Database } from '../../types/database.types'

type Client = Database['public']['Tables']['clients']['Row']

export function NotesPanel({ clients }: { clients: Client[] }) {
  const { notes, loading, addNote, updateNote, removeNote } = useNotes()
  const [searchTerm, setSearchTerm] = useState('')
  
  // V2 Tab Navigation State
  const [openedTabs, setOpenedTabs] = useState<string[]>([])
  const [activeTabId, setActiveTabId] = useState<string>('home') // 'home' or Note ID

  // Deep Search: Title OR JSON Content serialization
  const filtered = useMemo(() => {
    if (!searchTerm) return notes
    const lowerSearch = searchTerm.toLowerCase()
    return notes.filter(n => {
       if (n.title.toLowerCase().includes(lowerSearch)) return true
       if (n.content) {
          const rawString = JSON.stringify(n.content).toLowerCase()
          if (rawString.includes(lowerSearch)) return true
       }
       return false
    })
  }, [notes, searchTerm])

  const handleAddNew = async () => {
    try {
       const nova = await addNote()
       if(nova) {
          setOpenedTabs(prev => [...prev, nova.id])
          setActiveTabId(nova.id)
       }
    } catch(e) {
       console.error(e)
    }
  }

  const openNote = (id: string) => {
     if (!openedTabs.includes(id)) {
        setOpenedTabs(prev => [...prev, id])
     }
     setActiveTabId(id)
  }

  const closeTab = (e: React.MouseEvent, id: string) => {
     e.stopPropagation()
     setOpenedTabs(prev => prev.filter(tabId => tabId !== id))
     if (activeTabId === id) setActiveTabId('home')
  }

  const activeNote = useMemo(() => notes.find(n => n.id === activeTabId), [notes, activeTabId])

  return (
    <section className="bg-bg-surface border border-border rounded-radius-md shadow-card flex flex-col h-full min-h-0 relative z-10 w-full overflow-hidden">
      
      {/* V2 Header with Browser Tabs */}
      <header className="flex flex-col border-b border-border bg-bg-surface-raised shrink-0 relative z-20 sticky top-0">
        <div className="flex items-center justify-between px-2 pt-2 gap-2 overflow-x-auto scrollbar-hide">
           
           <div className="flex items-end gap-1 overflow-x-auto min-h-[36px]">
              {/* Home Tab */}
              <button 
                onClick={() => setActiveTabId('home')}
                className={`py-2 px-4 rounded-t-radius-md border border-b-0 flex items-center gap-2 transition-colors relative ${activeTabId === 'home' ? 'bg-bg-surface border-border !border-b-bg-surface text-accent font-bold z-10' : 'bg-transparent border-transparent text-text-secondary hover:bg-bg-app hover:text-text-primary'}`}
              >
                 <Home size={16} strokeWidth={2} />
                 <span className="text-small whitespace-nowrap">Central de Notas</span>
                 {activeTabId === 'home' && <div className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-bg-surface z-20" />}
              </button>

              {/* Opened Notes Tabs */}
              {openedTabs.map(tabId => {
                 const n = notes.find(nx => nx.id === tabId)
                 if (!n) return null
                 const isActive = activeTabId === tabId
                 return (
                    <div 
                      key={tabId} 
                      onClick={() => setActiveTabId(tabId)}
                      className={`py-2 pl-3 pr-2 rounded-t-radius-md border border-b-0 flex items-center gap-2 transition-colors relative cursor-pointer group max-w-[200px] ${isActive ? 'bg-bg-surface border-border !border-b-bg-surface text-text-primary font-bold z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]' : 'bg-transparent border-transparent text-text-secondary hover:bg-bg-app hover:text-text-primary'}`}
                    >
                       <span className="text-small truncate leading-none">{n.title || 'Sem título'}</span>
                       <button onClick={(e) => closeTab(e, tabId)} className="opacity-0 group-hover:opacity-100 hover:bg-border text-text-tertiary hover:text-text-primary rounded-sm p-0.5 transition-all">
                          <X size={12} strokeWidth={2.5}/>
                       </button>
                       {isActive && <div className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-bg-surface z-20" />}
                    </div>
                 )
              })}
           </div>

           <div className="pb-1 pr-2 shrink-0">
              <button onClick={handleAddNew} className="text-accent bg-accent/10 hover:bg-accent-light px-2.5 py-1.5 rounded-radius-sm transition-colors text-small font-semibold flex items-center gap-1.5 shadow-sm">
                <Plus size={14} strokeWidth={2.5} /> Nova Guia
              </button>
           </div>
        </div>
      </header>

      {/* Main Área (No more split view!) */}
      <div className="flex-1 overflow-hidden relative bg-bg-surface">
         
         {/* TAB: HOME LISTING */}
         {activeTabId === 'home' && (
            <div className="absolute inset-0 flex flex-col p-6 overflow-y-auto animate-in fade-in duration-200">
               
               <div className="max-w-3xl w-full mx-auto flex flex-col h-full">
                  <div className="mb-6 space-y-2">
                     <h2 className="text-h2 font-display font-bold text-text-primary flex items-center gap-2">
                        <FileText size={24} className="text-accent" /> Base de Conhecimento
                     </h2>
                     <p className="text-text-secondary text-body">Pesquise suas notas não apenas pelo título, mas também por qualquer palavra dentro delas (Deep Search V2).</p>
                  </div>

                  <div className="relative mb-8 shadow-sm">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" />
                    <input 
                       type="text" 
                       placeholder="Pesquise ideias profundas ou títulos crus..."
                       value={searchTerm}
                       onChange={e => setSearchTerm(e.target.value)}
                       className="w-full text-body pl-11 pr-4 py-3 bg-bg-app border border-border rounded-radius-md focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all placeholder:text-text-tertiary font-medium" 
                    />
                  </div>

                  <div className="flex flex-col gap-3 pb-8">
                     {loading && <div className="text-center p-8 text-text-tertiary animate-pulse">Buscando na base de dados...</div>}
                     {!loading && filtered.length === 0 && <div className="text-center p-12 text-text-tertiary bg-bg-app rounded-radius-md">Nenhuma anotação encontrada no sistema.</div>}

                     {filtered.map(note => {
                        const client = clients.find(c => c.id === note.client_id)
                        return (
                          <div 
                            key={note.id}
                            onClick={() => openNote(note.id)}
                            className="bg-bg-surface border border-border hover:border-accent/40 rounded-radius-md p-4 cursor-pointer hover:shadow-raised hover:-translate-y-[1px] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                          >
                             <div className="flex-1 overflow-hidden">
                                <h3 className="font-bold text-body-lg text-text-primary group-hover:text-accent transition-colors truncate">{note.title || 'Nota sem título registrado'}</h3>
                                <div className="flex items-center gap-3 mt-1.5 text-small text-text-tertiary">
                                   <span className="flex items-center gap-1"><Clock size={12}/> Atualizado em {format(new Date(note.updated_at), "d 'de' MMM, HH:mm", { locale: ptBR })}</span>
                                   {client && (
                                     <span className="flex items-center gap-1.5 font-medium text-text-secondary before:content-['•'] before:mr-1">
                                       <span className="w-2 h-2 rounded-full" style={{ backgroundColor: client.color }} /> {client.name}
                                     </span>
                                   )}
                                </div>
                             </div>
                             <div className="shrink-0 text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-small font-bold bg-accent/10 px-3 py-1.5 rounded-radius-sm">Abrir Nota</span>
                             </div>
                          </div>
                        )
                     })}
                  </div>
               </div>
            </div>
         )}


         {/* TAB: ACTIVE NOTE EDITOR FULL WIDTH */}
         {activeTabId !== 'home' && activeNote && (
            <div className="absolute inset-0 flex flex-col animate-in slide-in-from-right-4 duration-300">
               <div className="px-8 py-5 border-b border-border shrink-0 flex items-center justify-between bg-bg-surface-raised gap-4">
                  <div className="flex-1 max-w-2xl flex flex-col gap-2">
                     <input 
                       type="text"
                       className="text-display font-display font-bold bg-transparent border-none outline-none focus:ring-0 w-full text-text-primary placeholder:text-text-tertiary/50 leading-tight"
                       value={activeNote.title}
                       onChange={(e) => updateNote(activeNote.id, { title: e.target.value })}
                       placeholder="Cabeçalho da sua ideia inovadora..."
                     />
                     {/* V2 Client Linking Dropdown */}
                     <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-text-tertiary tracking-wider">Cliente Vinculado</span>
                        <select 
                          value={activeNote.client_id || ''} 
                          onChange={e => updateNote(activeNote.id, { client_id: e.target.value || null })}
                          className="bg-bg-app border border-border text-small font-semibold text-text-secondary px-2 py-1 rounded-radius-sm outline-none focus:border-accent cursor-pointer"
                        >
                           <option value="">Sem vínculo estrito (Geral)</option>
                           {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                     </div>
                  </div>

                  <button 
                     onClick={() => { if(window.confirm('Excluir esta nota permanentemente do sistema?')) { removeNote(activeNote.id); closeTab({ stopPropagation: () => {} } as any, activeNote.id) } }} 
                     className="px-3 py-2 text-small font-bold text-status-red bg-status-red/5 hover:bg-status-red/10 border border-status-red/20 hover:border-status-red/40 rounded-radius-sm transition-colors flex items-center gap-2 shrink-0"
                     title="Apagar Nota"
                  >
                     <Trash2 size={16}/> Excluir
                  </button>
               </div>
               
               <div className="flex-1 overflow-hidden px-8 py-6 relative bg-bg-surface">
                  <div className="max-w-3xl mx-auto h-full w-full">
                    <RTE 
                       key={activeNote.id} 
                       initialContent={activeNote.content} 
                       onChange={(json) => updateNote(activeNote.id, { content: json })} 
                    />
                  </div>
               </div>
            </div>
         )}

         {/* TAB FALLBACK Se excluiu ou recarregou nulo */}
         {activeTabId !== 'home' && !activeNote && (
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-text-tertiary">
               <div>
                  <FileText size={48} className="opacity-20 mb-3 mx-auto" />
                  <p>A aba selecionada encontrou uma nota que não existe mais.</p>
                  <button onClick={() => setActiveTabId('home')} className="mt-4 px-4 py-2 bg-bg-surface-raised border border-border text-text-primary text-small font-bold rounded-radius-sm hover:bg-bg-app">Fechar aba e Voltar para Central</button>
               </div>
            </div>
         )}
      </div>

    </section>
  )
}
