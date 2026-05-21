import { Extension } from '@tiptap/core'
import Suggestion from '@tiptap/suggestion'
import { ReactRenderer } from '@tiptap/react'
import tippy, { type Instance } from 'tippy.js'
import { CommandList } from './CommandList'
import type { CommandItem } from './CommandList'
import { uploadImage } from '../../lib/uploadImage'

const COMMANDS: CommandItem[] = [
  {
    title: 'Texto Normal',
    description: 'Parágrafo de texto simples',
    icon: '¶',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setParagraph().run()
    },
  },
  {
    title: 'Cabeçalho 1',
    description: 'Título grande',
    icon: 'H1',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run()
    },
  },
  {
    title: 'Cabeçalho 2',
    description: 'Título médio',
    icon: 'H2',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run()
    },
  },
  {
    title: 'Cabeçalho 3',
    description: 'Título pequeno',
    icon: 'H3',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run()
    },
  },
  {
    title: 'Lista com Marcadores',
    description: 'Lista não ordenada',
    icon: '•',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run()
    },
  },
  {
    title: 'Lista Numerada',
    description: 'Lista ordenada por números',
    icon: '1.',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run()
    },
  },
  {
    title: 'Checklist',
    description: 'Lista de tarefas com checkbox',
    icon: '☑',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run()
    },
  },
  {
    title: 'Citação',
    description: 'Bloco de citação',
    icon: '"',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run()
    },
  },
  {
    title: 'Código',
    description: 'Bloco de código',
    icon: '</>',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run()
    },
  },
  {
    title: 'Divisor',
    description: 'Linha horizontal divisória',
    icon: '—',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run()
    },
  },
  {
    title: 'Tabela',
    description: 'Inserir tabela 3×3',
    icon: '⊞',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
    },
  },
  {
    title: 'Imagem',
    description: 'Fazer upload de uma imagem',
    icon: '🖼',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run()
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (!file) return
        try {
          const url = await uploadImage(file)
          editor.chain().focus().setImage({ src: url }).run()
        } catch (err) {
          console.error('Erro ao fazer upload:', err)
        }
      }
      input.click()
    },
  },
]

export const SlashCommandExt = Extension.create({
  name: 'slashCommand',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        allowSpaces: false,
        startOfLine: false,
        items: ({ query }: { query: string }) => {
          if (!query) return COMMANDS
          return COMMANDS.filter(item =>
            item.title.toLowerCase().includes(query.toLowerCase())
          )
        },
        render: () => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let component: ReactRenderer<any>
          let popup: Instance[]

          return {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onStart: (props: any) => {
              component = new ReactRenderer(CommandList, {
                props,
                editor: props.editor,
              })
              if (!props.clientRect) return
              popup = tippy('body', {
                getReferenceClientRect: props.clientRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
                arrow: false,
                maxWidth: 'none',
              })
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onUpdate(props: any) {
              component.updateProps(props)
              if (!props.clientRect) return
              popup?.[0]?.setProps({ getReferenceClientRect: props.clientRect })
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onKeyDown(props: any) {
              if (props.event.key === 'Escape') {
                popup?.[0]?.hide()
                return true
              }
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              return (component.ref as any)?.onKeyDown?.(props) ?? false
            },
            onExit() {
              popup?.[0]?.destroy()
              component.destroy()
            },
          }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        command: ({ editor, range, props }: any) => {
          props.command({ editor, range })
        },
      },
    }
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ]
  },
})
