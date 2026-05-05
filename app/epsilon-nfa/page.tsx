"use client"

import { useEffect } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { Header } from '@/components/layout/header'
import { AutomataCanvas } from '@/components/canvas/automata-canvas'
import { SimulationControls } from '@/components/simulator/simulation-controls'
import { BatchTester } from '@/components/simulator/batch-tester'
import { AutomatonInfo } from '@/components/editor/automaton-info'
import { useAutomataStore } from '@/lib/store/automata-store'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Toaster } from '@/components/ui/sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Info } from 'lucide-react'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'

export default function EpsilonNFAPage() {
  const { currentAutomaton, createNewAutomaton } = useAutomataStore()

  useEffect(() => {
    if (!currentAutomaton || currentAutomaton.type !== 'epsilon-nfa') {
      createNewAutomaton('epsilon-nfa', 'My ε-NFA')
    }
  }, [])

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header title="ε-NFA Simulator" />
        <div className="flex-1 overflow-hidden">
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={70} minSize={50}>
              <ReactFlowProvider>
                <AutomataCanvas />
              </ReactFlowProvider>
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize={30} minSize={25} maxSize={45}>
              <ScrollArea className="h-[calc(100vh-3.5rem)]">
                <div className="p-4 space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>ε-NFA Mode</AlertTitle>
                    <AlertDescription>
                      Use &apos;ε&apos; or leave empty for epsilon transitions. 
                      Epsilon closure is computed automatically at each step.
                    </AlertDescription>
                  </Alert>
                  <SimulationControls />
                  <BatchTester />
                  <AutomatonInfo />
                </div>
              </ScrollArea>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  )
}
