import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect, useRef } from 'react'
import type { Json } from '../../types/database.types'

interface RTEProps {
  initialContent: Json | null
  onChange: (content: Json) => void
}

export function RTE({ initialContent, onChange }: RTEProps) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      TextStyle,
      Color,
      Placeholder.configure({
        placeholder: 'Comece a escrever sua nota livremente aqui...',
      })
    ],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    content: (initialContent as any) || '',
    onUpdate: ({ editor }) => {
      // Auto-save via Debouncing: Espera o usuário parar de digitar por 1 segundo pra salvar no banco!
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        onChange(editor.getJSON())
      }, 1000)
    },
    editorProps: {
      attributes: {
        class: 'focus:outline-none w-full h-full text-body text-text-primary',
      },
    },
  })

  // Cleanup nativo
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  if (!editor) return <div className="animate-pulse w-full h-full bg-bg-surface-raised rounded"></div>

  return (
    <div className="flex flex-col h-full w-full">
      {/* Toolbox Hover */}
      <div className="flex gap-1 border-b border-border pb-2 mb-4 shrink-0 transition-opacity opacity-50 hover:opacity-100 focus-within:opacity-100">
        <button 
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`font-display font-bold w-7 h-7 rounded flex items-center justify-center text-sm transition-colors ${editor.isActive('bold') ? 'bg-bg-surface-raised border border-border text-text-primary' : 'hover:bg-bg-app text-text-secondary'}`}
        >
          B
        </button>
        <button 
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`font-display italic font-bold w-7 h-7 rounded flex items-center justify-center text-sm transition-colors ${editor.isActive('italic') ? 'bg-bg-surface-raised border border-border text-text-primary' : 'hover:bg-bg-app text-text-secondary'}`}
        >
          I
        </button>
        <div className="w-[1px] h-5 bg-border my-auto mx-1" />
        <button 
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`font-display font-bold w-7 h-7 rounded flex items-center justify-center text-sm transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-bg-surface-raised border border-border text-text-primary' : 'hover:bg-bg-app text-text-secondary'}`}
        >
          H1
        </button>
        <button 
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`font-display font-bold w-7 h-7 rounded flex items-center justify-center text-sm transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-bg-surface-raised border border-border text-text-primary' : 'hover:bg-bg-app text-text-secondary'}`}
        >
          H2
        </button>
        <div className="w-[1px] h-5 bg-border my-auto mx-1" />
        <button 
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`font-display font-bold w-7 h-7 rounded flex items-center justify-center text-[10px] tracking-tighter transition-colors ${editor.isActive('bulletList') ? 'bg-bg-surface-raised border border-border text-text-primary' : 'hover:bg-bg-app text-text-secondary'}`}
          title="Lista de Pontos"
        >
          ●—
        </button>
        <button 
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`font-display font-bold w-7 h-7 rounded flex items-center justify-center text-[10px] tracking-tighter transition-colors ${editor.isActive('orderedList') ? 'bg-bg-surface-raised border border-border text-text-primary' : 'hover:bg-bg-app text-text-secondary'}`}
          title="Lista Numerada"
        >
          1—
        </button>
      </div>

      {/* Area de Digitação Plena */}
      <div className="flex-1 overflow-y-auto pr-2 pb-12 cursor-text" onClick={() => editor.commands.focus()}>
         <EditorContent editor={editor} />
      </div>
    </div>
  )
}
