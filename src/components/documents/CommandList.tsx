import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import type { Editor, Range } from '@tiptap/core'

export interface CommandItem {
  title: string
  description: string
  icon: string
  command: (args: { editor: Editor; range: Range }) => void
}

interface CommandListProps {
  items: CommandItem[]
  command: (item: CommandItem) => void
}

export interface CommandListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean
}

export const CommandList = forwardRef<CommandListRef, CommandListProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)

    useEffect(() => setSelectedIndex(0), [items])

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }) => {
        if (event.key === 'ArrowUp') {
          setSelectedIndex(i => (i + items.length - 1) % Math.max(items.length, 1))
          return true
        }
        if (event.key === 'ArrowDown') {
          setSelectedIndex(i => (i + 1) % Math.max(items.length, 1))
          return true
        }
        if (event.key === 'Enter') {
          if (items[selectedIndex]) command(items[selectedIndex])
          return true
        }
        return false
      },
    }))

    if (!items.length) {
      return (
        <div className="bg-bg-surface border border-border shadow-modal rounded-radius-md py-3 px-4 w-56">
          <p className="text-small text-text-tertiary text-center">Sem resultados</p>
        </div>
      )
    }

    return (
      <div className="bg-bg-surface border border-border shadow-modal rounded-radius-md py-1 w-64 max-h-80 overflow-y-auto">
        {items.map((item, index) => (
          <button
            key={item.title}
            onClick={() => command(item)}
            className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
              index === selectedIndex
                ? 'bg-accent-light text-accent'
                : 'hover:bg-bg-app text-text-secondary'
            }`}
          >
            <span className="text-lg w-6 text-center shrink-0">{item.icon}</span>
            <div>
              <div className="text-body-lg text-text-primary">{item.title}</div>
              <div className="text-[11px] text-text-tertiary">{item.description}</div>
            </div>
          </button>
        ))}
      </div>
    )
  }
)

CommandList.displayName = 'CommandList'
