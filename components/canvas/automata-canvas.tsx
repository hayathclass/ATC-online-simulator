"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Connection,
  type Node,
  type Edge,
  Panel,
  BackgroundVariant,
  useReactFlow,
  MarkerType,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { StateNode, type StateNodeData } from './state-node'
import { TransitionEdge, EdgeMarkers, type TransitionEdgeData } from './transition-edge'
import { useAutomataStore } from '@/lib/store/automata-store'
import { Button } from '@/components/ui/button'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, Play, Flag, Undo2, Redo2, Maximize2, MousePointer2, GitBranch, Zap } from 'lucide-react'

const nodeTypes = {
  state: StateNode,
} as const

const edgeTypes = {
  transition: TransitionEdge,
} as const

export function AutomataCanvas() {
  const {
    currentAutomaton,
    simulation,
    addState,
    updateState,
    deleteState,
    setStartState,
    toggleFinalState,
    addTransition,
    deleteTransition,
    undo,
    redo,
    history,
    historyIndex,
  } = useAutomataStore()

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<{ data: StateNodeData }>>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [transitionDialog, setTransitionDialog] = useState<{
    open: boolean
    from: string
    to: string
  }>({ open: false, from: '', to: '' })
  const [transitionSymbol, setTransitionSymbol] = useState('')
  
  // Floating toolbar state
  const [floatingToolbar, setFloatingToolbar] = useState<{ x: number; y: number; open: boolean }>({ 
    x: 0, 
    y: 0, 
    open: false 
  })
  
  // Inline transition input
  const [inlineTransition, setInlineTransition] = useState<{
    open: boolean
    from: string
    to: string
    x: number
    y: number
    symbol: string
  }>({ open: false, from: '', to: '', x: 0, y: 0, symbol: '' })
  
  // Command palette
  const [commandPalette, setCommandPalette] = useState(false)
  const [commandSearch, setCommandSearch] = useState('')

  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const { screenToFlowPosition, fitView } = useReactFlow()

  // Convert store automaton to React Flow nodes/edges
  const flowNodes = useMemo(() => {
    if (!currentAutomaton) return []

    return currentAutomaton.states.map((state) => ({
      id: state.id,
      type: 'state',
      position: state.position,
      data: {
        data: {
          label: state.label,
          isStart: state.isStart,
          isFinal: state.isFinal,
          isActive: simulation.currentStates.includes(state.id),
          isHighlighted: false,
        },
      },
      draggable: !simulation.isRunning,
    }))
  }, [currentAutomaton, simulation])

  // Generate edges with merged transitions (same direction only)
  const flowEdges = useMemo(() => {
    if (!currentAutomaton) return []

    // Group transitions by from-to pair for multiple symbols (same direction only)
    const edgeMap = new Map<string, { from: string; to: string; symbols: Set<string>; transitionIds: string[] }>()
    
    currentAutomaton.transitions.forEach((t) => {
      const key = `${t.from}-${t.to}`
      if (!edgeMap.has(key)) {
        edgeMap.set(key, { from: t.from, to: t.to, symbols: new Set(), transitionIds: [] })
      }
      const entry = edgeMap.get(key)!
      
      // Handle comma-separated symbols
      t.symbol.split(',').forEach((sym) => {
        const cleaned = sym.trim()
        if (cleaned) {
          entry.symbols.add(cleaned)
        }
      })
      entry.transitionIds.push(t.id)
    })

    // Create edges from grouped transitions
    return Array.from(edgeMap.values()).map((e) => {
      const combinedSymbol = Array.from(e.symbols).join(', ')
      // Create unique edge ID using transition IDs to prevent overwriting
      const edgeId = `edge-${e.from}-${e.to}-${e.transitionIds.join('-')}`

      // Check if this transition is active in simulation
      const isActive =
        simulation.isRunning &&
        simulation.history.length > 0 &&
        simulation.inputIndex > 0 &&
        e.symbols.has(simulation.history[simulation.inputIndex - 1]?.symbol) &&
        simulation.currentStates.includes(e.to)

      return {
        id: edgeId,
        source: e.from,
        target: e.to,
        type: 'transition',
        data: {
          symbol: combinedSymbol,
          isActive,
          isHighlighted: false,
          transitionIds: e.transitionIds,
        } as any,
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      }
    })
  }, [currentAutomaton, simulation])

  // Update React Flow nodes and edges
  useEffect(() => {
    setNodes(flowNodes)
    setEdges(flowEdges)
  }, [flowNodes, flowEdges, setNodes, setEdges])

  // Handle node position changes
  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      updateState(node.id, { position: node.position })
    },
    [updateState]
  )

  // Handle new connections - show inline input
  const onConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target) {
        // Use center of screen as approximate position
        setInlineTransition({
          open: true,
          from: connection.source,
          to: connection.target,
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
          symbol: '',
        })
      }
    },
    []
  )

  // Submit inline transition
  const submitInlineTransition = useCallback(() => {
    if (inlineTransition.from && inlineTransition.to) {
      const symbols = inlineTransition.symbol.split(',').map((s) => s.trim())
      symbols.forEach((symbol) => {
        if (symbol) {
          addTransition(inlineTransition.from, inlineTransition.to, symbol)
        }
      })
      if (symbols.length === 0 || (symbols.length === 1 && symbols[0] === '')) {
        addTransition(inlineTransition.from, inlineTransition.to, '')
      }
    }
    setInlineTransition({ open: false, from: '', to: '', x: 0, y: 0, symbol: '' })
  }, [inlineTransition, addTransition])

  // Handle pane click - show floating toolbar
  const onPaneClick = useCallback(
    (event: React.MouseEvent) => {
      if (simulation.isRunning) return
      setFloatingToolbar({ 
        x: event.clientX, 
        y: event.clientY, 
        open: true 
      })
    },
    [simulation.isRunning]
  )

  // Handle canvas double click to add state
  const onDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      if (!currentAutomaton || simulation.isRunning) return

      const target = event.target as HTMLElement
      if (target.closest('.react-flow__node')) return

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })

      addState(position)
      setFloatingToolbar({ ...floatingToolbar, open: false })
    },
    [currentAutomaton, simulation.isRunning, screenToFlowPosition, addState, floatingToolbar]
  )

  // Handle context menu on node
  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault()
      setSelectedNode(node.id)
      setContextMenuPosition({ x: event.clientX, y: event.clientY })
    },
    []
  )

  // Add transition with symbol
  const handleAddTransition = () => {
    if (transitionDialog.from && transitionDialog.to && transitionSymbol) {
      // Handle multiple symbols separated by comma
      const symbols = transitionSymbol.split(',').map((s) => s.trim())
      symbols.forEach((symbol) => {
        if (symbol) {
          addTransition(transitionDialog.from, transitionDialog.to, symbol)
        }
      })
    }
    setTransitionDialog({ open: false, from: '', to: '' })
    setTransitionSymbol('')
  }

  // Handle edge click for deletion
  const onEdgeClick = useCallback(
    (_event: React.MouseEvent, edge: Edge) => {
      if (simulation.isRunning) return
      const edgeData = edge.data as TransitionEdgeData | undefined
      // Delete all transitions associated with this edge
      const transitionIds = edgeData?.transitionIds || []
      transitionIds.forEach((id) => deleteTransition(id))
    },
    [simulation.isRunning, deleteTransition]
  )

  // Global keyboard shortcut for command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !commandPalette) {
        e.preventDefault()
        setCommandPalette(true)
        setCommandSearch('')
      }
      if (e.key === 'Escape') {
        setCommandPalette(false)
        setFloatingToolbar({ ...floatingToolbar, open: false })
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [commandPalette, floatingToolbar])

  // Execute command from palette
  const executeCommand = useCallback((command: string) => {
    if (command === 'add-state') {
      const position = screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
      addState(position)
    } else if (command === 'set-start' && selectedNode) {
      setStartState(selectedNode)
    } else if (command === 'delete' && selectedNode) {
      deleteState(selectedNode)
    }
    setCommandPalette(false)
    setCommandSearch('')
  }, [selectedNode, screenToFlowPosition, addState, setStartState, deleteState])

  const canUndo = historyIndex > 0
  const canRedo = historyIndex < history.length - 1

  return (
    <div ref={reactFlowWrapper} className="w-full h-full relative">
      <EdgeMarkers />
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className="w-full h-full" onDoubleClick={onDoubleClick}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeDragStop={onNodeDragStop}
              onNodeContextMenu={onNodeContextMenu}
              onEdgeClick={onEdgeClick}
              onPaneClick={onPaneClick}
              nodeTypes={nodeTypes as any}
              edgeTypes={edgeTypes as any}
              fitView
              snapToGrid
              snapGrid={[15, 15]}
              defaultEdgeOptions={{
                type: 'transition',
              }}
              className="bg-canvas-bg"
            >
              <Background
                variant={BackgroundVariant.Dots}
                gap={20}
                size={1}
                className="!bg-canvas-bg"
              />
              <Controls
                showZoom={false}
                showFitView={false}
                showInteractive={false}
                className="!bg-card !border-border !shadow-lg"
              />
              <MiniMap
                className="!bg-card !border-border"
                nodeColor={(node) => {
                  const data = node.data as { data: StateNodeData }
                  if (data.data.isActive) return 'hsl(var(--warning))'
                  if (data.data.isFinal) return 'hsl(var(--primary))'
                  return 'hsl(var(--muted))'
                }}
                maskColor="hsl(var(--background) / 0.8)"
              />

              {/* Toolbar Panel */}
              <Panel position="top-left" className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={undo}
                  disabled={!canUndo || simulation.isRunning}
                  title="Undo"
                >
                  <Undo2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={redo}
                  disabled={!canRedo || simulation.isRunning}
                  title="Redo"
                >
                  <Redo2 className="h-4 w-4" />
                </Button>
                <div className="w-px h-8 bg-border" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => fitView()}
                  title="Fit View"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </Panel>

              {/* Instructions Panel */}
              <Panel position="bottom-center" className="mb-4">
                <div className="bg-card/90 backdrop-blur-sm rounded-lg px-4 py-2 text-sm text-muted-foreground border border-border shadow-lg">
                  <span className="font-medium">Double-click</span> to add state •{' '}
                  <span className="font-medium">Drag</span> between states to add transition •{' '}
                  <span className="font-medium">Press /</span> for commands
                </div>
              </Panel>
            </ReactFlow>
          </div>
        </ContextMenuTrigger>

        {selectedNode && (
          <ContextMenuContent className="w-48" style={{ zIndex: 99999 }}>
            <ContextMenuItem
              onClick={() => {
                setStartState(selectedNode)
                setSelectedNode(null)
              }}
            >
              <Play className="h-4 w-4 mr-2" />
              Set as Start State
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => {
                toggleFinalState(selectedNode)
                setSelectedNode(null)
              }}
            >
              <Flag className="h-4 w-4 mr-2" />
              Toggle Final State
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem
              onClick={() => {
                setTransitionDialog({
                  open: true,
                  from: selectedNode,
                  to: selectedNode,
                })
                setSelectedNode(null)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Self-Loop
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => {
                deleteState(selectedNode)
                setSelectedNode(null)
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete State
            </ContextMenuItem>
          </ContextMenuContent>
        )}
      </ContextMenu>

      {/* Transition Symbol Dialog */}
      <Dialog
        open={transitionDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setTransitionDialog({ open: false, from: '', to: '' })
            setTransitionSymbol('')
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Transition</DialogTitle>
            <DialogDescription>
              Enter the symbol(s) for this transition. Use comma to separate multiple symbols.
              Use &apos;ε&apos; or leave empty for epsilon transitions.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="symbol">Symbol(s)</Label>
            <Input
              id="symbol"
              value={transitionSymbol}
              onChange={(e) => setTransitionSymbol(e.target.value)}
              placeholder="e.g., a, b, 0, 1, ε"
              className="mt-2"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddTransition()
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setTransitionDialog({ open: false, from: '', to: '' })
                setTransitionSymbol('')
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddTransition}>Add Transition</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Floating Toolbar */}
      <AnimatePresence>
        {floatingToolbar.open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed z-[9999] bg-popover border rounded-lg shadow-lg p-2 flex gap-2"
            style={{ 
              left: floatingToolbar.x, 
              top: floatingToolbar.y,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <Button
              size="sm"
              className="gap-2"
              onClick={() => {
                const position = screenToFlowPosition({ 
                  x: floatingToolbar.x, 
                  y: floatingToolbar.y 
                })
                addState(position)
                setFloatingToolbar({ ...floatingToolbar, open: false })
              }}
            >
              <Plus className="h-4 w-4" />
              Add State
            </Button>
            <div className="w-px h-8 bg-border" />
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={() => {
                setFloatingToolbar({ ...floatingToolbar, open: false })
              }}
            >
              <MousePointer2 className="h-4 w-4" />
              Cancel
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inline Transition Input */}
      <AnimatePresence>
        {inlineTransition.open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed z-[9999] bg-popover border rounded-lg shadow-lg p-3"
            style={{
              left: inlineTransition.x,
              top: inlineTransition.y,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className="flex flex-col gap-2">
              <Label className="text-xs text-muted-foreground">Transition Symbol</Label>
              <Input
                value={inlineTransition.symbol}
                onChange={(e) => setInlineTransition({ ...inlineTransition, symbol: e.target.value })}
                placeholder="e.g., 0, 1, a, b (empty for ε)"
                className="w-48 text-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    submitInlineTransition()
                  }
                  if (e.key === 'Escape') {
                    setInlineTransition({ open: false, from: '', to: '', x: 0, y: 0, symbol: '' })
                  }
                }}
              />
              <div className="flex gap-2">
                <Button size="sm" className="flex-1" onClick={submitInlineTransition}>
                  <GitBranch className="h-3 w-3 mr-1" />
                  Add
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setInlineTransition({ open: false, from: '', to: '', x: 0, y: 0, symbol: '' })}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Command Palette */}
      <AnimatePresence>
        {commandPalette && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] bg-background/80 backdrop-blur-sm flex items-start justify-center pt-[20vh]"
            onClick={() => setCommandPalette(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="w-[500px] bg-popover border rounded-lg shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b">
                <Input
                  value={commandSearch}
                  onChange={(e) => setCommandSearch(e.target.value)}
                  placeholder="Type a command..."
                  className="border-0 focus-visible:ring-0"
                  autoFocus
                />
              </div>
              <div className="p-2 max-h-[300px] overflow-y-auto">
                {['add-state', 'set-start', 'delete'].filter(cmd => 
                  cmd.includes(commandSearch.toLowerCase())
                ).map((cmd) => (
                  <button
                    key={cmd}
                    className="w-full px-3 py-2 text-left hover:bg-accent rounded-md flex items-center gap-3 transition-colors"
                    onClick={() => executeCommand(cmd)}
                  >
                    {cmd === 'add-state' && <Plus className="h-4 w-4" />}
                    {cmd === 'set-start' && <Play className="h-4 w-4" />}
                    {cmd === 'delete' && <Trash2 className="h-4 w-4" />}
                    <span className="text-sm">
                      {cmd === 'add-state' && 'Add State'}
                      {cmd === 'set-start' && 'Set Start State'}
                      {cmd === 'delete' && 'Delete Selected State'}
                    </span>
                  </button>
                ))}
              </div>
              <div className="px-4 py-2 bg-muted/50 text-xs text-muted-foreground border-t">
                Press <kbd className="px-1.5 py-0.5 bg-background rounded text-xs">ESC</kbd> to close
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
