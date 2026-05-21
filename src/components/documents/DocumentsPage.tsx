import { useState } from 'react'
import { FileText } from 'lucide-react'
import { useDocuments } from '../../hooks/useDocuments'
import { useClients } from '../../hooks/useClients'
import { DocumentSidebar } from './DocumentSidebar'
import { DocumentEditor } from './DocumentEditor'

export function DocumentsPage() {
  const { documents, loading, addDocument, updateDocument, removeDocument, generateShareToken, revokeShareToken } = useDocuments()
  const { clients } = useClients()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filterClientId, setFilterClientId] = useState<string | null>(null)

  const selectedDocument = documents.find(d => d.id === selectedId) ?? null

  const visibleDocuments = filterClientId
    ? documents.filter(d => {
        if (d.client_id === filterClientId) return true
        // also show parents of matching docs
        const isParentOfMatch = documents.some(child => child.client_id === filterClientId && child.parent_id === d.id)
        return isParentOfMatch
      })
    : documents

  const handleAdd = async (parentId?: string | null) => {
    try {
      const doc = await addDocument(parentId, filterClientId)
      if (doc) setSelectedId(doc.id)
    } catch (err) {
      console.error('Erro ao criar documento:', err)
    }
  }

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('Excluir este documento e todas as subpáginas?')
    if (!confirmed) return
    try {
      await removeDocument(id)
      if (selectedId === id) setSelectedId(null)
    } catch (err) {
      console.error('Erro ao excluir documento:', err)
    }
  }

  return (
    <div className="flex-1 flex h-screen overflow-hidden animate-in fade-in duration-300">
      <DocumentSidebar
        documents={visibleDocuments}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onAdd={handleAdd}
        onDelete={handleDelete}
        clients={clients}
        filterClientId={filterClientId}
        onFilterChange={setFilterClientId}
      />

      <div className="flex-1 overflow-hidden bg-bg-surface">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-pulse text-text-tertiary text-small">Carregando...</div>
          </div>
        ) : selectedDocument ? (
          <DocumentEditor
            document={selectedDocument}
            allDocuments={documents}
            onUpdate={updateDocument}
            clients={clients}
            onGenerateShare={generateShareToken}
            onRevokeShare={revokeShareToken}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
            <div className="w-16 h-16 bg-bg-app rounded-radius-lg flex items-center justify-center">
              <FileText size={28} className="text-text-tertiary opacity-50" />
            </div>
            <div>
              <h3 className="text-section font-semibold text-text-primary mb-1">Nenhum documento selecionado</h3>
              <p className="text-body text-text-secondary">Selecione um documento na barra lateral ou crie um novo.</p>
            </div>
            <button
              onClick={() => handleAdd(null)}
              className="mt-2 px-4 py-2 bg-accent text-white rounded-radius-sm text-small font-semibold hover:bg-accent-hover transition-colors"
            >
              Novo Documento
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
