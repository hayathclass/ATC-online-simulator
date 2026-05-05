'use client'

import { DFAWidget } from './dfa-widget'
import { NFAWidget } from './nfa-widget'
import { RegexWidget } from './regex-widget'
import { TransitionTableWidget } from './transition-table-widget'
import type { AutomataWidget } from '@/lib/store/studio-store'

interface WidgetRendererProps {
  widget: AutomataWidget
  onDataChange?: (data: any) => void
  isEditing?: boolean
}

export function WidgetRenderer({ widget, onDataChange, isEditing = true }: WidgetRendererProps) {
  switch (widget.type) {
    case 'dfa':
      return (
        <DFAWidget
          data={widget.data}
          onDataChange={onDataChange}
          isEditing={isEditing}
        />
      )
    case 'nfa':
      return (
        <NFAWidget
          data={widget.data}
          onDataChange={onDataChange}
          isEditing={isEditing}
        />
      )
    case 'regex':
      return (
        <RegexWidget
          data={widget.data}
          onDataChange={onDataChange}
          isEditing={isEditing}
        />
      )
    case 'transition-table':
      return (
        <TransitionTableWidget
          data={widget.data}
          onDataChange={onDataChange}
          isEditing={isEditing}
        />
      )
    case 'pda':
      return (
        <div className="flex h-full items-center justify-center text-muted-foreground">
          <div className="text-center">
            <div className="text-sm font-medium">PDA Widget</div>
            <div className="text-xs">Coming in Phase 2</div>
          </div>
        </div>
      )
    case 'turing':
      return (
        <div className="flex h-full items-center justify-center text-muted-foreground">
          <div className="text-center">
            <div className="text-sm font-medium">Turing Machine</div>
            <div className="text-xs">Coming in Phase 2</div>
          </div>
        </div>
      )
    case 'cfg':
      return (
        <div className="flex h-full items-center justify-center text-muted-foreground">
          <div className="text-center">
            <div className="text-sm font-medium">CFG Editor</div>
            <div className="text-xs">Coming in Phase 2</div>
          </div>
        </div>
      )
    case 'parse-tree':
      return (
        <div className="flex h-full items-center justify-center text-muted-foreground">
          <div className="text-center">
            <div className="text-sm font-medium">Parse Tree</div>
            <div className="text-xs">Coming in Phase 2</div>
          </div>
        </div>
      )
    default:
      return null
  }
}

export { DFAWidget, NFAWidget, RegexWidget, TransitionTableWidget }
