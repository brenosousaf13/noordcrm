import { Node, mergeAttributes } from '@tiptap/core'
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react'
import { useEffect, useState } from 'react'
import { List } from 'lucide-react'
import type { Editor } from '@tiptap/core'

interface HeadingItem {
  level: number
  text: string
  pos: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TableOfContentsView({ editor }: { editor: Editor; [key: string]: any }) {
  const [headings, setHeadings] = useState<HeadingItem[]>([])

  useEffect(() => {
    const update = () => {
      const items: HeadingItem[] = []
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'heading') {
          items.push({
            level: node.attrs.level as number,
            text: node.textContent,
            pos: pos + 1,
          })
        }
      })
      setHeadings(items)
    }

    update()
    editor.on('update', update)
    return () => { editor.off('update', update) }
  }, [editor])

  const handleClick = (pos: number) => {
    editor.chain().focus().setTextSelection(pos).scrollIntoView().run()
  }

  return (
    <NodeViewWrapper contentEditable={false} data-drag-handle>
      <div className="my-4 bg-bg-surface-raised border border-border rounded-radius-md overflow-hidden select-none" draggable="true">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-bg-surface">
          <List size={13} className="text-text-tertiary shrink-0" />
          <span className="text-label text-text-tertiary uppercase tracking-wider">Tabela de Conteúdos</span>
        </div>
        <div className="px-4 py-3">
          {headings.length === 0 ? (
            <p className="text-small text-text-tertiary italic">
              Adicione títulos ao documento para gerar o índice automaticamente
            </p>
          ) : (
            <div className="space-y-0.5">
              {headings.map((h, i) => (
                <button
                  key={i}
                  onClick={() => handleClick(h.pos)}
                  className={`block text-left w-full rounded px-2 py-1 transition-colors hover:bg-bg-app hover:text-accent group ${
                    h.level === 1
                      ? 'text-body font-semibold text-text-primary'
                      : h.level === 2
                      ? 'pl-5 text-body text-text-secondary'
                      : h.level === 3
                      ? 'pl-9 text-small text-text-secondary'
                      : 'pl-12 text-small text-text-tertiary'
                  }`}
                >
                  <span className="group-hover:underline underline-offset-2">
                    {h.text || <span className="italic opacity-40">Título sem texto</span>}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </NodeViewWrapper>
  )
}

export const TableOfContentsExt = Node.create({
  name: 'tableOfContents',
  group: 'block',
  atom: true,
  draggable: true,

  addNodeView() {
    return ReactNodeViewRenderer(TableOfContentsView)
  },

  parseHTML() {
    return [{ tag: 'div[data-type="table-of-contents"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'table-of-contents' })]
  },
})
