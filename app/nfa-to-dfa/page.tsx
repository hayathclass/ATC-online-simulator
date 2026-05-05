"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Toaster } from '@/components/ui/sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAutomataStore, type Automaton } from '@/lib/store/automata-store'
import { nfaToDFA, type NFAToDFAResult } from '@/lib/algorithms/nfa'
import { toast } from 'sonner'
import {
  ArrowRightLeft,
  Play,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  GitBranch,
  CircleDot,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function NFAToDFAPage() {
  const router = useRouter()
  const { currentAutomaton, setCurrentAutomaton } = useAutomataStore()
  const [result, setResult] = useState<NFAToDFAResult | null>(null)
  const [currentStep, setCurrentStep] = useState(0)

  const canConvert = currentAutomaton && 
    (currentAutomaton.type === 'nfa' || currentAutomaton.type === 'epsilon-nfa') &&
    currentAutomaton.states.length > 0 &&
    currentAutomaton.startState

  const handleConvert = () => {
    if (!currentAutomaton) return

    const conversionResult = nfaToDFA(currentAutomaton)
    setResult(conversionResult)
    setCurrentStep(0)
    toast.success('Conversion completed!')
  }

  const handleLoadDFA = () => {
    if (!result) return
    setCurrentAutomaton(result.dfa)
    toast.success('DFA loaded into editor')
    router.push('/dfa')
  }

  const handleNextStep = () => {
    if (!result) return
    setCurrentStep((prev) => Math.min(prev + 1, result.steps.length - 1))
  }

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header title="NFA to DFA Conversion" />
        <ScrollArea className="flex-1">
          <div className="p-6 max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <ArrowRightLeft className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Subset Construction</h1>
                <p className="text-muted-foreground">
                  Convert NFA to equivalent DFA using the subset construction algorithm
                </p>
              </div>
            </div>

            {/* Current Automaton Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Source Automaton</CardTitle>
                <CardDescription>
                  The NFA or ε-NFA to convert
                </CardDescription>
              </CardHeader>
              <CardContent>
                {currentAutomaton && (currentAutomaton.type === 'nfa' || currentAutomaton.type === 'epsilon-nfa') ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <GitBranch className="h-5 w-5 text-green-500" />
                        <span className="font-medium">{currentAutomaton.name}</span>
                      </div>
                      <Badge variant="secondary" className="uppercase">
                        {currentAutomaton.type}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">States:</span>{' '}
                        <span className="font-medium">{currentAutomaton.states.length}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Transitions:</span>{' '}
                        <span className="font-medium">{currentAutomaton.transitions.length}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Alphabet:</span>{' '}
                        <span className="font-mono">{'{' + currentAutomaton.alphabet.join(', ') + '}'}</span>
                      </div>
                    </div>
                    <Button onClick={handleConvert} disabled={!canConvert}>
                      <Play className="h-4 w-4 mr-2" />
                      Convert to DFA
                    </Button>
                  </div>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No NFA loaded</AlertTitle>
                    <AlertDescription>
                      Please create or load an NFA first from the{' '}
                      <Button variant="link" className="p-0 h-auto" onClick={() => router.push('/nfa')}>
                        NFA Simulator
                      </Button>{' '}
                      or{' '}
                      <Button variant="link" className="p-0 h-auto" onClick={() => router.push('/examples')}>
                        Examples
                      </Button>
                      .
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Conversion Result */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Summary */}
                  <Card className="border-success/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <CheckCircle2 className="h-5 w-5 text-success" />
                        Conversion Complete
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <GitBranch className="h-8 w-8 text-green-500" />
                          <div>
                            <div className="font-medium">NFA</div>
                            <div className="text-sm text-muted-foreground">
                              {currentAutomaton?.states.length} states
                            </div>
                          </div>
                        </div>
                        <ArrowRight className="h-6 w-6 text-muted-foreground" />
                        <div className="flex items-center gap-3">
                          <CircleDot className="h-8 w-8 text-blue-500" />
                          <div>
                            <div className="font-medium">DFA</div>
                            <div className="text-sm text-muted-foreground">
                              {result.dfa.states.length} states
                            </div>
                          </div>
                        </div>
                      </div>

                      <Button onClick={handleLoadDFA} className="w-full">
                        Load DFA into Editor
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Step-by-step */}
                  {result.steps.length > 0 && (
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">Construction Steps</CardTitle>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handlePrevStep}
                              disabled={currentStep === 0}
                            >
                              Previous
                            </Button>
                            <span className="text-sm text-muted-foreground px-2">
                              Step {currentStep + 1} of {result.steps.length}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleNextStep}
                              disabled={currentStep === result.steps.length - 1}
                            >
                              Next
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="p-4 bg-muted/50 rounded-lg font-mono text-sm">
                          <div className="mb-2">
                            <span className="text-muted-foreground">From state:</span>{' '}
                            <Badge variant="secondary">{result.steps[currentStep].dfaStateLabel}</Badge>
                          </div>
                          <div className="mb-2">
                            <span className="text-muted-foreground">On symbol:</span>{' '}
                            <Badge variant="outline" className="font-mono">
                              {result.steps[currentStep].symbol}
                            </Badge>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Goes to:</span>{' '}
                            <Badge variant="secondary">{result.steps[currentStep].targetLabel}</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* DFA Transition Table */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">DFA Transition Table</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-48">State</TableHead>
                              {result.dfa.alphabet.map((symbol) => (
                                <TableHead key={symbol} className="text-center font-mono">
                                  {symbol}
                                </TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {result.dfa.states.map((state) => (
                              <TableRow key={state.id}>
                                <TableCell className="font-mono">
                                  <span className="flex items-center gap-1">
                                    {state.isStart && <span className="text-primary">→</span>}
                                    {state.label}
                                    {state.isFinal && <span className="text-primary">*</span>}
                                  </span>
                                </TableCell>
                                {result.dfa.alphabet.map((symbol) => {
                                  const transition = result.dfa.transitions.find(
                                    (t) => t.from === state.id && t.symbol === symbol
                                  )
                                  const targetState = result.dfa.states.find(
                                    (s) => s.id === transition?.to
                                  )
                                  return (
                                    <TableCell key={symbol} className="text-center font-mono text-sm">
                                      {targetState?.label || '—'}
                                    </TableCell>
                                  )
                                })}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* State Mapping */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">State Mapping</CardTitle>
                      <CardDescription>
                        How NFA states map to DFA states
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {result.dfa.states.map((state) => {
                          const nfaStates = result.stateMapping.get(state.id) || []
                          return (
                            <div
                              key={state.id}
                              className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg"
                            >
                              <Badge variant="secondary" className="font-mono">
                                {state.label}
                              </Badge>
                              <ArrowRight className="h-4 w-4 text-muted-foreground" />
                              <div className="flex gap-2 flex-wrap">
                                {nfaStates.map((nfaId, i) => {
                                  const nfaState = currentAutomaton?.states.find((s) => s.id === nfaId)
                                  return (
                                    <Badge key={i} variant="outline" className="font-mono">
                                      {nfaState?.label || nfaId}
                                    </Badge>
                                  )
                                })}
                              </div>
                              {state.isFinal && (
                                <Badge className="ml-auto bg-success text-success-foreground">
                                  Final
                                </Badge>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  )
}
