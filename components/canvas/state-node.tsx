"use client"

import { memo, useState } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useAutomataStore } from '@/lib/store/automata-store'
import { Play, Trash2, Flag } from 'lucide-react'

export interface StateNodeData {
  label: string
  isStart: boolean
  isFinal: boolean
  isActive: boolean
  isHighlighted: boolean
}

function StateNodeComponent({ data, selected, id }: any) {
  const { label, isStart, isFinal, isActive, isHighlighted } = data.data
  const toggleFinalState = useAutomataStore((s) => s.toggleFinalState)
  const setStartState = useAutomataStore((s) => s.setStartState)
  const deleteState = useAutomataStore((s) => s.deleteState)
  const [showActions, setShowActions] = useState(false)

  // Double-click to toggle final state (fallback)
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    toggleFinalState(id)
  }

  // Right-click to set as start state
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // The parent component handles context menu
  }

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="relative group cursor-pointer"
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
    >
      {/* Start state arrow indicator */}
      {isStart && (
        <div className="absolute -left-10 top-1/2 -translate-y-1/2 flex items-center">
          <div className="w-7 h-0.5 bg-foreground" />
          <div className="w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[10px] border-l-foreground" />
        </div>
      )}

      {/* Outer ring for final state - double circle effect */}
      {isFinal && (
        <div
          className={cn(
            "absolute -inset-2.5 rounded-full border-[3px]",
            isActive
              ? "border-warning"
              : isHighlighted
              ? "border-accent"
              : "border-primary"
          )}
        />
      )}

      {/* Main state circle */}
      <div
        className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center font-mono text-sm font-medium transition-all duration-200 border-2 relative",
          selected && "ring-2 ring-ring ring-offset-2 ring-offset-background",
          isFinal && "ring-2 ring-primary/30",
          isActive
            ? "bg-warning text-warning-foreground border-warning state-active shadow-lg shadow-warning/30"
            : isHighlighted
            ? "bg-accent text-accent-foreground border-accent"
            : "bg-card text-card-foreground border-border hover:border-primary/50 hover:shadow-md"
        )}
      >
        {label}
      </div>

      {/* Visual indicator badges */}
      <div className="absolute -top-1 -right-1 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {isStart && (
          <div className="w-2 h-2 rounded-full bg-primary" title="Start State" />
        )}
        {isFinal && (
          <div className="w-2 h-2 rounded-full bg-success" title="Final State" />
        )}
      </div>

      {/* Hover action buttons */}
      <div 
        className="absolute -top-12 left-1/2 -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        <button
          onClick={(e) => {
            e.stopPropagation()
            setStartState(id)
          }}
          className="w-7 h-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors shadow-md"
          title="Set as Start State"
        >
          <Play className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            toggleFinalState(id)
          }}
          className="w-7 h-7 rounded-md bg-accent text-accent-foreground flex items-center justify-center hover:bg-accent/90 transition-colors shadow-md"
          title="Toggle Final State"
        >
          <Flag className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            deleteState(id)
          }}
          className="w-7 h-7 rounded-md bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90 transition-colors shadow-md"
          title="Delete State"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Handles for connections */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-primary !border-2 !border-background"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-primary !border-2 !border-background"
      />
    </motion.div>
  )
}

export const StateNode = memo(StateNodeComponent)
