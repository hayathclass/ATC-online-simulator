"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAutomataStore } from '@/lib/store/automata-store'
import { simulateDFA } from '@/lib/algorithms/dfa'
import { simulateNFA } from '@/lib/algorithms/nfa'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Check, X, FlaskConical, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TestResult {
  string: string
  accepted: boolean
}

export function BatchTester() {
  const { currentAutomaton } = useAutomataStore()
  const [testStrings, setTestStrings] = useState('')
  const [results, setResults] = useState<TestResult[]>([])
  const [generatedStrings, setGeneratedStrings] = useState<{
    accepted: string[]
    rejected: string[]
  }>({ accepted: [], rejected: [] })

  const handleBatchTest = () => {
    if (!currentAutomaton) return

    const strings = testStrings
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 || s === '')

    const testResults: TestResult[] = strings.map((str) => {
      const input = str === 'ε' || str === 'epsilon' ? '' : str

      if (currentAutomaton.type === 'dfa') {
        const { accepted } = simulateDFA(currentAutomaton, input)
        return { string: str || 'ε', accepted }
      } else {
        const { accepted } = simulateNFA(currentAutomaton, input)
        return { string: str || 'ε', accepted }
      }
    })

    setResults(testResults)
  }

  const handleGenerateStrings = () => {
    if (!currentAutomaton) return

    const alphabet = currentAutomaton.alphabet.length > 0 
      ? currentAutomaton.alphabet 
      : ['0', '1']

    const maxLength = 5
    const accepted: string[] = []
    const rejected: string[] = []

    // Generate all strings up to maxLength
    const generateStrings = (current: string): void => {
      if (current.length > maxLength) return

      // Test current string
      const input = current
      let isAccepted: boolean

      if (currentAutomaton.type === 'dfa') {
        isAccepted = simulateDFA(currentAutomaton, input).accepted
      } else {
        isAccepted = simulateNFA(currentAutomaton, input).accepted
      }

      if (isAccepted) {
        if (accepted.length < 20) {
          accepted.push(current || 'ε')
        }
      } else {
        if (rejected.length < 20) {
          rejected.push(current || 'ε')
        }
      }

      // Generate longer strings
      for (const symbol of alphabet) {
        if (accepted.length >= 20 && rejected.length >= 20) return
        generateStrings(current + symbol)
      }
    }

    generateStrings('')
    setGeneratedStrings({ accepted, rejected })
  }

  const acceptedCount = results.filter((r) => r.accepted).length
  const rejectedCount = results.filter((r) => !r.accepted).length

  return (
    <div className="space-y-4 p-4 bg-card rounded-lg border border-border">
      <h3 className="font-semibold text-lg">Testing Tools</h3>

      <Tabs defaultValue="batch" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="batch">
            <FlaskConical className="h-4 w-4 mr-2" />
            Batch Test
          </TabsTrigger>
          <TabsTrigger value="generate">
            <Sparkles className="h-4 w-4 mr-2" />
            Generate
          </TabsTrigger>
        </TabsList>

        <TabsContent value="batch" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="test-strings">Test Strings (one per line)</Label>
            <Textarea
              id="test-strings"
              value={testStrings}
              onChange={(e) => setTestStrings(e.target.value)}
              placeholder="Enter strings to test, one per line...&#10;&#10;Example:&#10;01&#10;0011&#10;101&#10;ε (for empty string)"
              rows={6}
              className="font-mono text-sm"
            />
          </div>

          <Button
            onClick={handleBatchTest}
            disabled={!currentAutomaton || !testStrings.trim()}
            className="w-full"
          >
            <FlaskConical className="h-4 w-4 mr-2" />
            Run Tests
          </Button>

          <AnimatePresence>
            {results.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-4 text-sm">
                  <Badge variant="default" className="bg-success text-success-foreground">
                    {acceptedCount} Accepted
                  </Badge>
                  <Badge variant="destructive">
                    {rejectedCount} Rejected
                  </Badge>
                </div>

                <ScrollArea className="h-48 rounded border border-border">
                  <div className="p-2 space-y-1">
                    {results.map((result, index) => (
                      <motion.div
                        key={index}
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className={cn(
                          "flex items-center justify-between px-3 py-2 rounded text-sm font-mono",
                          result.accepted
                            ? "bg-success/10 text-success"
                            : "bg-destructive/10 text-destructive"
                        )}
                      >
                        <span>{result.string}</span>
                        {result.accepted ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="generate" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Generate example strings that are accepted or rejected by the automaton.
          </p>

          <Button
            onClick={handleGenerateStrings}
            disabled={!currentAutomaton}
            className="w-full"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Generate Examples
          </Button>

          <AnimatePresence>
            {(generatedStrings.accepted.length > 0 || generatedStrings.rejected.length > 0) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-success">
                    <Check className="h-4 w-4" />
                    Accepted Strings ({generatedStrings.accepted.length})
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {generatedStrings.accepted.map((str, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="font-mono bg-success/10 text-success border-success/30"
                      >
                        {str}
                      </Badge>
                    ))}
                    {generatedStrings.accepted.length === 0 && (
                      <span className="text-sm text-muted-foreground">None found</span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-destructive">
                    <X className="h-4 w-4" />
                    Rejected Strings ({generatedStrings.rejected.length})
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {generatedStrings.rejected.map((str, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="font-mono bg-destructive/10 text-destructive border-destructive/30"
                      >
                        {str}
                      </Badge>
                    ))}
                    {generatedStrings.rejected.length === 0 && (
                      <span className="text-sm text-muted-foreground">None found</span>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>
      </Tabs>
    </div>
  )
}
