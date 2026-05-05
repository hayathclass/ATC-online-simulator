'use client'

import { useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { GripVertical, X, Maximize2, Minimize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WidgetRenderer } from './widgets'
import { useStudioStore, type AutomataWidget } from '@/lib/store/studio-store'
import { cn } from '@/lib/utils'

interface DraggableWidgetProps {
  widget: AutomataWidget
  isSelected: boolean
  isPresentationMode: boolean
}

const widgetLabels: Record<AutomataWidget['type'], string> = {
  'dfa': 'DFA',
  'nfa': 'NFA',
  'pda': 'PDA',
  'turing': 'Turing Machine',
  'regex': 'Regex Tester',
  'cfg': 'CFG Editor',
  'parse-tree': 'Parse Tree',
  'transition-table': 'Transition Table',
}

export function DraggableWidget({ widget, isSelected, isPresentationMode }: DraggableWidgetProps) {
  const { updateWidget, deleteWidget, selectWidget, isEditing } = useStudioStore()
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)

  const handleDragStart = useCallback(() => {
    setIsDragging(true)
    selectWidget(widget.id)
  }, [selectWidget, widget.id])

  const handleDragEnd = useCallback((event: any, info: any) => {
    setIsDragging(false)
    updateWidget(widget.id, {
      x: widget.x + info.offset.x,
      y: widget.y + info.offset.y,
    })
  }, [updateWidget, widget.id, widget.x, widget.y])

  const handleResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    selectWidget(widget.id)

    const startX = e.clientX
    const startY = e.clientY
    const startWidth = widget.width
    const startHeight = widget.height

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX
      const deltaY = e.clientY - startY
      updateWidget(widget.id, {
        width: Math.max(200, startWidth + deltaX),
        height: Math.max(150, startHeight + deltaY),
      })
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [widget.id, widget.width, widget.height, updateWidget, selectWidget])

  const handleDataChange = useCallback((data: any) => {
    updateWidget(widget.id, { data })
  }, [updateWidget, widget.id])

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized)
  }

  if (isMaximized) {
    return (
      <div className="fixed inset-4 z-50 flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border bg-muted/50 px-3 py-2">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary" />
            <span className="text-sm font-medium">{widgetLabels[widget.type]}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={toggleMaximize}
            >
              <Minimize2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <WidgetRenderer
            widget={widget}
            onDataChange={handleDataChange}
            isEditing={isEditing && !isPresentationMode}
          />
        </div>
      </div>
    )
  }

  return (
    <motion.div
      ref={containerRef}
      drag={isEditing && !isPresentationMode}
      dragMomentum={false}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={() => selectWidget(widget.id)}
      className={cn(
        "absolute flex flex-col overflow-hidden rounded-lg border bg-card shadow-lg",
        isSelected && !isPresentationMode && "ring-2 ring-primary",
        isDragging && "cursor-grabbing opacity-90",
        !isDragging && isEditing && !isPresentationMode && "cursor-grab"
      )}
      style={{
        left: widget.x,
        top: widget.y,
        width: widget.width,
        height: widget.height,
        zIndex: isSelected ? 10 : 1,
      }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-muted/50 px-2 py-1.5">
        <div className="flex items-center gap-1.5">
          {isEditing && !isPresentationMode && (
            <GripVertical className="h-3 w-3 text-muted-foreground" />
          )}
          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
          <span className="text-[11px] font-medium">{widgetLabels[widget.type]}</span>
        </div>
        <div className="flex items-center gap-0.5">
          <Button
            size="sm"
            variant="ghost"
            className="h-5 w-5 p-0 hover:bg-muted"
            onClick={(e) => {
              e.stopPropagation()
              toggleMaximize()
            }}
          >
            <Maximize2 className="h-2.5 w-2.5" />
          </Button>
          {isEditing && !isPresentationMode && (
            <Button
              size="sm"
              variant="ghost"
              className="h-5 w-5 p-0 hover:bg-destructive/20 hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation()
                deleteWidget(widget.id)
              }}
            >
              <X className="h-2.5 w-2.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Widget content */}
      <div className="flex-1 overflow-hidden">
        <WidgetRenderer
          widget={widget}
          onDataChange={handleDataChange}
          isEditing={isEditing && !isPresentationMode}
        />
      </div>

      {/* Resize handle */}
      {isEditing && !isPresentationMode && (
        <div
          onMouseDown={handleResize}
          className={cn(
            "absolute bottom-0 right-0 h-4 w-4 cursor-se-resize",
            "after:absolute after:bottom-1 after:right-1 after:h-2 after:w-2",
            "after:border-b-2 after:border-r-2 after:border-muted-foreground/50"
          )}
        />
      )}
    </motion.div>
  )
}
