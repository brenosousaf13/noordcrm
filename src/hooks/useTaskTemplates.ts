import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export interface TaskTemplate {
  id: string
  name: string
  description: string | null
  created_by: string | null
  use_count: number
  created_at: string
  updated_at: string
}

export interface TemplateTask {
  id: string
  template_id: string
  title: string
  description: string | null
  status: string
  priority: number
  estimated_minutes: number
  assigned_to: string | null
  sort_order: number
}

export function useTaskTemplates() {
  const [templates, setTemplates] = useState<TaskTemplate[]>([])
  const [loading, setLoading] = useState(false)

  const fetchTemplates = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('task_templates')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error && data) setTemplates(data as TaskTemplate[])
    setLoading(false)
  }, [])

  useEffect(() => { fetchTemplates() }, [fetchTemplates])

  const fetchTemplateTasks = async (templateId: string): Promise<TemplateTask[]> => {
    const { data, error } = await supabase
      .from('task_template_tasks')
      .select('*')
      .eq('template_id', templateId)
      .order('sort_order', { ascending: true })
    if (error) throw error
    return (data ?? []) as TemplateTask[]
  }

  const saveTemplate = async (
    name: string,
    description: string | null,
    tasks: Omit<TemplateTask, 'id' | 'template_id'>[],
    createdBy?: string | null
  ): Promise<TaskTemplate> => {
    const { data: tmpl, error: tmplErr } = await supabase
      .from('task_templates')
      .insert([{ name, description: description ?? null, created_by: createdBy ?? null }])
      .select()
      .single()
    if (tmplErr) throw tmplErr

    if (tasks.length > 0) {
      const rows = tasks.map(t => ({ ...t, template_id: tmpl.id }))
      const { error: tasksErr } = await supabase.from('task_template_tasks').insert(rows)
      if (tasksErr) throw tasksErr
    }

    const newTemplate = tmpl as TaskTemplate
    setTemplates(prev => [newTemplate, ...prev])
    return newTemplate
  }

  const applyTemplate = async (
    templateId: string,
    clientId: string,
    options: {
      taskIds?: string[]
      dateOffsetDays?: number
      includeArchived?: boolean
      reactivate?: boolean
    }
  ) => {
    const tasks = await fetchTemplateTasks(templateId)

    let filtered = tasks
    if (!options.includeArchived) {
      filtered = tasks.filter(t => t.status !== 'Concluído')
    }
    if (options.taskIds) {
      filtered = filtered.filter(t => options.taskIds!.includes(t.id))
    }

    const today = new Date()
    const rows = filtered.map(t => {
      const statusRaw = (options.reactivate && t.status === 'Concluído') ? 'A fazer' : t.status
      const status = (['A fazer', 'Fazendo', 'Concluído', 'Atrasado'].includes(statusRaw) ? statusRaw : 'A fazer') as 'A fazer' | 'Fazendo' | 'Concluído' | 'Atrasado'

      let deadline: string | null = null
      if (options.dateOffsetDays && options.dateOffsetDays > 0) {
        const d = new Date(today)
        d.setDate(d.getDate() + options.dateOffsetDays)
        deadline = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      }

      return {
        title: t.title,
        description: t.description ?? null,
        status,
        priority: t.priority as 1 | 2 | 3,
        estimated_minutes: t.estimated_minutes,
        assigned_to: t.assigned_to ?? null,
        client_id: clientId,
        is_done: status === 'Concluído',
        is_recurrent: false,
        deadline,
      }
    })

    if (rows.length > 0) {
      const { error } = await supabase.from('tasks').insert(rows)
      if (error) throw error
    }

    const current = templates.find(t => t.id === templateId)
    const newCount = (current?.use_count ?? 0) + 1
    await supabase.from('task_templates').update({ use_count: newCount }).eq('id', templateId)
    setTemplates(prev => prev.map(t => t.id === templateId ? { ...t, use_count: newCount } : t))
  }

  const deleteTemplate = async (id: string) => {
    const { error } = await supabase.from('task_templates').delete().eq('id', id)
    if (error) throw error
    setTemplates(prev => prev.filter(t => t.id !== id))
  }

  const updateTemplate = async (id: string, payload: Partial<TaskTemplate>) => {
    const { error } = await supabase.from('task_templates').update(payload).eq('id', id)
    if (error) throw error
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, ...payload } : t))
  }

  return {
    templates,
    loading,
    fetchTemplates,
    fetchTemplateTasks,
    saveTemplate,
    applyTemplate,
    deleteTemplate,
    updateTemplate,
  }
}
