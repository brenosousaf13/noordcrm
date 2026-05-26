import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database.types'

export type Subtask = Database['public']['Tables']['subtasks']['Row']

export function useSubtasks(taskId: string) {
  const [subtasks, setSubtasks] = useState<Subtask[]>([])
  const [loading, setLoading] = useState(false)

  const fetchSubtasks = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('subtasks')
      .select('*')
      .eq('task_id', taskId)
      .order('sort_order')
    if (data) setSubtasks(data as Subtask[])
    setLoading(false)
  }, [taskId])

  const addSubtask = async (title: string) => {
    const sort_order = subtasks.length
    const { data } = await supabase
      .from('subtasks')
      .insert({ task_id: taskId, title, sort_order, is_done: false, priority: 2 })
      .select()
      .single()
    if (data) setSubtasks(prev => [...prev, data as Subtask])
  }

  const toggleSubtask = async (id: string, is_done: boolean) => {
    setSubtasks(prev => prev.map(s => s.id === id ? { ...s, is_done } : s))
    await supabase.from('subtasks').update({ is_done }).eq('id', id)
  }

  const updateSubtask = async (id: string, payload: Partial<Subtask>) => {
    setSubtasks(prev => prev.map(s => s.id === id ? { ...s, ...payload } : s))
    await supabase.from('subtasks').update(payload).eq('id', id)
  }

  const deleteSubtask = async (id: string) => {
    setSubtasks(prev => prev.filter(s => s.id !== id))
    await supabase.from('subtasks').delete().eq('id', id)
  }

  return { subtasks, loading, fetchSubtasks, addSubtask, toggleSubtask, updateSubtask, deleteSubtask }
}
