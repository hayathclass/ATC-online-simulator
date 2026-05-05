'use client'

import { useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import { Play, Pause, RotateCcw, StepForward, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface State {
  id: string
  name: string
  isStart: boolean
  isFinal: boolean
  x: number
  y: number
}

interface Transition {
  id: string
  from: string
  to: string
  symbols: string[]
}

interface DFAWidgetProps {
  data: {
    states: State[]
    transitions: Transition[]
    alphabet: string[]
  }
  onDataChange?: (data: any) => void
  isEditing?: boolean
}

export function DFAWidget({ data, onDataChange, isEditing = true }: DFAWidgetProps) {
  const [testString, setTestString] = useState('')
  const [currentStateId, setCurrentStateId] = useState<string | null>(null)
  const [inputIndex, setInputIndex] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<'accept' | 'reject' | null>(null)
  const [highlightedTransition, setHighlightedTransition] = useState<string | null>(null)

  const startState = data.states.find(s => s.isStart)

  const reset = useCallback(() => {
    setCurrentStateId(startState?.id || null)
    setInputIndex(0)
    setIsRunning(false)
    setResult(null)
    setHighlightedTransition(null)
  }, [startState])

  const step = useCallback(() => {
    if (!currentStateId || inputIndex >= testString.length) {
      // Check if current state is final
      const currentState = data.states.find(s => s.id === currentStateId)
      if (currentState?.isFinal) {
        setResult('accept')
      } else {
        setResult('reject')
      }
      setIsRunning(false)
      return
    }

    const symbol = testString[inputIndex]
    const transition = data.transitions.find(
      t => t.from === currentStateId && t.symbols.includes(symbol)
    )

    if (transition) {
      setHighlightedTransition(transition.id)
      setTimeout(() => {
        setCurrentStateId(transition.to)
        setInputIndex(prev => prev + 1)
        setHighlightedTransition(null)
      }, 300)
    } else {
      setResult('reject')
      setIsRunning(false)
    }
  }, [currentStateId, inputIndex, testString, data])

  const runSimulation = useCallback(() => {
    if (!isRunning) {
      reset()
      setCurrentStateId(startState?.id || null)
      setIsRunning(true)
    } else {
      setIsRunning(false)
    }
  }, [isRunning, reset, startState])

  // Auto-step when running
  const handlePlay = () => {
    if (result !== null) {
      reset()
      setTimeout(() => {
        setCurrentStateId(startState?.id || null)
        setIsRunning(true)
      }, 100)
    } else {
      runSimulation()
    }
  }

  // Calculate SVG viewBox based on states
  const padding = 60
  const minX = Math.min(...data.states.map(s => s.x)) - padding
  const minY = Math.min(...data.states.map(s => s.y)) - padding
  const maxX = Math.max(...data.states.map(s => s.x)) + padding
  const maxY = Math.max(...data.states.map(s => s.y)) + padding
  const width = Math.max(maxX - minX, 300)
  const height = Math.max(maxY - minY, 200)

  return (
    <div className="flex h-full flex-col">
      {/* Controls */}
      <div className="flex items-center gap-2 border-b border-border/50 bg-muted/30 p-2">
        <Input
          value={testString}
          onChange={(e) => {
            setTestString(e.target.value)
            reset()
          }}
          placeholder="Enter test string..."
          className="h-7 flex-1 bg-background text-xs"
        />
        <Button
          size="sm"
          variant="outline"
          className="h-7 w-7 p-0"
          onClick={handlePlay}
        >
          {isRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 w-7 p-0"
          onClick={step}
          disabled={result !== null}
        >
          <StepForward className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 w-7 p-0"
          onClick={reset}
        >
          <RotateCcw className="h-3 w-3" />
        </Button>
        {result && (
          <div className={cn(
            "flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium",
            result === 'accept' ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
          )}>
            {result === 'accept' ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
            {result === 'accept' ? 'Accepted' : 'Rejected'}
          </div>
        )}
      </div>

      {/* Input tape */}
      {testString && (
        <div className="flex items-center justify-center gap-0.5 border-b border-border/50 bg-muted/20 py-2">
          {testString.split('').map((char, i) => (
            <div
              key={i}
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded border text-xs font-mono transition-all",
                i === inputIndex
                  ? "border-primary bg-primary text-primary-foreground scale-110"
                  : i < inputIndex
                  ? "border-muted-foreground/30 bg-muted/50 text-muted-foreground"
                  : "border-border bg-background"
              )}
            >
              {char}
            </div>
          ))}
        </div>
      )}

      {/* Automaton visualization */}
      <div className="relative flex-1 overflow-hidden">
        <svg
          viewBox={`${minX} ${minY} ${width} ${height}`}
          className="h-full w-full"
          style={{ background: 'transparent' }}
        >
          <defs>
            <marker
              id="arrowhead-widget"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill="currentColor"
                className="text-muted-foreground"
              />
            </marker>
            <marker
              id="arrowhead-active-widget"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill="currentColor"
                className="text-primary"
              />
            </marker>
          </defs>

          {/* Transitions */}
          {data.transitions.map(t => {
            const fromState = data.states.find(s => s.id === t.from)
            const toState = data.states.find(s => s.id === t.to)
            if (!fromState || !toState) return null

            const isHighlighted = highlightedTransition === t.id
            const isSelfLoop = t.from === t.to

            if (isSelfLoop) {
              const x = fromState.x
              const y = fromState.y - 30
              return (
                <g key={t.id}>
                  <path
                    d={`M ${x - 15} ${y} C ${x - 25} ${y - 40}, ${x + 25} ${y - 40}, ${x + 15} ${y}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={isHighlighted ? 2 : 1.5}
                    className={isHighlighted ? "text-primary" : "text-muted-foreground"}
                    markerEnd={isHighlighted ? "url(#arrowhead-active-widget)" : "url(#arrowhead-widget)"}
                  />
                  <text
                    x={x}
                    y={y - 35}
                    textAnchor="middle"
                    className={cn(
                      "fill-current text-[10px] font-medium",
                      isHighlighted ? "text-primary" : "text-foreground"
                    )}
                  >
                    {t.symbols.join(', ')}
                  </text>
                </g>
              )
            }

            const dx = toState.x - fromState.x
            const dy = toState.y - fromState.y
            const dist = Math.sqrt(dx * dx + dy * dy)
            const radius = 25
            const startX = fromState.x + (dx / dist) * radius
            const startY = fromState.y + (dy / dist) * radius
            const endX = toState.x - (dx / dist) * radius
            const endY = toState.y - (dy / dist) * radius

            // Check if there's a reverse transition
            const hasReverse = data.transitions.some(
              rt => rt.from === t.to && rt.to === t.from
            )
            
            // Curve the path if there's a reverse transition
            const midX = (startX + endX) / 2
            const midY = (startY + endY) / 2
            const offset = hasReverse ? 20 : 0
            const perpX = -(dy / dist) * offset
            const perpY = (dx / dist) * offset
            const ctrlX = midX + perpX
            const ctrlY = midY + perpY

            return (
              <g key={t.id}>
                <path
                  d={hasReverse 
                    ? `M ${startX} ${startY} Q ${ctrlX} ${ctrlY} ${endX} ${endY}`
                    : `M ${startX} ${startY} L ${endX} ${endY}`
                  }
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={isHighlighted ? 2 : 1.5}
                  className={isHighlighted ? "text-primary" : "text-muted-foreground"}
                  markerEnd={isHighlighted ? "url(#arrowhead-active-widget)" : "url(#arrowhead-widget)"}
                />
                <text
                  x={hasReverse ? ctrlX : midX}
                  y={hasReverse ? ctrlY - 5 : midY - 8}
                  textAnchor="middle"
                  className={cn(
                    "fill-current text-[10px] font-medium",
                    isHighlighted ? "text-primary" : "text-foreground"
                  )}
                >
                  {t.symbols.join(', ')}
                </text>
              </g>
            )
          })}

          {/* Start arrow */}
          {startState && (
            <line
              x1={startState.x - 50}
              y1={startState.y}
              x2={startState.x - 28}
              y2={startState.y}
              stroke="currentColor"
              strokeWidth={1.5}
              className="text-muted-foreground"
              markerEnd="url(#arrowhead-widget)"
            />
          )}

          {/* States */}
          {data.states.map(state => {
            const isActive = currentStateId === state.id
            return (
              <g key={state.id}>
                {/* Final state outer circle */}
                {state.isFinal && (
                  <circle
                    cx={state.x}
                    cy={state.y}
                    r={28}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    className={isActive ? "text-primary" : "text-muted-foreground"}
                  />
                )}
                {/* Main circle */}
                <motion.circle
                  cx={state.x}
                  cy={state.y}
                  r={22}
                  fill="currentColor"
                  stroke="currentColor"
                  strokeWidth={2}
                  className={cn(
                    isActive
                      ? "fill-primary/20 text-primary"
                      : "fill-background text-muted-foreground"
                  )}
                  animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.3 }}
                />
                {/* State label */}
                <text
                  x={state.x}
                  y={state.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className={cn(
                    "fill-current text-xs font-medium",
                    isActive ? "text-primary" : "text-foreground"
                  )}
                >
                  {state.name}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
