import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import Underline from '@tiptap/extension-underline'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { supabase } from '../lib/supabase'
import type { Document } from '../hooks/useDocuments'

export function PublicDocumentPage() {
  const { shareToken } = useParams<{ shareToken: string }>()
  const [document, setDocument] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!shareToken) { setError('Link inválido.'); setLoading(false); return }

    supabase
      .from('documents')
      .select('*')
      .eq('share_token', shareToken)
      .eq('is_public', true)
      .single()
      .then(({ data, error: err }) => {
        if (err || !data) {
          setError('Documento não encontrado ou acesso revogado.')
        } else {
          setDocument(data)
        }
        setLoading(false)
      })
  }, [shareToken])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3, 4] } }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Underline,
      Image.configure({ inline: false, HTMLAttributes: { class: 'doc-image' } }),
      Link.configure({ openOnClick: true, autolink: true }),
      Table.configure({ resizable: false }),
      TableRow,
      TableCell,
      TableHeader,
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    content: (document?.content as any) || '',
    editable: false,
    editorProps: {
      attributes: { class: 'focus:outline-none w-full' },
    },
  }, [document?.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-app flex items-center justify-center">
        <div className="animate-pulse text-text-tertiary text-body">Carregando documento...</div>
      </div>
    )
  }

  if (error || !document) {
    return (
      <div className="min-h-screen bg-bg-app flex items-center justify-center px-4">
        <div className="bg-bg-surface border border-border rounded-radius-md p-8 text-center max-w-sm shadow-card">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-section font-semibold text-text-primary mb-2">Documento Indisponível</h2>
          <p className="text-body text-text-secondary">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-surface">
      {/* Header */}
      <div className="border-b border-border px-8 py-4 flex items-center gap-3 bg-bg-surface sticky top-0 z-10 shadow-card">
        <div className="w-7 h-7 bg-accent text-white rounded-radius-sm flex items-center justify-center font-display font-black text-sm">N</div>
        <span className="text-small text-text-tertiary">Noord CRM</span>
        <span className="text-text-tertiary mx-1">/</span>
        <span className="text-small font-medium text-text-primary">{document.title}</span>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-8 py-10">
        <div className="flex items-start gap-3 mb-8">
          <span className="text-4xl">{document.icon ?? '📄'}</span>
          <h1 className="text-[2rem] font-display font-bold text-text-primary leading-tight">{document.title || 'Sem título'}</h1>
        </div>

        {editor && <EditorContent editor={editor} />}
      </div>
    </div>
  )
}
