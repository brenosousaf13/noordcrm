import { useEditor, EditorContent } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import StarterKit from '@tiptap/starter-kit'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import Placeholder from '@tiptap/extension-placeholder'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { useEffect, useRef } from 'react'
import type { Json } from '../../types/database.types'

interface RTEProps {
  initialContent: Json | null
  onChange: (content: Json) => void
}

const COLOR_PALETTE = [
  '#111827', // default (text-primary)
  '#1A9E6E', // accent green
  '#3B82F6', // blue
  '#8B5CF6', // violet
  '#EF4444', // red
  '#F97316', // orange
  '#EAB308', // yellow
  '#6B7280', // gray
]

export function RTE({ initialContent, onChange }: RTEProps) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
      }),
      TextStyle,
      Color,
      Placeholder.configure({
        placeholder: 'Comece a escrever sua nota livremente aqui...',
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    content: (initialContent as any) || '',
    onUpdate: ({ editor }) => {
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

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const BubbleMenuComponent = BubbleMenu as any

  if (!editor) return <div className="animate-pulse w-full h-full bg-bg-surface-raised rounded"></div>

  return (
    <div className="flex flex-col h-full w-full relative">
      {/* Bubble Menu Contextual */}
      {editor && (
        <BubbleMenuComponent editor={editor} tippyOptions={{ duration: 100 }} className="flex gap-1 bg-bg-surface border border-border shadow-modal rounded-radius-md py-1.5 px-2 flex-wrap max-w-[360px]">

          {/* Formatação básica */}
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`font-display font-bold w-7 h-7 rounded flex items-center justify-center text-sm transition-colors ${editor.isActive('bold') ? 'bg-accent text-white' : 'hover:bg-bg-app text-text-secondary'}`}
          >B</button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`font-display italic font-bold w-7 h-7 rounded flex items-center justify-center text-sm transition-colors ${editor.isActive('italic') ? 'bg-accent text-white' : 'hover:bg-bg-app text-text-secondary'}`}
          >I</button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`font-display font-bold w-7 h-7 rounded flex items-center justify-center text-sm transition-colors line-through ${editor.isActive('strike') ? 'bg-accent text-white' : 'hover:bg-bg-app text-text-secondary'}`}
          >S</button>

          <div className="w-[1px] h-5 bg-border my-auto mx-0.5" />

          {/* Headings */}
          {([1, 2, 3, 4] as const).map(level => (
            <button
              key={level}
              onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
              className={`font-display font-bold w-7 h-7 rounded flex items-center justify-center text-[11px] transition-colors ${editor.isActive('heading', { level }) ? 'bg-accent text-white' : 'hover:bg-bg-app text-text-secondary'}`}
            >
              H{level}
            </button>
          ))}

          <div className="w-[1px] h-5 bg-border my-auto mx-0.5" />

          {/* Listas */}
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`font-display font-bold w-7 h-7 rounded flex items-center justify-center text-[10px] tracking-tighter transition-colors ${editor.isActive('bulletList') ? 'bg-accent text-white' : 'hover:bg-bg-app text-text-secondary'}`}
            title="Lista de pontos"
          >●—</button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`font-display font-bold w-7 h-7 rounded flex items-center justify-center text-[10px] tracking-tighter transition-colors ${editor.isActive('orderedList') ? 'bg-accent text-white' : 'hover:bg-bg-app text-text-secondary'}`}
            title="Lista numerada"
          >1—</button>
          <button
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            className={`font-display font-bold w-7 h-7 rounded flex items-center justify-center text-[10px] transition-colors ${editor.isActive('taskList') ? 'bg-accent text-white' : 'hover:bg-bg-app text-text-secondary'}`}
            title="Checklist"
          >☑</button>

          <div className="w-[1px] h-5 bg-border my-auto mx-0.5" />

          {/* Cores de texto */}
          {COLOR_PALETTE.map(color => (
            <button
              key={color}
              onClick={() => editor.chain().focus().setColor(color).run()}
              className="w-5 h-5 rounded-full border border-border/50 hover:scale-110 transition-transform shrink-0"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
          <button
            onClick={() => editor.chain().focus().unsetColor().run()}
            className="w-5 h-5 rounded-full border border-dashed border-border hover:border-text-secondary transition-colors shrink-0 text-[8px] flex items-center justify-center text-text-tertiary"
            title="Remover cor"
          >✕</button>

        </BubbleMenuComponent>
      )}

      {/* Area de Digitação */}
      <div className="flex-1 overflow-y-auto pr-2 pb-12 cursor-text" onClick={() => editor.commands.focus()}>
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
