import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export interface ClientFile {
  name: string
  id: string
  updated_at: string
  created_at: string
  metadata: { size: number; mimetype: string; eTag: string }
}

export function useClientFiles() {
  const [files, setFiles] = useState<ClientFile[]>([])
  const [loading, setLoading] = useState(false)

  const fetchFiles = useCallback(async (clientId: string) => {
    setLoading(true)
    const { data, error } = await supabase.storage
      .from('clients-files')
      .list(clientId, { sortBy: { column: 'created_at', order: 'desc' } })
    if (error) console.error('Erro ao listar arquivos:', error)
    setFiles((data as ClientFile[]) ?? [])
    setLoading(false)
  }, [])

  const uploadFile = async (clientId: string, file: File) => {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const path = `${clientId}/${Date.now()}_${safeName}`
    const { error } = await supabase.storage.from('clients-files').upload(path, file)
    if (error) throw error
    await fetchFiles(clientId)
  }

  const deleteFile = async (clientId: string, fileName: string) => {
    const { error } = await supabase.storage
      .from('clients-files')
      .remove([`${clientId}/${fileName}`])
    if (error) throw error
    setFiles(prev => prev.filter(f => f.name !== fileName))
  }

  const getPublicUrl = (clientId: string, fileName: string) => {
    const { data } = supabase.storage
      .from('clients-files')
      .getPublicUrl(`${clientId}/${fileName}`)
    return data.publicUrl
  }

  return { files, loading, fetchFiles, uploadFile, deleteFile, getPublicUrl }
}
