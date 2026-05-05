"use client"

import { useAutomataStore } from '@/lib/store/automata-store'
import { validateDFA, getAutomatonStats } from '@/lib/algorithms/dfa'
import { validateNFA } from '@/lib/algorithms/nfa'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  CircleDot,
  ArrowRight,
  Hash,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function AutomatonInfo() {
  const { currentAutomaton } = useAutomataStore()

  if (!currentAutomaton) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Automaton Info</CardTitle>
          <CardDescription>
            Create an automaton to see its details here.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const stats = getAutomatonStats(currentAutomaton)
  const validation = currentAutomaton.type === 'dfa'
    ? validateDFA(currentAutomaton)
    : validateNFA(currentAutomaton)

  // Build transition table
  const transitionTable: { [from: string]: { [symbol: string]: string[] } } = {}
  currentAutomaton.states.forEach((state) => {
    transitionTable[state.id] = {}
    currentAutomaton.alphabet.forEach((symbol) => {
      transitionTable[state.id][symbol] = []
    })
    // Add epsilon column for epsilon-NFA
    if (currentAutomaton.type === 'epsilon-nfa') {
      transitionTable[state.id]['ε'] = []
    }
  })

  currentAutomaton.transitions.forEach((t) => {
    const symbol = t.symbol === '' ? 'ε' : t.symbol
    if (!transitionTable[t.from]) return
    if (!transitionTable[t.from][symbol]) {
      transitionTable[t.from][symbol] = []
    }
    transitionTable[t.from][symbol].push(t.to)
  })

  const symbols = currentAutomaton.type === 'epsilon-nfa'
    ? [...currentAutomaton.alphabet, 'ε']
    : currentAutomaton.alphabet

  return (
    <div className="space-y-4">
      {/* Statistics */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <CircleDot className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">States:</span>
              <span className="font-medium">{stats.stateCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Transitions:</span>
              <span className="font-medium">{stats.transitionCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Alphabet:</span>
              <span className="font-medium font-mono">
                {'{' + currentAutomaton.alphabet.join(', ') + '}'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Final:</span>
              <span className="font-medium">{stats.finalStateCount}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validation */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            Validation
            {validation.isValid ? (
              <Badge variant="default" className="bg-success text-success-foreground">
                Valid
              </Badge>
            ) : (
              <Badge variant="destructive">Invalid</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* DFA-specific validation */}
          {currentAutomaton.type === 'dfa' && 'isDeterministic' in validation && (
            <div className="flex flex-wrap gap-2">
              <Badge
                variant="outline"
                className={cn(
                  validation.isDeterministic
                    ? 'border-success text-success'
                    : 'border-destructive text-destructive'
                )}
              >
                {validation.isDeterministic ? 'Deterministic' : 'Non-deterministic'}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  validation.isComplete
                    ? 'border-success text-success'
                    : 'border-warning text-warning'
                )}
              >
                {validation.isComplete ? 'Complete' : 'Incomplete'}
              </Badge>
            </div>
          )}

          {/* Errors */}
          {validation.errors.length > 0 && (
            <div className="space-y-1">
              {validation.errors.map((error, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              ))}
            </div>
          )}

          {/* Warnings */}
          {validation.warnings.length > 0 && (
            <div className="space-y-1">
              {validation.warnings.map((warning, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-warning">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{warning}</span>
                </div>
              ))}
            </div>
          )}

          {validation.errors.length === 0 && validation.warnings.length === 0 && (
            <div className="flex items-center gap-2 text-sm text-success">
              <CheckCircle className="h-4 w-4" />
              <span>No issues found</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transition Table */}
      <Accordion type="single" collapsible defaultValue="table">
        <AccordionItem value="table" className="border rounded-lg">
          <AccordionTrigger className="px-4 hover:no-underline">
            Transition Table
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            {currentAutomaton.states.length > 0 && symbols.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-24">State</TableHead>
                      {symbols.map((symbol) => (
                        <TableHead key={symbol} className="text-center font-mono">
                          {symbol}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentAutomaton.states.map((state) => (
                      <TableRow key={state.id}>
                        <TableCell className="font-mono font-medium">
                          <span className="flex items-center gap-1">
                            {state.isStart && <span className="text-primary">→</span>}
                            {state.label}
                            {state.isFinal && <span className="text-primary">*</span>}
                          </span>
                        </TableCell>
                        {symbols.map((symbol) => {
                          const targets = transitionTable[state.id]?.[symbol] || []
                          const labels = targets.map(
                            (id) => currentAutomaton.states.find((s) => s.id === id)?.label || id
                          )
                          return (
                            <TableCell key={symbol} className="text-center font-mono text-sm">
                              {labels.length > 0 ? (
                                currentAutomaton.type === 'dfa' ? (
                                  labels[0]
                                ) : (
                                  `{${labels.join(',')}}`
                                )
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                          )
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Add states and transitions to see the transition table.
              </p>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Formal Definition */}
      <Accordion type="single" collapsible>
        <AccordionItem value="formal" className="border rounded-lg">
          <AccordionTrigger className="px-4 hover:no-underline">
            Formal Definition
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-2 text-sm font-mono bg-muted/50 rounded-lg p-4">
              <p>
                <span className="text-muted-foreground">M = (Q, Σ, δ, q₀, F)</span>
              </p>
              <Separator className="my-2" />
              <p>
                <span className="text-muted-foreground">Q = </span>
                {'{'}{currentAutomaton.states.map((s) => s.label).join(', ')}{'}'}
              </p>
              <p>
                <span className="text-muted-foreground">Σ = </span>
                {'{'}{currentAutomaton.alphabet.join(', ')}{'}'}
              </p>
              <p>
                <span className="text-muted-foreground">q₀ = </span>
                {currentAutomaton.states.find((s) => s.isStart)?.label || '(none)'}
              </p>
              <p>
                <span className="text-muted-foreground">F = </span>
                {'{'}{currentAutomaton.states.filter((s) => s.isFinal).map((s) => s.label).join(', ')}{'}'}
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
