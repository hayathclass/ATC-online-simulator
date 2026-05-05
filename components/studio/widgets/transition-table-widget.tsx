'use client'

import { cn } from '@/lib/utils'

interface TransitionTableWidgetProps {
  data: {
    states: string[]
    alphabet: string[]
    transitions: Record<string, string>
    startState: string
    finalStates: string[]
  }
  onDataChange?: (data: any) => void
  isEditing?: boolean
}

export function TransitionTableWidget({ data, onDataChange, isEditing = true }: TransitionTableWidgetProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border/50 bg-muted/30 px-3 py-2">
        <div className="text-xs font-medium">Transition Table</div>
        <div className="mt-0.5 text-[10px] text-muted-foreground">
          δ: Q × Σ → Q
        </div>
      </div>

      <div className="flex-1 overflow-auto p-2">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="border border-border bg-muted/50 px-2 py-1.5 text-left font-medium">
                State
              </th>
              {data.alphabet.map(symbol => (
                <th
                  key={symbol}
                  className="border border-border bg-muted/50 px-2 py-1.5 text-center font-mono font-medium"
                >
                  {symbol}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.states.map(state => (
              <tr key={state}>
                <td className={cn(
                  "border border-border px-2 py-1.5 font-mono",
                  state === data.startState && "bg-blue-500/10",
                  data.finalStates.includes(state) && "bg-green-500/10"
                )}>
                  <div className="flex items-center gap-1">
                    {state === data.startState && (
                      <span className="text-[8px] text-blue-400">→</span>
                    )}
                    {data.finalStates.includes(state) && (
                      <span className="text-[8px] text-green-400">*</span>
                    )}
                    {state}
                  </div>
                </td>
                {data.alphabet.map(symbol => {
                  const key = `${state},${symbol}`
                  const nextState = data.transitions[key] || '-'
                  return (
                    <td
                      key={symbol}
                      className="border border-border px-2 py-1.5 text-center font-mono"
                    >
                      {nextState}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t border-border/50 bg-muted/30 px-3 py-1.5">
        <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <span className="text-blue-400">→</span>
            <span>Start</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-green-400">*</span>
            <span>Final</span>
          </div>
          <div className="ml-auto">
            |Q| = {data.states.length}, |Σ| = {data.alphabet.length}
          </div>
        </div>
      </div>
    </div>
  )
}
