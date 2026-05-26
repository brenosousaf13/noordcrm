import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database.types'

export type TaskList = Database['public']['Tables']['task_lists']['Row']

export function useTaskLists(clientId: string) {
  const [lists, setLists] = useState<TaskList[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!clientId) return
    setLoading(true)
    supabase
      .from('task_lists')
      .select('*')
      .eq('client_id', clientId)
      .order('sort_order')
      .then(({ data }) => {
        if (data) setLists(data as TaskList[])
        setLoading(false)
      })
  }, [clientId])

  const addList = async (name: string) => {
    const sort_order = lists.length
    const { data } = await supabase
      .from('task_lists')
      .insert({ client_id: clientId, name, sort_order })
      .select()
      .single()
    if (data) setLists(prev => [...prev, data as TaskList])
    return data
  }

  const updateList = async (id: string, payload: Partial<TaskList>) => {
    setLists(prev => prev.map(l => l.id === id ? { ...l, ...payload } : l))
    await supabase.from('task_lists').update(payload).eq('id', id)
  }

  const deleteList = async (id: string) => {
    setLists(prev => prev.filter(l => l.id !== id))
    await supabase.from('task_lists').delete().eq('id', id)
  }

  return { lists, loading, addList, updateList, deleteList }
}
