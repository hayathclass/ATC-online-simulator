'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  RotateCcw,
  Zap,
  X 
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SimulationPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function SimulationPanel({ isOpen, onClose }: SimulationPanelProps) {
  const [inputString, setInputString] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [speed, setSpeed] = useState(500)
  const [result, setResult] = useState<'accepted' | 'rejected' | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Mock states for demonstration
  const [states] = useState(['q0', 'q1', 'q2'])
  const [currentState, setCurrentState] = useState('q0')

  // Auto-play simulation
  useEffect(() => {
    if (isRunning && !isPaused && !result) {
      intervalRef.current = setInterval(() => {
        handleStepForward()
      }, speed)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, isPaused, result, speed, currentStep])

  const handleStart = () => {
    if (!inputString) return
    setIsRunning(true)
    setIsPaused(false)
    setResult(null)
    setCurrentStep(0)
    setCurrentState('q0')
  }

  const handleStepForward = () => {
    if (currentStep < inputString.length) {
      setCurrentStep(currentStep + 1)
      // Cycle through states for demo
      const nextIdx = (currentStep + 1) % states.length
      setCurrentState(states[nextIdx])
      
      // Check if accepted (ends in q2 for demo)
      if (currentStep + 1 === inputString.length) {
        setResult(states[nextIdx] === 'q2' ? 'accepted' : 'rejected')
        setIsRunning(false)
      }
    }
  }

  const handleStepBackward = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      const prevIdx = (currentStep - 1) % states.length
      setCurrentState(states[prevIdx])
      setResult(null)
    }
  }

  const handleReset = () => {
    setIsRunning(false)
    setIsPaused(false)
    setResult(null)
    setCurrentStep(0)
    setCurrentState('q0')
    setInputString('')
  }

  const getSpeedLabel = (speed: number) => {
    if (speed >= 1000) return 'Slow'
    if (speed >= 500) return 'Normal'
    if (speed >= 250) return 'Fast'
    return 'Very Fast'
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      className="absolute right-0 top-0 h-full w-[340px] border-l border-border bg-card/95 backdrop-blur overflow-y-auto"
    >
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Simulation</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Result Badge */}
        <AnimatePresence mode="wait">
          {result && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <Badge
                variant={result === 'accepted' ? 'default' : 'destructive'}
                className={cn(
                  "text-sm px-3 py-1 w-full justify-center",
                  result === 'accepted' && "bg-green-600"
                )}
              >
                {result === 'accepted' ? '✓ ACCEPTED' : '✗ REJECTED'}
              </Badge>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input String */}
        <div className="space-y-2">
          <Label htmlFor="input-string">Input String</Label>
          <div className="flex gap-2">
            <Input
              id="input-string"
              value={inputString}
              onChange={(e) => setInputString(e.target.value)}
              placeholder="e.g., 01101"
              disabled={isRunning}
              className="font-mono"
            />
            <Button
              onClick={handleStart}
              disabled={isRunning || !inputString}
              className="shrink-0"
            >
              <Zap className="h-4 w-4 mr-2" />
              Run
            </Button>
          </div>
        </div>

        {/* Input Tape Visualization */}
        {isRunning && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="overflow-hidden"
          >
            <Label className="mb-2 block">Input Tape</Label>
            <div className="flex items-center gap-1 overflow-x-auto py-2">
              {inputString.split('').map((char, index) => (
                <motion.div
                  key={index}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className={cn(
                    "w-10 h-10 flex items-center justify-center font-mono text-lg border-2 rounded transition-all duration-200",
                    index < currentStep
                      ? "bg-gray-200 text-gray-600 border-gray-300"
                      : index === currentStep
                      ? "bg-yellow-400 text-yellow-900 border-yellow-500 scale-110"
                      : "bg-white border-gray-300"
                  )}
                >
                  {char}
                </motion.div>
              ))}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Position: {currentStep} / {inputString.length}
            </div>
          </motion.div>
        )}

        {/* Playback Controls */}
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleStepBackward}
            disabled={!isRunning || currentStep === 0}
            title="Step Back"
          >
            <SkipBack className="h-4 w-4" />
          </Button>

          {isRunning && !result ? (
            isPaused ? (
              <Button
                size="icon"
                onClick={() => setIsPaused(false)}
                title="Resume"
              >
                <Play className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                size="icon"
                onClick={() => setIsPaused(true)}
                title="Pause"
              >
                <Pause className="h-4 w-4" />
              </Button>
            )
          ) : (
            <Button
              size="icon"
              onClick={handleStart}
              disabled={!inputString}
              title="Start"
            >
              <Play className="h-4 w-4" />
            </Button>
          )}

          <Button
            variant="outline"
            size="icon"
            onClick={handleStepForward}
            disabled={!isRunning || currentStep >= inputString.length || !!result}
            title="Step Forward"
          >
            <SkipForward className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={handleReset}
            disabled={!isRunning && !result}
            title="Reset"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        {/* Speed Control */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Speed</Label>
            <span className="text-sm text-muted-foreground">
              {getSpeedLabel(speed)}
            </span>
          </div>
          <Slider
            value={[1100 - speed]}
            onValueChange={([value]) => setSpeed(1100 - value)}
            min={100}
            max={1000}
            step={100}
            className="w-full"
          />
        </div>

        {/* Current State Display */}
        {isRunning && (
          <div className="space-y-2">
            <Label>Current State</Label>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant="secondary"
                className={cn(
                  "font-mono text-lg px-4 py-2",
                  currentState === 'q2' && "bg-blue-600 text-white"
                )}
              >
                {currentState}
              </Badge>
            </div>
          </div>
        )}

        {/* Trace */}
        {isRunning && currentStep > 0 && (
          <div className="space-y-2">
            <Label>Execution Trace</Label>
            <div className="text-sm font-mono bg-muted/50 rounded p-3 max-h-48 overflow-y-auto space-y-1">
              <div className="text-xs text-muted-foreground">Start: q0</div>
              {inputString.split('').slice(0, currentStep).map((symbol, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-4">{idx + 1}.</span>
                  <span>q{idx}</span>
                  <span className="text-blue-600">--{symbol}--→</span>
                  <span>q{idx + 1}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
