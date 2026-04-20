import { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { FileText, Search, Plus, Trash2, Clock, X, Maximize2, Minimize2 } from 'lucide-react'
import { useNotes } from '../../hooks/useNotes'
import { RTE } from '../notes/RTE'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function NotesPanel() {
  const { notes, loading, addNote, updateNote, removeNote } = useNotes()
  const [searchTerm, setSearchTerm] = useState('')
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  const filtered = useMemo(() => notes.filter(n => n.title.toLowerCase().includes(searchTerm.toLowerCase())), [notes, searchTerm])
  const activeNote = useMemo(() => notes.find(n => n.id === activeNoteId), [notes, activeNoteId])

  const handleAddNew = async () => {
    try {
       const nova = await addNote()
       if(nova) setActiveNoteId(nova.id)
    } catch(e) {
       console.error(e)
    }
  }

  const editorUI = activeNote ? (
     <>
       {/* Titulo da Nota */}
       <div className="px-6 py-4 border-b border-border shrink-0 flex items-center justify-between bg-bg-surface-raised">
          <input 
            type="text"
            className="text-display font-display font-bold bg-transparent border-none outline-none focus:ring-0 w-full text-text-primary mr-4 placeholder:text-text-tertiary"
            value={activeNote.title}
            onChange={(e) => updateNote(activeNote.id, { title: e.target.value })}
            placeholder="Sem título definido..."
          />
          <div className="flex items-center gap-1 shrink-0">
             <button onClick={() => setIsExpanded(!isExpanded)} className="p-2 text-text-tertiary hover:bg-bg-app hover:text-text-primary rounded-sm transition-colors" title={isExpanded ? "Restaurar" : "Modo Foco"}>
                {isExpanded ? <Minimize2 size={16}/> : <Maximize2 size={16}/>}
             </button>
             <div className="w-px h-5 bg-border mx-1" />
             <button onClick={() => { if(window.confirm('Excluir esta nota permanentemente?')) { removeNote(activeNote.id); setActiveNoteId(null); setIsExpanded(false) } }} className="p-2 text-text-tertiary hover:bg-status-red/10 hover:text-status-red rounded-sm transition-colors" title="Apagar Nota">
                <Trash2 size={16}/>
             </button>
             <button onClick={() => { setActiveNoteId(null); setIsExpanded(false) }} className="p-2 text-text-tertiary hover:bg-bg-app hover:text-text-primary border border-transparent hover:border-border rounded-sm transition-colors" title="Fechar Visualizador">
                <X size={18} strokeWidth={2}/>
             </button>
          </div>
       </div>
       
       {/* Injeção de Motor de Texto Quente (Key força reset na troca de notas) */}
       <div className="flex-1 overflow-hidden px-8 py-6 relative bg-bg-surface">
          <RTE 
             key={activeNote.id} 
             initialContent={activeNote.content} 
             onChange={(json) => updateNote(activeNote.id, { content: json })} 
          />
       </div>
     </>
  ) : null;

  return (
    <section className="bg-bg-surface border border-border rounded-radius-md shadow-card flex flex-col h-full min-h-0 relative z-10 overflow-hidden w-full transition-all">
      <header className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0 bg-bg-surface-raised sticky top-0">
        <div className="flex items-center gap-3">
          <FileText size={20} className="text-accent" strokeWidth={2} />
          <h2 className="text-section text-text-primary uppercase tracking-wide font-bold">Anotações Livres</h2>
        </div>
        <button onClick={handleAddNew} className="text-accent hover:bg-accent-light px-3 py-1.5 rounded-radius-sm transition-colors text-small font-semibold flex items-center gap-2 border border-accent/20 hover:border-accent/40 shadow-sm">
          <Plus size={16} strokeWidth={2.5} /> Nova
        </button>
      </header>

      {/* Main Área Flexível que divide as Notas e o Editor */}
      <div className="flex flex-1 min-h-0 bg-bg-surface relative">
         
         {/* Lado Esquerdo: Lista de Notas */}
         <div className={`flex-col border-r border-border shrink-0 bg-bg-app/30 transition-all duration-300 ${activeNoteId ? 'w-1/3 min-w-[220px]' : 'w-full'} flex`}>
            {/* Barra de Busca Fixa */}
            <div className="p-3 border-b border-border bg-bg-surface sticky top-0 z-10 shadow-[0_1px_0_0_var(--border)]">
               <div className="relative">
                 <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                 <input 
                    type="text" 
                    placeholder={activeNoteId ? "Filtre..." : "Buscar anotações pelo título..."}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full text-small pl-9 pr-3 py-2 bg-bg-app border border-border rounded-radius-sm focus:border-accent focus:outline-none transition-all focus:shadow-sm" 
                 />
               </div>
            </div>
            
            {/* Container da Lista de Notas Recentes */}
            <div className="flex-1 overflow-y-auto space-y-[2px] p-2">
               {loading && <div className="text-small text-text-tertiary p-4 text-center">Carregando notas...</div>}
               {!loading && filtered.length === 0 && <div className="text-small text-text-tertiary p-4 text-center italic">Você ainda não tem notas.</div>}
               {filtered.map(note => (
                 <div 
                   key={note.id}
                   onClick={() => setActiveNoteId(note.id)}
                   className={`p-3 rounded-radius-sm cursor-pointer border flex justify-between items-start group transition-all duration-200 ${activeNoteId === note.id ? 'bg-bg-surface border-accent shadow-sm ring-1 ring-accent/20' : 'bg-transparent border-transparent hover:bg-bg-surface-raised hover:border-border'}`}
                 >
                    <div className="overflow-hidden pr-2">
                       <h3 className={`font-semibold text-body truncate mb-1 ${activeNoteId === note.id ? 'text-accent' : 'text-text-primary group-hover:text-accent'}`}>{note.title}</h3>
                       <div className="flex items-center gap-1.5 text-[11px] text-text-tertiary">
                          <Clock size={10} />
                          {format(new Date(note.updated_at), "d 'de' MMM, HH:mm", { locale: ptBR })}
                       </div>
                    </div>
                 </div>
               ))}
            </div>
         </div>

         {/* Lado Direito: Editor em Linha (Escondido se Modo Foco ativo) */}
         <div className={`flex-col flex-1 bg-bg-surface transition-all overflow-hidden flex relative ${activeNoteId ? 'opacity-100' : 'opacity-0 hidden'} ${isExpanded ? 'opacity-0 pointer-events-none' : ''}`}>
            {activeNote && !isExpanded ? editorUI : !activeNote && (
               <div className="m-auto text-center flex flex-col items-center text-text-tertiary">
                  <FileText size={48} className="opacity-20 mb-3" />
                  <p>A nota selecionada não pôde ser encontrada.</p>
               </div>
            )}
         </div>

         {/* Lado Direito: Editor em Portal Modal (Toda a Tela) */}
         {isExpanded && activeNote && createPortal(
            <div className="fixed inset-0 bg-bg-app/80 backdrop-blur-sm z-[9999] p-6 lg:p-12 flex items-center justify-center animate-in fade-in duration-200">
               {/* Click no backdrop fecha o expanded */}
               <div className="absolute inset-0 z-0" onClick={() => setIsExpanded(false)} />
               
               {/* Modal Container */}
               <div className="bg-bg-surface w-full max-w-[1100px] h-full max-h-[90vh] rounded-radius-md shadow-modal flex flex-col border border-border animate-in zoom-in-95 duration-200 relative z-10 overflow-hidden">
                  {editorUI}
               </div>
            </div>,
            document.body
         )}

      </div>
    </section>
  )
}
