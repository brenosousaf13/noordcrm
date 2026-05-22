import { useCallback, useEffect, useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import StarterKit from '@tiptap/starter-kit'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import Underline from '@tiptap/extension-underline'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table'
import Placeholder from '@tiptap/extension-placeholder'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { Globe, Lock, Copy, Check, Link2, X } from 'lucide-react'
import { SlashCommandExt } from './SlashCommandExt'
import { TableOfContentsExt } from './TableOfContentsExt'
import { uploadImage } from '../../lib/uploadImage'
import type { Document } from '../../hooks/useDocuments'
import type { Database } from '../../types/database.types'

type Client = Database['public']['Tables']['clients']['Row']

interface DocumentEditorProps {
  document: Document
  allDocuments: Document[]
  onUpdate: (id: string, payload: Partial<Document>) => void
  clients: Client[]
  onGenerateShare: (id: string) => Promise<string>
  onRevokeShare: (id: string) => void
}

const COLOR_PALETTE = [
  '#111827', '#1A9E6E', '#3B82F6', '#8B5CF6',
  '#EF4444', '#F97316', '#EAB308', '#6B7280',
]

const HIGHLIGHT_PALETTE = [
  '#FEF9C3', '#DCFCE7', '#DBEAFE', '#F3E8FF',
  '#FEE2E2', '#FFEDD5', '#E0F2FE', '#F1F5F9',
]

const ICON_OPTIONS = ['📄', '📝', '📋', '📊', '📈', '💡', '✅', '⭐', '🚀', '💎', '🎯', '🔥', '💰', '📢', '🎉', '👥', '🗂️', '📁', '🔔', '⚠️']

export function DocumentEditor({ document, allDocuments, onUpdate, clients, onGenerateShare, onRevokeShare }: DocumentEditorProps) {
  const [title, setTitle] = useState(document.title)
  const [icon, setIcon] = useState(document.icon ?? '📄')
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [copied, setCopied] = useState(false)
  const [shareLoading, setShareLoading] = useState(false)

  const titleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const contentTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const breadcrumb = useCallback(() => {
    const ancestors: Document[] = []
    let current = document
    while (current.parent_id) {
      const parent = allDocuments.find(d => d.id === current.parent_id)
      if (!parent) break
      ancestors.unshift(parent)
      current = parent
    }
    return ancestors
  }, [document, allDocuments])

  const client = clients.find(c => c.id === document.client_id)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const BubbleMenuComponent = BubbleMenu as any

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3, 4] } }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Underline,
      Image.configure({ inline: false, HTMLAttributes: { class: 'doc-image' } }),
      Link.configure({ openOnClick: false, autolink: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Placeholder.configure({ placeholder: 'Escreva algo, ou use / para inserir blocos...' }),
      TaskList,
      TaskItem.configure({ nested: true }),
      SlashCommandExt,
      TableOfContentsExt,
    ],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    content: (document.content as any) || '',
    onUpdate: ({ editor }) => {
      if (contentTimeoutRef.current) clearTimeout(contentTimeoutRef.current)
      contentTimeoutRef.current = setTimeout(() => {
        onUpdate(document.id, { content: editor.getJSON() })
      }, 1000)
    },
    editorProps: {
      attributes: { class: 'focus:outline-none w-full min-h-[calc(100vh-220px)]' },
      handleDrop: (_view, event, _slice, _moved) => {
        const file = event.dataTransfer?.files?.[0]
        if (!file?.type.startsWith('image/')) return false
        uploadImage(file).then(url => {
          editor?.chain().focus().setImage({ src: url }).run()
        }).catch(err => console.error('Upload falhou:', err))
        return true
      },
      handlePaste: (_view, event) => {
        const file = event.clipboardData?.files?.[0]
        if (!file?.type.startsWith('image/')) return false
        uploadImage(file).then(url => {
          editor?.chain().focus().setImage({ src: url }).run()
        }).catch(err => console.error('Upload falhou:', err))
        return true
      },
    },
  })

  // Sync document when ID changes
  useEffect(() => {
    setTitle(document.title)
    setIcon(document.icon ?? '📄')
    if (editor && document.content !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      editor.commands.setContent((document.content as any) || '')
    }
  }, [document.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      if (titleTimeoutRef.current) clearTimeout(titleTimeoutRef.current)
      if (contentTimeoutRef.current) clearTimeout(contentTimeoutRef.current)
    }
  }, [])

  const handleTitleChange = (value: string) => {
    setTitle(value)
    if (titleTimeoutRef.current) clearTimeout(titleTimeoutRef.current)
    titleTimeoutRef.current = setTimeout(() => {
      onUpdate(document.id, { title: value || 'Sem título' })
    }, 800)
  }

  const handleIconSelect = (emoji: string) => {
    setIcon(emoji)
    setShowIconPicker(false)
    onUpdate(document.id, { icon: emoji })
  }

  const handleGenerateShare = async () => {
    setShareLoading(true)
    try {
      await onGenerateShare(document.id)
    } finally {
      setShareLoading(false)
    }
  }

  const shareUrl = document.share_token
    ? `${window.location.origin}/doc/${document.share_token}`
    : null

  const handleCopyLink = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!editor) return null

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-bg-surface">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-bg-surface border-b border-border px-8 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-small text-text-tertiary">
          {breadcrumb().map((ancestor, i) => (
            <span key={ancestor.id} className="flex items-center gap-2">
              <span>{ancestor.icon}</span>
              <span className="hover:text-text-primary cursor-default">{ancestor.title}</span>
              {i < breadcrumb().length - 1 && <span>/</span>}
              <span>/</span>
            </span>
          ))}
          <span className="text-text-secondary font-medium">{document.title || 'Sem título'}</span>
        </div>

        <div className="flex items-center gap-2">
          {client && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-radius-sm bg-bg-app text-small text-text-secondary">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: client.color }} />
              {client.name}
            </div>
          )}
          <button
            onClick={() => setShowShareModal(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-radius-sm text-small font-medium transition-colors ${
              document.is_public
                ? 'bg-accent-light text-accent hover:bg-accent/20'
                : 'bg-bg-app text-text-secondary hover:bg-bg-app hover:text-text-primary border border-border'
            }`}
          >
            {document.is_public ? <Globe size={13} /> : <Lock size={13} />}
            {document.is_public ? 'Público' : 'Compartilhar'}
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 px-8 py-8 max-w-3xl mx-auto w-full">
        {/* Icon + Title */}
        <div className="flex items-start gap-3 mb-6">
          <div className="relative">
            <button
              onClick={() => setShowIconPicker(v => !v)}
              className="text-4xl hover:bg-bg-app rounded-radius-sm p-1 transition-colors leading-none"
              title="Mudar ícone"
            >
              {icon}
            </button>
            {showIconPicker && (
              <div className="absolute top-full left-0 mt-1 bg-bg-surface border border-border shadow-modal rounded-radius-md p-2 z-50 grid grid-cols-5 gap-1 w-44">
                {ICON_OPTIONS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => handleIconSelect(emoji)}
                    className="text-xl p-1.5 rounded hover:bg-bg-app transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
          <textarea
            value={title}
            onChange={e => handleTitleChange(e.target.value)}
            placeholder="Sem título"
            rows={1}
            className="flex-1 text-[2rem] font-display font-bold text-text-primary bg-transparent resize-none outline-none placeholder:text-text-tertiary leading-tight overflow-hidden"
            style={{ minHeight: '2.5rem' }}
            onInput={e => {
              const el = e.target as HTMLTextAreaElement
              el.style.height = 'auto'
              el.style.height = el.scrollHeight + 'px'
            }}
          />
        </div>

        {/* Bubble Menu for text formatting */}
        <BubbleMenuComponent
          editor={editor}
          tippyOptions={{ duration: 100 }}
          className="flex gap-1 bg-bg-surface border border-border shadow-modal rounded-radius-md py-1.5 px-2 flex-wrap max-w-[400px]"
        >
          <button onClick={() => editor.chain().focus().toggleBold().run()} className={`font-bold w-7 h-7 rounded flex items-center justify-center text-sm transition-colors ${editor.isActive('bold') ? 'bg-accent text-white' : 'hover:bg-bg-app text-text-secondary'}`}>B</button>
          <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`italic font-bold w-7 h-7 rounded flex items-center justify-center text-sm transition-colors ${editor.isActive('italic') ? 'bg-accent text-white' : 'hover:bg-bg-app text-text-secondary'}`}>I</button>
          <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={`underline font-bold w-7 h-7 rounded flex items-center justify-center text-sm transition-colors ${editor.isActive('underline') ? 'bg-accent text-white' : 'hover:bg-bg-app text-text-secondary'}`}>U</button>
          <button onClick={() => editor.chain().focus().toggleStrike().run()} className={`line-through font-bold w-7 h-7 rounded flex items-center justify-center text-sm transition-colors ${editor.isActive('strike') ? 'bg-accent text-white' : 'hover:bg-bg-app text-text-secondary'}`}>S</button>

          <div className="w-[1px] h-5 bg-border my-auto mx-0.5" />

          {([1, 2, 3, 4] as const).map(level => (
            <button key={level} onClick={() => editor.chain().focus().toggleHeading({ level }).run()} className={`font-display font-bold w-7 h-7 rounded flex items-center justify-center text-[11px] transition-colors ${editor.isActive('heading', { level }) ? 'bg-accent text-white' : 'hover:bg-bg-app text-text-secondary'}`}>
              H{level}
            </button>
          ))}

          <div className="w-[1px] h-5 bg-border my-auto mx-0.5" />

          <button onClick={() => editor.chain().focus().toggleHighlight().run()} className={`w-7 h-7 rounded flex items-center justify-center text-sm transition-colors ${editor.isActive('highlight') ? 'bg-accent text-white' : 'hover:bg-bg-app text-text-secondary'}`} title="Realçar">H̲</button>

          <div className="w-[1px] h-5 bg-border my-auto mx-0.5" />

          {COLOR_PALETTE.map(color => (
            <button key={color} onClick={() => editor.chain().focus().setColor(color).run()} className="w-5 h-5 rounded-full border border-border/50 hover:scale-110 transition-transform shrink-0" style={{ backgroundColor: color }} />
          ))}
          <button onClick={() => editor.chain().focus().unsetColor().run()} className="w-5 h-5 rounded-full border border-dashed border-border hover:border-text-secondary transition-colors shrink-0 text-[8px] flex items-center justify-center text-text-tertiary">✕</button>

          <div className="w-[1px] h-5 bg-border my-auto mx-0.5" />

          {HIGHLIGHT_PALETTE.map(color => (
            <button key={color} onClick={() => editor.chain().focus().setHighlight({ color }).run()} className="w-5 h-5 rounded-md border border-border/50 hover:scale-110 transition-transform shrink-0" style={{ backgroundColor: color }} title="Realce" />
          ))}
          <button onClick={() => editor.chain().focus().unsetHighlight().run()} className="w-5 h-5 rounded-md border border-dashed border-border hover:border-text-secondary transition-colors shrink-0 text-[8px] flex items-center justify-center text-text-tertiary">✕</button>

          <div className="w-[1px] h-5 bg-border my-auto mx-0.5" />

          <button
            onClick={() => {
              const url = window.prompt('URL do link:')
              if (url) editor.chain().focus().setLink({ href: url }).run()
            }}
            className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${editor.isActive('link') ? 'bg-accent text-white' : 'hover:bg-bg-app text-text-secondary'}`}
          >
            <Link2 size={13} />
          </button>
        </BubbleMenuComponent>

        {/* Table Bubble Menu */}
        <BubbleMenuComponent
          editor={editor}
          shouldShow={({ editor: e }: { editor: typeof editor }) => e?.isActive('table') ?? false}
          tippyOptions={{ duration: 100 }}
          className="flex gap-1 bg-bg-surface border border-border shadow-modal rounded-radius-md py-1 px-2"
        >
          <button onClick={() => editor.chain().focus().addRowBefore().run()} className="px-2 py-1 text-[11px] hover:bg-bg-app rounded text-text-secondary transition-colors">+Linha↑</button>
          <button onClick={() => editor.chain().focus().addRowAfter().run()} className="px-2 py-1 text-[11px] hover:bg-bg-app rounded text-text-secondary transition-colors">+Linha↓</button>
          <button onClick={() => editor.chain().focus().addColumnBefore().run()} className="px-2 py-1 text-[11px] hover:bg-bg-app rounded text-text-secondary transition-colors">+Col←</button>
          <button onClick={() => editor.chain().focus().addColumnAfter().run()} className="px-2 py-1 text-[11px] hover:bg-bg-app rounded text-text-secondary transition-colors">+Col→</button>
          <div className="w-[1px] h-4 bg-border my-auto mx-0.5" />
          <button onClick={() => editor.chain().focus().deleteRow().run()} className="px-2 py-1 text-[11px] hover:bg-status-red/10 rounded text-status-red transition-colors">−Linha</button>
          <button onClick={() => editor.chain().focus().deleteColumn().run()} className="px-2 py-1 text-[11px] hover:bg-status-red/10 rounded text-status-red transition-colors">−Col</button>
          <button onClick={() => editor.chain().focus().deleteTable().run()} className="px-2 py-1 text-[11px] hover:bg-status-red/10 rounded text-status-red transition-colors">Excluir tabela</button>
        </BubbleMenuComponent>

        {/* Editor content */}
        <div className="cursor-text" onClick={() => editor.commands.focus()}>
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/30" onClick={() => setShowShareModal(false)}>
          <div className="bg-bg-surface rounded-radius-md shadow-modal border border-border w-[480px] p-6 animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-section font-semibold">Compartilhar Documento</h3>
              <button onClick={() => setShowShareModal(false)} className="p-1 rounded hover:bg-bg-app transition-colors text-text-secondary"><X size={16} /></button>
            </div>

            {document.is_public ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-accent-light rounded-radius-sm border border-accent/20">
                  <Globe size={14} className="text-accent shrink-0" />
                  <span className="text-small text-accent font-medium">Documento público — qualquer pessoa com o link pode visualizar</span>
                </div>
                <div className="flex items-center gap-2">
                  <input readOnly value={shareUrl ?? ''} className="flex-1 text-small text-text-secondary bg-bg-app border border-border rounded-radius-sm px-3 py-2 outline-none" />
                  <button onClick={handleCopyLink} className="flex items-center gap-1.5 px-3 py-2 bg-accent text-white rounded-radius-sm text-small font-medium hover:bg-accent-hover transition-colors shrink-0">
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                    {copied ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
                <button onClick={() => { onRevokeShare(document.id); setShowShareModal(false) }} className="text-small text-status-red hover:underline transition-colors">
                  Revogar acesso público
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-body text-text-secondary">Gere um link público para compartilhar este documento com clientes ou colaboradores externos. Eles poderão visualizar mas não editar.</p>
                <button onClick={handleGenerateShare} disabled={shareLoading} className="w-full py-2.5 bg-accent text-white rounded-radius-sm text-body-lg font-medium hover:bg-accent-hover transition-colors disabled:opacity-50">
                  {shareLoading ? 'Gerando...' : 'Gerar Link Público'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
