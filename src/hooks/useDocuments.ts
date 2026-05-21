import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database.types'

export type Document = Database['public']['Tables']['documents']['Row']

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDocuments = async () => {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('updated_at', { ascending: false })
    if (error) console.error('Erro ao buscar documentos:', error)
    if (data) setDocuments(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchDocuments()
    const channel = supabase
      .channel(`documents_changes_${crypto.randomUUID()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'documents' }, () => {
        fetchDocuments()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const addDocument = async (parentId?: string | null, clientId?: string | null) => {
    const { data, error } = await supabase
      .from('documents')
      .insert([{ title: 'Sem título', parent_id: parentId ?? null, client_id: clientId ?? null, icon: '📄' }])
      .select()
    if (error) throw error
    if (data?.[0]) setDocuments(prev => [data[0], ...prev])
    return data?.[0]
  }

  const updateDocument = async (id: string, payload: Partial<Document>) => {
    const finalPayload = { ...payload, updated_at: new Date().toISOString() }
    setDocuments(prev => prev.map(d => d.id === id ? { ...d, ...finalPayload } : d))
    const { error } = await supabase.from('documents').update(finalPayload).eq('id', id)
    if (error) { fetchDocuments(); throw error }
  }

  const removeDocument = async (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id))
    const { error } = await supabase.from('documents').delete().eq('id', id)
    if (error) { fetchDocuments(); throw error }
  }

  const generateShareToken = async (id: string) => {
    const token = crypto.randomUUID()
    await updateDocument(id, { is_public: true, share_token: token })
    return token
  }

  const revokeShareToken = async (id: string) => {
    await updateDocument(id, { is_public: false, share_token: null })
  }

  return { documents, loading, addDocument, updateDocument, removeDocument, generateShareToken, revokeShareToken }
}
