"use client"

import { memo } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  getStraightPath,
  type EdgeProps,
} from '@xyflow/react'
import { cn } from '@/lib/utils'

export interface TransitionEdgeData {
  symbol: string
  isActive: boolean
  isHighlighted: boolean
  transitionIds?: string[]
  isBidirectional?: boolean
}

function TransitionEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  source,
  target,
  selected,
}: EdgeProps) {
  const edgeData = data as TransitionEdgeData | undefined
  const symbol = edgeData?.symbol || ''
  const isActive = edgeData?.isActive || false
  const isHighlighted = edgeData?.isHighlighted || false
  const isBidirectional = edgeData?.isBidirectional || false

  // Self-loop
  const isSelfLoop = source === target

  let edgePath: string
  let labelX: number
  let labelY: number

  if (isSelfLoop) {
    // Create a self-loop path
    const loopRadius = 30
    edgePath = `M ${sourceX} ${sourceY - 28} 
                C ${sourceX - loopRadius} ${sourceY - 60}, 
                  ${sourceX + loopRadius} ${sourceY - 60}, 
                  ${sourceX} ${sourceY - 28}`
    labelX = sourceX
    labelY = sourceY - 70
  } else {
    // Use bezier curve
    const [path, lX, lY] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      curvature: 0.25,
    })

    edgePath = path
    labelX = lX
    labelY = lY
  }

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        className={cn(
          "transition-all duration-200",
          isActive
            ? "!stroke-destructive !stroke-[3px]"
            : isHighlighted
            ? "!stroke-accent !stroke-[2px]"
            : selected
            ? "!stroke-primary !stroke-[2px]"
            : "!stroke-muted-foreground"
        )}
        markerEnd={`url(#arrow-${isActive ? 'active' : isHighlighted ? 'highlighted' : 'default'})`}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className={cn(
            "px-2 py-0.5 rounded text-xs font-mono font-medium transition-all duration-200",
            isActive
              ? "bg-destructive text-destructive-foreground"
              : isHighlighted
              ? "bg-accent text-accent-foreground"
              : selected
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          )}
        >
          {symbol || 'ε'}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

export const TransitionEdge = memo(TransitionEdgeComponent)

// Custom arrow markers
export function EdgeMarkers() {
  return (
    <svg style={{ position: 'absolute', top: 0, left: 0 }}>
      <defs>
        <marker
          id="arrow-default"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" className="fill-muted-foreground" />
        </marker>
        <marker
          id="arrow-active"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" className="fill-destructive" />
        </marker>
        <marker
          id="arrow-highlighted"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" className="fill-accent" />
        </marker>
      </defs>
    </svg>
  )
}
