import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database.types'

type Note = Database['public']['Tables']['notes']['Row']

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)

  const fetchNotes = async () => {
    const { data, error } = await supabase.from('notes').select('*').order('updated_at', { ascending: false })
    if (error) console.error("Erro ao buscar notas:", error)
    if (data) setNotes(data)
    setLoading(false)
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotes()
    
    const channel = supabase.channel('notes_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, () => {
        fetchNotes()
      })
      .subscribe()
      
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const addNote = async () => {
    const { data, error } = await supabase.from('notes').insert([{ title: 'Nova Nota' }]).select()
    if (error) throw error
    if (data && data.length > 0) {
      setNotes(prev => {
        const exist = prev.find(n => n.id === data[0].id)
        if(exist) return prev
        return [data[0], ...prev]
      })
    }
    return data?.[0]
  }

  const updateNote = async (id: string, payload: Partial<Note>) => {
    // Force override updated_at to ensure proper ordering
    const finalPayload = { ...payload, updated_at: new Date().toISOString() }
    
    // Optmistic Update locally instantly to avoid flickering on rapid typing
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...finalPayload } : n)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()))

    const { error } = await supabase.from('notes').update(finalPayload).eq('id', id)
    if (error) {
      console.error("Auto-save falhou. Restaurando estado...", error)
      fetchNotes() // Rollback
      throw error
    }
  }

  const removeNote = async (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id))
    const { error } = await supabase.from('notes').delete().eq('id', id)
    if (error) {
      fetchNotes()
      throw error
    }
  }

  return { notes, loading, addNote, updateNote, removeNote }
}
