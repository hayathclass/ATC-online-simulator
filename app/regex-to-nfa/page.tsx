"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Toaster } from '@/components/ui/sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useAutomataStore, type Automaton } from '@/lib/store/automata-store'
import { regexToNFA, validateRegex } from '@/lib/algorithms/regex'
import { toast } from 'sonner'
import {
  ArrowRightLeft,
  Play,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  GitBranch,
  Regex,
  Info,
} from 'lucide-react'

export default function RegexToNFAPage() {
  const router = useRouter()
  const { setCurrentAutomaton } = useAutomataStore()
  const [pattern, setPattern] = useState('')
  const [validation, setValidation] = useState<{ valid: boolean; error?: string } | null>(null)
  const [result, setResult] = useState<Automaton | null>(null)

  const handlePatternChange = (value: string) => {
    setPattern(value)
    setResult(null)
    if (value) {
      setValidation(validateRegex(value))
    } else {
      setValidation(null)
    }
  }

  const handleConvert = () => {
    if (!pattern || !validation?.valid) return

    const nfa = regexToNFA(pattern)
    if (nfa) {
      setResult(nfa)
      toast.success('Conversion completed!')
    } else {
      toast.error('Failed to convert regex')
    }
  }

  const handleLoadNFA = () => {
    if (!result) return
    setCurrentAutomaton(result)
    toast.success('NFA loaded into editor')
    router.push('/epsilon-nfa')
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header title="Regex to NFA" />
        <ScrollArea className="flex-1">
          <div className="p-6 max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <ArrowRightLeft className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Thompson&apos;s Construction</h1>
                <p className="text-muted-foreground">
                  Convert regular expressions to equivalent ε-NFA
                </p>
              </div>
            </div>

            {/* Input */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Regex className="h-5 w-5 text-primary" />
                  Regular Expression
                </CardTitle>
                <CardDescription>
                  Enter a regular expression to convert to an NFA
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pattern">Pattern</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">/</span>
                      <Input
                        id="pattern"
                        value={pattern}
                        onChange={(e) => handlePatternChange(e.target.value)}
                        placeholder="e.g., (a|b)*abb"
                        className="pl-6 pr-6 font-mono"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">/</span>
                    </div>
                    <Button
                      onClick={handleConvert}
                      disabled={!pattern || !validation?.valid}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Convert
                    </Button>
                  </div>
                  {validation && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {validation.valid ? (
                        <p className="text-sm text-success flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4" />
                          Valid regex pattern
                        </p>
                      ) : (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          {validation.error}
                        </p>
                      )}
                    </motion.div>
                  )}
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Supported Syntax</AlertTitle>
                  <AlertDescription>
                    <span className="font-mono text-sm">
                      a-z, 0-9, | (union), * (star), + (plus), ? (optional), () (grouping), ε (epsilon)
                    </span>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Result */}
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
                          <Regex className="h-8 w-8 text-purple-500" />
                          <div>
                            <div className="font-mono font-medium">/{pattern}/</div>
                            <div className="text-sm text-muted-foreground">
                              Regular Expression
                            </div>
                          </div>
                        </div>
                        <ArrowRight className="h-6 w-6 text-muted-foreground" />
                        <div className="flex items-center gap-3">
                          <GitBranch className="h-8 w-8 text-green-500" />
                          <div>
                            <div className="font-medium">ε-NFA</div>
                            <div className="text-sm text-muted-foreground">
                              {result.states.length} states, {result.transitions.length} transitions
                            </div>
                          </div>
                        </div>
                      </div>

                      <Button onClick={handleLoadNFA} className="w-full">
                        Load NFA into Editor
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>

                  {/* NFA Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Generated ε-NFA</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">States:</span>{' '}
                          <span className="font-medium">{result.states.length}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Transitions:</span>{' '}
                          <span className="font-medium">{result.transitions.length}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Alphabet:</span>{' '}
                          <span className="font-mono">{'{' + result.alphabet.join(', ') + '}'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Epsilon transitions:</span>{' '}
                          <span className="font-medium">
                            {result.transitions.filter((t) => t.symbol === 'ε').length}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>States</Label>
                        <div className="flex flex-wrap gap-2">
                          {result.states.map((state) => (
                            <Badge
                              key={state.id}
                              variant={state.isFinal ? 'default' : state.isStart ? 'secondary' : 'outline'}
                              className="font-mono"
                            >
                              {state.isStart && '→ '}
                              {state.label}
                              {state.isFinal && ' *'}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Transitions</Label>
                        <div className="max-h-48 overflow-y-auto space-y-1">
                          {result.transitions.map((t, i) => {
                            const fromState = result.states.find((s) => s.id === t.from)
                            const toState = result.states.find((s) => s.id === t.to)
                            return (
                              <div
                                key={i}
                                className="flex items-center gap-2 text-sm font-mono bg-muted/50 px-3 py-1.5 rounded"
                              >
                                <span>{fromState?.label}</span>
                                <span className="text-muted-foreground">--</span>
                                <Badge variant="outline" className="text-xs">
                                  {t.symbol || 'ε'}
                                </Badge>
                                <span className="text-muted-foreground">→</span>
                                <span>{toState?.label}</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Algorithm Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">About Thompson&apos;s Construction</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground space-y-2">
                      <p>
                        Thompson&apos;s construction converts a regular expression to an equivalent
                        ε-NFA by building small NFAs for each part of the regex and combining them.
                      </p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Single character: Creates 2 states with one transition</li>
                        <li>Union (a|b): Connects two NFAs with ε-transitions</li>
                        <li>Concatenation (ab): Links two NFAs in sequence</li>
                        <li>Kleene star (a*): Adds ε-transitions for repetition</li>
                      </ul>
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
