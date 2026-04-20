import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database.types'

type Task = Database['public']['Tables']['tasks']['Row']
type InsertTask = Database['public']['Tables']['tasks']['Insert']

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTasks = async () => {
    const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: false })
    if (error) console.error("Erro ao buscar tarefas:", error)
    if (data) setTasks(data)
    setLoading(false)
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTasks()
    
    const channel = supabase.channel(`tasks_changes_${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        fetchTasks()
      })
      .subscribe()
      
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const addTask = async (payload: InsertTask) => {
    const { data, error } = await supabase.from('tasks').insert([payload]).select()
    if (error) throw error
    if (data && data.length > 0) {
      setTasks(prev => [data[0], ...prev])
    }
    return data?.[0]
  }

  const updateTask = async (id: string, payload: Partial<Task>) => {
    // Optimistic Update agressivo pra simular velocidade da luz no Drag and Drop da Agenda
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...payload } : t))
    
    const { data, error } = await supabase.from('tasks').update(payload).eq('id', id).select()
    if (error) {
      console.error("Erro no auto-save da task. Revertendo...", error)
      fetchTasks() // fallback
      throw error
    }
    if (data && data.length > 0) {
      setTasks(prev => prev.map(t => t.id === id ? data[0] : t))
    }
  }

  const removeTask = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id))
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) {
      fetchTasks()
      throw error
    }
  }

  return { tasks, loading, addTask, updateTask, removeTask }
}
