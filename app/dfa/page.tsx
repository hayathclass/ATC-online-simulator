"use client"

import { useEffect, useState } from 'react'
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
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'

export default function DFAPage() {
  const currentAutomaton = useAutomataStore((s) => s.currentAutomaton)
  const createNewAutomaton = useAutomataStore((s) => s.createNewAutomaton)
  const [isHydrated, setIsHydrated] = useState(false)

  // Wait for client-side hydration
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Create a new DFA if none exists or wrong type
  useEffect(() => {
    if (isHydrated && (!currentAutomaton || currentAutomaton.type !== 'dfa')) {
      createNewAutomaton('dfa', 'My DFA')
    }
  }, [isHydrated])

  // Show nothing until hydrated to prevent SSR mismatch
  if (!isHydrated) {
    return null
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header title="DFA Simulator" />
        <div className="flex-1 overflow-hidden">
          <ResizablePanelGroup direction="horizontal">
            {/* Main Canvas */}
            <ResizablePanel defaultSize={70} minSize={50}>
              <ReactFlowProvider>
                <AutomataCanvas key={currentAutomaton?.id} />
              </ReactFlowProvider>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Right Sidebar */}
            <ResizablePanel defaultSize={30} minSize={25} maxSize={45}>
              <ScrollArea className="h-[calc(100vh-3.5rem)]">
                <div className="p-4 space-y-4">
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
