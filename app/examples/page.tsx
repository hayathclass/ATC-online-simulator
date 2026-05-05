"use client"

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Toaster } from '@/components/ui/sonner'
import { useAutomataStore, type Automaton } from '@/lib/store/automata-store'
import { toast } from 'sonner'
import { CircleDot, GitBranch, ArrowRight } from 'lucide-react'

// Pre-built example automata
const dfaExamples: Automaton[] = [
  {
    id: 'dfa-ends-01',
    name: 'Strings ending with 01',
    type: 'dfa',
    states: [
      { id: 'q0', label: 'q0', isStart: true, isFinal: false, position: { x: 100, y: 200 } },
      { id: 'q1', label: 'q1', isStart: false, isFinal: false, position: { x: 300, y: 200 } },
      { id: 'q2', label: 'q2', isStart: false, isFinal: true, position: { x: 500, y: 200 } },
    ],
    transitions: [
      { id: 't1', from: 'q0', to: 'q0', symbol: '1' },
      { id: 't2', from: 'q0', to: 'q1', symbol: '0' },
      { id: 't3', from: 'q1', to: 'q1', symbol: '0' },
      { id: 't4', from: 'q1', to: 'q2', symbol: '1' },
      { id: 't5', from: 'q2', to: 'q0', symbol: '1' },
      { id: 't6', from: 'q2', to: 'q1', symbol: '0' },
    ],
    alphabet: ['0', '1'],
    startState: 'q0',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'dfa-even-zeros',
    name: 'Even number of 0s',
    type: 'dfa',
    states: [
      { id: 'q0', label: 'q0', isStart: true, isFinal: true, position: { x: 150, y: 200 } },
      { id: 'q1', label: 'q1', isStart: false, isFinal: false, position: { x: 450, y: 200 } },
    ],
    transitions: [
      { id: 't1', from: 'q0', to: 'q1', symbol: '0' },
      { id: 't2', from: 'q0', to: 'q0', symbol: '1' },
      { id: 't3', from: 'q1', to: 'q0', symbol: '0' },
      { id: 't4', from: 'q1', to: 'q1', symbol: '1' },
    ],
    alphabet: ['0', '1'],
    startState: 'q0',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'dfa-divisible-3',
    name: 'Binary numbers divisible by 3',
    type: 'dfa',
    states: [
      { id: 'q0', label: 'q0', isStart: true, isFinal: true, position: { x: 100, y: 200 } },
      { id: 'q1', label: 'q1', isStart: false, isFinal: false, position: { x: 300, y: 100 } },
      { id: 'q2', label: 'q2', isStart: false, isFinal: false, position: { x: 300, y: 300 } },
    ],
    transitions: [
      { id: 't1', from: 'q0', to: 'q0', symbol: '0' },
      { id: 't2', from: 'q0', to: 'q1', symbol: '1' },
      { id: 't3', from: 'q1', to: 'q2', symbol: '0' },
      { id: 't4', from: 'q1', to: 'q0', symbol: '1' },
      { id: 't5', from: 'q2', to: 'q1', symbol: '0' },
      { id: 't6', from: 'q2', to: 'q2', symbol: '1' },
    ],
    alphabet: ['0', '1'],
    startState: 'q0',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'dfa-contains-ab',
    name: 'Contains substring "ab"',
    type: 'dfa',
    states: [
      { id: 'q0', label: 'q0', isStart: true, isFinal: false, position: { x: 100, y: 200 } },
      { id: 'q1', label: 'q1', isStart: false, isFinal: false, position: { x: 300, y: 200 } },
      { id: 'q2', label: 'q2', isStart: false, isFinal: true, position: { x: 500, y: 200 } },
    ],
    transitions: [
      { id: 't1', from: 'q0', to: 'q1', symbol: 'a' },
      { id: 't2', from: 'q0', to: 'q0', symbol: 'b' },
      { id: 't3', from: 'q1', to: 'q1', symbol: 'a' },
      { id: 't4', from: 'q1', to: 'q2', symbol: 'b' },
      { id: 't5', from: 'q2', to: 'q2', symbol: 'a' },
      { id: 't6', from: 'q2', to: 'q2', symbol: 'b' },
    ],
    alphabet: ['a', 'b'],
    startState: 'q0',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
]

const nfaExamples: Automaton[] = [
  {
    id: 'nfa-ends-ab',
    name: 'Strings ending with "ab"',
    type: 'nfa',
    states: [
      { id: 'q0', label: 'q0', isStart: true, isFinal: false, position: { x: 100, y: 200 } },
      { id: 'q1', label: 'q1', isStart: false, isFinal: false, position: { x: 300, y: 200 } },
      { id: 'q2', label: 'q2', isStart: false, isFinal: true, position: { x: 500, y: 200 } },
    ],
    transitions: [
      { id: 't1', from: 'q0', to: 'q0', symbol: 'a' },
      { id: 't2', from: 'q0', to: 'q0', symbol: 'b' },
      { id: 't3', from: 'q0', to: 'q1', symbol: 'a' },
      { id: 't4', from: 'q1', to: 'q2', symbol: 'b' },
    ],
    alphabet: ['a', 'b'],
    startState: 'q0',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'nfa-third-last-1',
    name: 'Third-to-last symbol is 1',
    type: 'nfa',
    states: [
      { id: 'q0', label: 'q0', isStart: true, isFinal: false, position: { x: 100, y: 200 } },
      { id: 'q1', label: 'q1', isStart: false, isFinal: false, position: { x: 250, y: 200 } },
      { id: 'q2', label: 'q2', isStart: false, isFinal: false, position: { x: 400, y: 200 } },
      { id: 'q3', label: 'q3', isStart: false, isFinal: true, position: { x: 550, y: 200 } },
    ],
    transitions: [
      { id: 't1', from: 'q0', to: 'q0', symbol: '0' },
      { id: 't2', from: 'q0', to: 'q0', symbol: '1' },
      { id: 't3', from: 'q0', to: 'q1', symbol: '1' },
      { id: 't4', from: 'q1', to: 'q2', symbol: '0' },
      { id: 't5', from: 'q1', to: 'q2', symbol: '1' },
      { id: 't6', from: 'q2', to: 'q3', symbol: '0' },
      { id: 't7', from: 'q2', to: 'q3', symbol: '1' },
    ],
    alphabet: ['0', '1'],
    startState: 'q0',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
]

const epsilonNfaExamples: Automaton[] = [
  {
    id: 'enfa-a-star-b-star',
    name: 'a*b* (epsilon example)',
    type: 'epsilon-nfa',
    states: [
      { id: 'q0', label: 'q0', isStart: true, isFinal: false, position: { x: 100, y: 200 } },
      { id: 'q1', label: 'q1', isStart: false, isFinal: false, position: { x: 300, y: 200 } },
      { id: 'q2', label: 'q2', isStart: false, isFinal: true, position: { x: 500, y: 200 } },
    ],
    transitions: [
      { id: 't1', from: 'q0', to: 'q0', symbol: 'a' },
      { id: 't2', from: 'q0', to: 'q1', symbol: 'ε' },
      { id: 't3', from: 'q1', to: 'q1', symbol: 'b' },
      { id: 't4', from: 'q1', to: 'q2', symbol: 'ε' },
    ],
    alphabet: ['a', 'b'],
    startState: 'q0',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'enfa-decimal',
    name: 'Decimal numbers',
    type: 'epsilon-nfa',
    states: [
      { id: 'q0', label: 'q0', isStart: true, isFinal: false, position: { x: 100, y: 200 } },
      { id: 'q1', label: 'q1', isStart: false, isFinal: false, position: { x: 250, y: 150 } },
      { id: 'q2', label: 'q2', isStart: false, isFinal: false, position: { x: 250, y: 250 } },
      { id: 'q3', label: 'q3', isStart: false, isFinal: false, position: { x: 400, y: 200 } },
      { id: 'q4', label: 'q4', isStart: false, isFinal: false, position: { x: 550, y: 200 } },
      { id: 'q5', label: 'q5', isStart: false, isFinal: true, position: { x: 700, y: 200 } },
    ],
    transitions: [
      { id: 't1', from: 'q0', to: 'q1', symbol: 'ε' },
      { id: 't2', from: 'q0', to: 'q2', symbol: '+' },
      { id: 't3', from: 'q0', to: 'q2', symbol: '-' },
      { id: 't4', from: 'q1', to: 'q2', symbol: 'ε' },
      { id: 't5', from: 'q2', to: 'q3', symbol: 'd' },
      { id: 't6', from: 'q3', to: 'q3', symbol: 'd' },
      { id: 't7', from: 'q3', to: 'q4', symbol: '.' },
      { id: 't8', from: 'q4', to: 'q5', symbol: 'd' },
      { id: 't9', from: 'q5', to: 'q5', symbol: 'd' },
    ],
    alphabet: ['d', '+', '-', '.'],
    startState: 'q0',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
]

export default function ExamplesPage() {
  const router = useRouter()
  const { setCurrentAutomaton } = useAutomataStore()

  const handleLoadExample = (example: Automaton) => {
    setCurrentAutomaton(JSON.parse(JSON.stringify(example)))
    toast.success(`Loaded "${example.name}"`)
    
    // Navigate to the appropriate page
    if (example.type === 'dfa') {
      router.push('/dfa')
    } else if (example.type === 'nfa') {
      router.push('/nfa')
    } else if (example.type === 'epsilon-nfa') {
      router.push('/epsilon-nfa')
    }
  }

  const ExampleCard = ({ example }: { example: Automaton }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="hover:border-primary/50 transition-colors">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {example.type === 'dfa' ? (
                <CircleDot className="h-5 w-5 text-blue-500" />
              ) : (
                <GitBranch className="h-5 w-5 text-green-500" />
              )}
              <CardTitle className="text-base">{example.name}</CardTitle>
            </div>
            <Badge variant="secondary" className="uppercase text-xs">
              {example.type}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span>{example.states.length} states</span>
            <span>•</span>
            <span>{example.transitions.length} transitions</span>
            <span>•</span>
            <span className="font-mono">Σ = {'{'}{example.alphabet.join(', ')}{'}'}</span>
          </div>
          <Button
            onClick={() => handleLoadExample(example)}
            variant="outline"
            className="w-full"
          >
            Load Example
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header title="Examples Library" />
        <ScrollArea className="flex-1">
          <div className="p-6 max-w-5xl mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl font-bold mb-2">Example Automata</h1>
              <p className="text-muted-foreground">
                Pre-built automata to help you learn and experiment. Click to load and start simulating.
              </p>
            </div>

            <Tabs defaultValue="dfa" className="space-y-6">
              <TabsList>
                <TabsTrigger value="dfa">DFA Examples</TabsTrigger>
                <TabsTrigger value="nfa">NFA Examples</TabsTrigger>
                <TabsTrigger value="epsilon-nfa">ε-NFA Examples</TabsTrigger>
              </TabsList>

              <TabsContent value="dfa">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dfaExamples.map((example, index) => (
                    <motion.div
                      key={example.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <ExampleCard example={example} />
                    </motion.div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="nfa">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {nfaExamples.map((example, index) => (
                    <motion.div
                      key={example.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <ExampleCard example={example} />
                    </motion.div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="epsilon-nfa">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {epsilonNfaExamples.map((example, index) => (
                    <motion.div
                      key={example.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <ExampleCard example={example} />
                    </motion.div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  )
}
