export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string
          name: string
          color: string
          email: string | null
          phone: string | null
          document: string | null
          description: string | null
          address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          color?: string
          email?: string | null
          phone?: string | null
          document?: string | null
          description?: string | null
          address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          color?: string
          email?: string | null
          phone?: string | null
          document?: string | null
          description?: string | null
          address?: string | null
          created_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          id: string
          title: string
          client_id: string | null
          estimated_minutes: number
          deadline: string | null
          priority: 1 | 2 | 3
          is_done: boolean
          status: 'A fazer' | 'Fazendo' | 'Concluído' | 'Atrasado'
          file_url: string | null
          assigned_to: string | null
          is_recurrent: boolean
          start_date: string | null
          scheduled_at: string | null
          description: string | null
          recurrence: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          client_id?: string | null
          estimated_minutes?: number
          deadline?: string | null
          priority?: 1 | 2 | 3
          is_done?: boolean
          status?: 'A fazer' | 'Fazendo' | 'Concluído' | 'Atrasado'
          file_url?: string | null
          assigned_to?: string | null
          is_recurrent?: boolean
          start_date?: string | null
          scheduled_at?: string | null
          description?: string | null
          recurrence?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          client_id?: string | null
          estimated_minutes?: number
          deadline?: string | null
          priority?: 1 | 2 | 3
          is_done?: boolean
          status?: 'A fazer' | 'Fazendo' | 'Concluído' | 'Atrasado'
          file_url?: string | null
          assigned_to?: string | null
          is_recurrent?: boolean
          start_date?: string | null
          scheduled_at?: string | null
          description?: string | null
          recurrence?: string | null
          created_at?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          id: string
          title: string
          content: Json | null
          client_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title?: string
          content?: Json | null
          client_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: Json | null
          client_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      task_templates: {
        Row: {
          id: string
          name: string
          description: string | null
          created_by: string | null
          use_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name?: string
          description?: string | null
          created_by?: string | null
          use_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_by?: string | null
          use_count?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      task_template_tasks: {
        Row: {
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
        Insert: {
          id?: string
          template_id: string
          title?: string
          description?: string | null
          status?: string
          priority?: number
          estimated_minutes?: number
          assigned_to?: string | null
          sort_order?: number
        }
        Update: {
          id?: string
          template_id?: string
          title?: string
          description?: string | null
          status?: string
          priority?: number
          estimated_minutes?: number
          assigned_to?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      documents: {
        Row: {
          id: string
          title: string
          content: Json | null
          client_id: string | null
          parent_id: string | null
          icon: string | null
          is_public: boolean
          share_token: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title?: string
          content?: Json | null
          client_id?: string | null
          parent_id?: string | null
          icon?: string | null
          is_public?: boolean
          share_token?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: Json | null
          client_id?: string | null
          parent_id?: string | null
          icon?: string | null
          is_public?: boolean
          share_token?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
