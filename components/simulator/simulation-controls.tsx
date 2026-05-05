"use client"

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAutomataStore } from '@/lib/store/automata-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function SimulationControls() {
  const {
    currentAutomaton,
    simulation,
    startSimulation,
    stepForward,
    stepBackward,
    pauseSimulation,
    resumeSimulation,
    resetSimulation,
  } = useAutomataStore()

  const [inputString, setInputString] = useState('')
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Auto-play simulation
  useEffect(() => {
    if (simulation.isRunning && !simulation.isPaused && simulation.result === 'running') {
      intervalRef.current = setInterval(() => {
        stepForward()
      }, simulation.speed)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [simulation.isRunning, simulation.isPaused, simulation.result, simulation.speed, stepForward])

  const handleStart = () => {
    if (!currentAutomaton?.startState) return
    startSimulation(inputString)
  }

  const handleReset = () => {
    resetSimulation()
    setInputString('')
  }

  const canStart = currentAutomaton?.startState && !simulation.isRunning
  const canStep = simulation.isRunning && simulation.result === 'running'

  return (
    <div className="space-y-4 p-4 bg-card rounded-lg border border-border">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Simulation</h3>
        <AnimatePresence mode="wait">
          {simulation.result && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <Badge
                variant={simulation.result === 'accepted' ? 'default' : 'destructive'}
                className={cn(
                  "text-sm px-3 py-1",
                  simulation.result === 'accepted' && "bg-success text-success-foreground"
                )}
              >
                {simulation.result === 'accepted' ? '✓ ACCEPTED' : '✗ REJECTED'}
              </Badge>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input String */}
      <div className="space-y-2">
        <Label htmlFor="input-string">Input String</Label>
        <div className="flex gap-2">
          <Input
            id="input-string"
            value={inputString}
            onChange={(e) => setInputString(e.target.value)}
            placeholder="Enter string to test (e.g., 01101)"
            disabled={simulation.isRunning}
            className="font-mono"
          />
          <Button
            onClick={handleStart}
            disabled={!canStart}
            className="shrink-0"
          >
            <Zap className="h-4 w-4 mr-2" />
            Run
          </Button>
        </div>
      </div>

      {/* Input Tape Visualization */}
      {simulation.isRunning && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="overflow-hidden"
        >
          <Label className="mb-2 block">Input Tape</Label>
          <div className="flex items-center gap-1 overflow-x-auto py-2">
            {simulation.inputString.split('').map((char, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className={cn(
                  "w-10 h-10 flex items-center justify-center font-mono text-lg border-2 rounded transition-all duration-200",
                  index < simulation.inputIndex
                    ? "bg-muted text-muted-foreground border-muted"
                    : index === simulation.inputIndex
                    ? "bg-warning text-warning-foreground border-warning scale-110"
                    : "bg-card border-border"
                )}
              >
                {char}
              </motion.div>
            ))}
            {simulation.inputString.length === 0 && (
              <div className="w-10 h-10 flex items-center justify-center font-mono text-lg border-2 border-dashed border-muted rounded text-muted-foreground">
                ε
              </div>
            )}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            Position: {simulation.inputIndex} / {simulation.inputString.length}
          </div>
        </motion.div>
      )}

      {/* Playback Controls */}
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={stepBackward}
          disabled={!simulation.isRunning || simulation.history.length <= 1}
          title="Step Back"
        >
          <SkipBack className="h-4 w-4" />
        </Button>

        {simulation.isRunning && simulation.result === 'running' ? (
          simulation.isPaused ? (
            <Button
              size="icon"
              onClick={resumeSimulation}
              title="Resume"
            >
              <Play className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              size="icon"
              onClick={pauseSimulation}
              title="Pause"
            >
              <Pause className="h-4 w-4" />
            </Button>
          )
        ) : (
          <Button
            size="icon"
            onClick={handleStart}
            disabled={!canStart}
            title="Start"
          >
            <Play className="h-4 w-4" />
          </Button>
        )}

        <Button
          variant="outline"
          size="icon"
          onClick={stepForward}
          disabled={!canStep}
          title="Step Forward"
        >
          <SkipForward className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={handleReset}
          disabled={!simulation.isRunning && !simulation.result}
          title="Reset"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* Current States Display */}
      {simulation.isRunning && (
        <div className="space-y-2">
          <Label>Current State(s)</Label>
          <div className="flex flex-wrap gap-2">
            {simulation.currentStates.map((stateId) => {
              const state = currentAutomaton?.states.find((s) => s.id === stateId)
              return (
                <Badge
                  key={stateId}
                  variant="secondary"
                  className={cn(
                    "font-mono",
                    state?.isFinal && "bg-primary text-primary-foreground"
                  )}
                >
                  {state?.label || stateId}
                  {state?.isFinal && ' ★'}
                </Badge>
              )
            })}
            {simulation.currentStates.length === 0 && (
              <Badge variant="destructive">No active states (dead)</Badge>
            )}
          </div>
        </div>
      )}

      {/* History/Trace */}
      {simulation.history.length > 1 && (
        <div className="space-y-2">
          <Label>Trace</Label>
          <div className="text-sm font-mono text-muted-foreground bg-muted/50 rounded p-2 max-h-24 overflow-y-auto">
            {simulation.history.map((step, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-4">{index}.</span>
                <span>
                  {'{'}{step.states.map(id => currentAutomaton?.states.find(s => s.id === id)?.label).join(', ')}{'}'}
                </span>
                {step.symbol && (
                  <span className="text-primary">
                    --{step.symbol}--{'>'} 
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
