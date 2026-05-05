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

interface NFAWidgetProps {
  data: {
    states: State[]
    transitions: Transition[]
    alphabet: string[]
  }
  onDataChange?: (data: any) => void
  isEditing?: boolean
}

export function NFAWidget({ data, onDataChange, isEditing = true }: NFAWidgetProps) {
  const [testString, setTestString] = useState('')
  const [currentStateIds, setCurrentStateIds] = useState<Set<string>>(new Set())
  const [inputIndex, setInputIndex] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<'accept' | 'reject' | null>(null)
  const [highlightedTransitions, setHighlightedTransitions] = useState<Set<string>>(new Set())

  const startState = data.states.find(s => s.isStart)

  // Compute epsilon closure
  const epsilonClosure = useCallback((stateIds: Set<string>): Set<string> => {
    const closure = new Set(stateIds)
    const stack = Array.from(stateIds)
    
    while (stack.length > 0) {
      const stateId = stack.pop()!
      const epsilonTransitions = data.transitions.filter(
        t => t.from === stateId && t.symbols.includes('ε')
      )
      
      for (const t of epsilonTransitions) {
        if (!closure.has(t.to)) {
          closure.add(t.to)
          stack.push(t.to)
        }
      }
    }
    
    return closure
  }, [data.transitions])

  const reset = useCallback(() => {
    const initial = startState ? epsilonClosure(new Set([startState.id])) : new Set<string>()
    setCurrentStateIds(initial)
    setInputIndex(0)
    setIsRunning(false)
    setResult(null)
    setHighlightedTransitions(new Set())
  }, [startState, epsilonClosure])

  const step = useCallback(() => {
    if (inputIndex >= testString.length) {
      // Check if any current state is final
      const hasAccepting = Array.from(currentStateIds).some(id => {
        const state = data.states.find(s => s.id === id)
        return state?.isFinal
      })
      setResult(hasAccepting ? 'accept' : 'reject')
      setIsRunning(false)
      return
    }

    const symbol = testString[inputIndex]
    const nextStates = new Set<string>()
    const usedTransitions = new Set<string>()

    for (const stateId of currentStateIds) {
      const transitions = data.transitions.filter(
        t => t.from === stateId && t.symbols.includes(symbol)
      )
      
      for (const t of transitions) {
        nextStates.add(t.to)
        usedTransitions.add(t.id)
      }
    }

    if (nextStates.size === 0) {
      setResult('reject')
      setIsRunning(false)
      return
    }

    setHighlightedTransitions(usedTransitions)
    
    setTimeout(() => {
      const closedStates = epsilonClosure(nextStates)
      setCurrentStateIds(closedStates)
      setInputIndex(prev => prev + 1)
      setHighlightedTransitions(new Set())
    }, 300)
  }, [currentStateIds, inputIndex, testString, data, epsilonClosure])

  const handlePlay = () => {
    if (result !== null) {
      reset()
      setTimeout(() => {
        const initial = startState ? epsilonClosure(new Set([startState.id])) : new Set<string>()
        setCurrentStateIds(initial)
        setIsRunning(true)
      }, 100)
    } else if (!isRunning) {
      reset()
      setTimeout(() => {
        const initial = startState ? epsilonClosure(new Set([startState.id])) : new Set<string>()
        setCurrentStateIds(initial)
        setIsRunning(true)
      }, 100)
    } else {
      setIsRunning(false)
    }
  }

  // Calculate SVG viewBox
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

      {/* Current states indicator */}
      {currentStateIds.size > 0 && (
        <div className="flex items-center gap-1 border-b border-border/50 bg-muted/20 px-2 py-1">
          <span className="text-[10px] text-muted-foreground">Active:</span>
          {Array.from(currentStateIds).map(id => {
            const state = data.states.find(s => s.id === id)
            return (
              <span
                key={id}
                className={cn(
                  "rounded px-1.5 py-0.5 text-[10px] font-medium",
                  state?.isFinal
                    ? "bg-green-500/20 text-green-400"
                    : "bg-primary/20 text-primary"
                )}
              >
                {state?.name}
              </span>
            )
          })}
        </div>
      )}

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
              id="arrowhead-nfa-widget"
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
              id="arrowhead-nfa-active-widget"
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

            const isHighlighted = highlightedTransitions.has(t.id)
            const isSelfLoop = t.from === t.to
            const isEpsilon = t.symbols.includes('ε')

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
                    strokeDasharray={isEpsilon ? "4 2" : undefined}
                    className={isHighlighted ? "text-primary" : "text-muted-foreground"}
                    markerEnd={isHighlighted ? "url(#arrowhead-nfa-active-widget)" : "url(#arrowhead-nfa-widget)"}
                  />
                  <text
                    x={x}
                    y={y - 35}
                    textAnchor="middle"
                    className={cn(
                      "fill-current text-[10px] font-medium",
                      isHighlighted ? "text-primary" : "text-foreground",
                      isEpsilon && "italic"
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

            const hasReverse = data.transitions.some(
              rt => rt.from === t.to && rt.to === t.from
            )
            
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
                  strokeDasharray={isEpsilon ? "4 2" : undefined}
                  className={isHighlighted ? "text-primary" : "text-muted-foreground"}
                  markerEnd={isHighlighted ? "url(#arrowhead-nfa-active-widget)" : "url(#arrowhead-nfa-widget)"}
                />
                <text
                  x={hasReverse ? ctrlX : midX}
                  y={hasReverse ? ctrlY - 5 : midY - 8}
                  textAnchor="middle"
                  className={cn(
                    "fill-current text-[10px] font-medium",
                    isHighlighted ? "text-primary" : "text-foreground",
                    isEpsilon && "italic"
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
              markerEnd="url(#arrowhead-nfa-widget)"
            />
          )}

          {/* States */}
          {data.states.map(state => {
            const isActive = currentStateIds.has(state.id)
            return (
              <g key={state.id}>
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
