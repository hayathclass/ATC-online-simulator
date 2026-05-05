'use client'

import { useState, useMemo } from 'react'
import { Check, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface RegexWidgetProps {
  data: {
    pattern: string
    testStrings: string[]
  }
  onDataChange?: (data: any) => void
  isEditing?: boolean
}

export function RegexWidget({ data, onDataChange, isEditing = true }: RegexWidgetProps) {
  const [pattern, setPattern] = useState(data.pattern)
  const [testStrings, setTestStrings] = useState(data.testStrings.join('\n'))
  const [newTestString, setNewTestString] = useState('')

  const regex = useMemo(() => {
    try {
      return new RegExp(`^(${pattern})$`)
    } catch {
      return null
    }
  }, [pattern])

  const strings = testStrings.split('\n').filter(s => s.trim())

  const results = useMemo(() => {
    if (!regex) return strings.map(() => ({ match: false, error: true }))
    return strings.map(str => {
      try {
        return { match: regex.test(str), error: false }
      } catch {
        return { match: false, error: true }
      }
    })
  }, [regex, strings])

  const handlePatternChange = (newPattern: string) => {
    setPattern(newPattern)
    onDataChange?.({ ...data, pattern: newPattern })
  }

  const handleAddTestString = () => {
    if (newTestString.trim()) {
      const updated = [...strings, newTestString.trim()]
      setTestStrings(updated.join('\n'))
      setNewTestString('')
      onDataChange?.({ ...data, testStrings: updated })
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Pattern input */}
      <div className="border-b border-border/50 bg-muted/30 p-2">
        <div className="text-[10px] font-medium text-muted-foreground mb-1">Pattern</div>
        <Input
          value={pattern}
          onChange={(e) => handlePatternChange(e.target.value)}
          placeholder="Enter regex pattern..."
          className={cn(
            "h-8 font-mono text-sm bg-background",
            !regex && pattern && "border-red-500 focus-visible:ring-red-500"
          )}
          readOnly={!isEditing}
        />
        {!regex && pattern && (
          <div className="mt-1 text-[10px] text-red-400">Invalid regex pattern</div>
        )}
      </div>

      {/* Test strings */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="text-[10px] font-medium text-muted-foreground mb-2">Test Strings</div>
        <div className="space-y-1">
          {strings.map((str, i) => (
            <div
              key={i}
              className={cn(
                "flex items-center gap-2 rounded px-2 py-1.5 text-xs font-mono",
                results[i].error
                  ? "bg-yellow-500/10 text-yellow-400"
                  : results[i].match
                  ? "bg-green-500/10 text-green-400"
                  : "bg-red-500/10 text-red-400"
              )}
            >
              {results[i].match ? (
                <Check className="h-3 w-3 shrink-0" />
              ) : (
                <X className="h-3 w-3 shrink-0" />
              )}
              <span className="truncate">{str || '(empty string)'}</span>
            </div>
          ))}
        </div>

        {isEditing && (
          <div className="mt-2 flex gap-1">
            <Input
              value={newTestString}
              onChange={(e) => setNewTestString(e.target.value)}
              placeholder="Add test string..."
              className="h-7 text-xs bg-background"
              onKeyDown={(e) => e.key === 'Enter' && handleAddTestString()}
            />
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between border-t border-border/50 bg-muted/30 px-2 py-1.5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-[10px]">
            <Check className="h-3 w-3 text-green-400" />
            <span className="text-green-400">{results.filter(r => r.match).length}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px]">
            <X className="h-3 w-3 text-red-400" />
            <span className="text-red-400">{results.filter(r => !r.match && !r.error).length}</span>
          </div>
        </div>
        <div className="text-[10px] text-muted-foreground">
          {strings.length} test{strings.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  )
}
