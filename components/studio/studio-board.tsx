'use client'

import { useRef, useCallback, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { DraggableWidget } from './draggable-widget'
import { WhiteboardRenderer } from './whiteboard-renderer'
import { useStudioStore } from '@/lib/store/studio-store'
import { cn } from '@/lib/utils'

export function StudioBoard() {
  const boardRef = useRef<HTMLDivElement>(null)
  const {
    currentLesson,
    selectedWidgetId,
    selectWidget,
    addWidget,
    addElement,
    isDarkBoard,
    isPresentationMode,
    draggedWidgetType,
    setDraggedWidgetType,
  } = useStudioStore()

  const currentPage = currentLesson?.pages[currentLesson.currentPageIndex]

  // Handle click on empty board area
  const handleBoardClick = useCallback((e: React.MouseEvent) => {
    if (e.target === boardRef.current) {
      selectWidget(null)
    }
  }, [selectWidget])

  // Handle drag over for widget drops
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }, [])

  // Handle drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!draggedWidgetType || !boardRef.current) return

    const rect = boardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left - 50
    const y = e.clientY - rect.top - 35

    // Check if it's a teaching tool or old widget type
    const toolTypes = ['state', 'final-state', 'reject-state', 'transition', 'transition-curved', 'self-loop', 'label', 'text', 'draw', 'comment-box', 'highlight', 'start-arrow', 'select', 'eraser', 'simulation']
    
    if (toolTypes.includes(draggedWidgetType)) {
      // Add as whiteboard element
      if (draggedWidgetType !== 'select' && draggedWidgetType !== 'eraser' && draggedWidgetType !== 'simulation') {
        addElement(draggedWidgetType as any, Math.max(20, x), Math.max(20, y))
      }
    } else {
      // Add as old widget (for backward compatibility)
      addWidget(draggedWidgetType as any, Math.max(20, x), Math.max(20, y))
    }
    
    setDraggedWidgetType(null)
  }, [draggedWidgetType, addWidget, addElement, setDraggedWidgetType])

  // Keyboard navigation for presentation mode
  useEffect(() => {
    if (!isPresentationMode) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        useStudioStore.getState().nextPage()
      } else if (e.key === 'ArrowLeft') {
        useStudioStore.getState().prevPage()
      } else if (e.key === 'Escape') {
        useStudioStore.getState().togglePresentationMode()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isPresentationMode])

  if (!currentPage) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">No lesson loaded</p>
      </div>
    )
  }

  return (
    <div
      id="studio-board"
      ref={boardRef}
      onClick={handleBoardClick}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={cn(
        "relative h-full w-full overflow-hidden",
        isDarkBoard 
          ? "bg-[#1a1a2e]" 
          : "bg-[#f8f9fa]",
        // Grid pattern
        isDarkBoard
          ? "bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)]"
          : "bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)]",
        "bg-[size:40px_40px]"
      )}
    >
      {/* Widgets */}
      <AnimatePresence>
        {currentPage.widgets.map((widget) => (
          <DraggableWidget
            key={widget.id}
            widget={widget}
            isSelected={selectedWidgetId === widget.id}
            isPresentationMode={isPresentationMode}
          />
        ))}
      </AnimatePresence>

      {/* Whiteboard Elements */}
      <AnimatePresence>
        {currentPage.elements && currentPage.elements.length > 0 && (
          <WhiteboardRenderer elements={currentPage.elements} />
        )}
      </AnimatePresence>

      {/* Empty state */}
      {currentPage.widgets.length === 0 && (!currentPage.elements || currentPage.elements.length === 0) && !isPresentationMode && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={cn(
            "text-center",
            isDarkBoard ? "text-white/30" : "text-black/30"
          )}>
            <p className="text-lg font-medium">Drop teaching tools here</p>
            <p className="text-sm">Drag states, transitions, and labels from the sidebar to build automata</p>
          </div>
        </div>
      )}

      {/* Drop indicator */}
      {draggedWidgetType && (
        <div className="pointer-events-none absolute inset-4 rounded-xl border-2 border-dashed border-primary/50 bg-primary/5" />
      )}

      {/* Presentation mode indicator */}
      {isPresentationMode && (
        <div className={cn(
          "absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full px-4 py-1.5",
          isDarkBoard ? "bg-white/10 text-white/60" : "bg-black/10 text-black/60"
        )}>
          <p className="text-xs">
            Press <kbd className="rounded bg-white/20 px-1.5 py-0.5">Esc</kbd> to exit presentation
          </p>
        </div>
      )}
    </div>
  )
}
