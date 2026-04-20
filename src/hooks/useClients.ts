import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database.types'

type Client = Database['public']['Tables']['clients']['Row']

export function useClients() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)

  const fetchClients = async () => {
    const { data, error } = await supabase.from('clients').select('*').order('name')
    if (error) console.error("Erro ao buscar clientes:", error)
    if (data) setClients(data)
    setLoading(false)
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchClients()
    
    // Assinatura do Realtime (WebSockets)
    const channel = supabase.channel(`clients_changes_${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, () => {
        fetchClients()
      })
      .subscribe()
      
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const addClient = async (payload: Omit<Client, 'id' | 'created_at'>) => {
    const { data, error } = await supabase.from('clients').insert([payload]).select()
    if (error) throw error
    if (data && data.length > 0) {
      setClients(prev => {
        const exist = prev.find(c => c.id === data[0].id)
        if (exist) return prev
        return [...prev, data[0]].sort((a,b) => a.name.localeCompare(b.name))
      })
    }
    return data
  }

  const updateClient = async (id: string, payload: Partial<Client>) => {
    const { data, error } = await supabase.from('clients').update(payload).eq('id', id).select()
    if (error) throw error
    if (data && data.length > 0) {
      setClients(prev => prev.map(c => c.id === id ? data[0] : c).sort((a,b) => a.name.localeCompare(b.name)))
    }
    return data
  }

  const removeClient = async (id: string) => {
    // Atualização otimista
    setClients(prev => prev.filter(c => c.id !== id))
    const { error } = await supabase.from('clients').delete().eq('id', id)
    if (error) {
      fetchClients() // fallback
      throw error
    }
  }

  return { clients, loading, addClient, updateClient, removeClient }
}
