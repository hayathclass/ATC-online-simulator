'use client'

import { motion } from 'framer-motion'
import { 
  Circle,
  ArrowRight,
  Type,
  Eraser,
  MousePointer2,
  Play,
  GripVertical,
  Minus,
  Bold,
  Italic,
  Highlighter,
  Square
} from 'lucide-react'
import { useStudioStore } from '@/lib/store/studio-store'
import { cn } from '@/lib/utils'

export type ToolType = 
  | 'select'
  | 'state'
  | 'final-state'
  | 'reject-state'
  | 'transition'
  | 'transition-curved'
  | 'self-loop'
  | 'text'
  | 'draw'
  | 'eraser'
  | 'start-arrow'
  | 'label'
  | 'comment-box'
  | 'highlight'
  | 'simulation'

interface ToolOption {
  type: ToolType
  label: string
  icon: React.ElementType
  description: string
  category: 'drawing' | 'automata' | 'simulation'
}

const tools: ToolOption[] = [
  // Drawing & Annotation Tools
  {
    type: 'select',
    label: 'Select',
    icon: MousePointer2,
    description: 'Select and move elements',
    category: 'drawing',
  },
  {
    type: 'draw',
    label: 'Pen',
    icon: Bold,
    description: 'Freehand drawing',
    category: 'drawing',
  },
  {
    type: 'text',
    label: 'Text',
    icon: Type,
    description: 'Add text annotations',
    category: 'drawing',
  },
  {
    type: 'highlight',
    label: 'Highlight',
    icon: Highlighter,
    description: 'Highlight areas',
    category: 'drawing',
  },
  {
    type: 'comment-box',
    label: 'Comment',
    icon: Square,
    description: 'Add comment box',
    category: 'drawing',
  },
  {
    type: 'eraser',
    label: 'Eraser',
    icon: Eraser,
    description: 'Remove elements',
    category: 'drawing',
  },
  
  // Automata Tools
  {
    type: 'state',
    label: 'State',
    icon: Circle,
    description: 'Regular state (q0, q1...)',
    category: 'automata',
  },
  {
    type: 'final-state',
    label: 'Final State',
    icon: Circle,
    description: 'Accepting state (double circle)',
    category: 'automata',
  },
  {
    type: 'reject-state',
    label: 'Reject State',
    icon: Circle,
    description: 'Reject/trap state',
    category: 'automata',
  },
  {
    type: 'transition',
    label: 'Arrow',
    icon: ArrowRight,
    description: 'Straight transition arrow',
    category: 'automata',
  },
  {
    type: 'transition-curved',
    label: 'Curved Arrow',
    icon: ArrowRight,
    description: 'Curved transition',
    category: 'automata',
  },
  {
    type: 'self-loop',
    label: 'Self Loop',
    icon: ArrowRight,
    description: 'State self-loop',
    category: 'automata',
  },
  {
    type: 'start-arrow',
    label: 'Start Ptr',
    icon: Minus,
    description: 'Initial state pointer',
    category: 'automata',
  },
  {
    type: 'label',
    label: 'Symbol',
    icon: Italic,
    description: 'Transition label (a,b,ε)',
    category: 'automata',
  },
  
  // Simulation
  {
    type: 'simulation',
    label: 'Simulator',
    icon: Play,
    description: 'Test input strings',
    category: 'simulation',
  },
]

const categoryLabels = {
  drawing: 'Drawing Tools',
  automata: 'Automata Tools',
  simulation: 'Simulation',
}

export function WidgetSidebar() {
  const { 
    draggedWidgetType, 
    setDraggedWidgetType, 
    isEditing, 
    isPresentationMode,
    activeTool,
    setActiveTool
  } = useStudioStore()

  if (isPresentationMode) return null

  const handleDragStart = (toolType: ToolType) => {
    setDraggedWidgetType(toolType)
    setActiveTool(toolType)
  }

  const handleDragEnd = () => {
    setDraggedWidgetType(null)
  }

  // Group tools by category
  const groupedTools = tools.reduce((acc, tool) => {
    if (!acc[tool.category]) {
      acc[tool.category] = []
    }
    acc[tool.category].push(tool)
    return acc
  }, {} as Record<string, ToolOption[]>)

  return (
    <div className="flex w-[200px] flex-col border-l border-border bg-card/50">
      <div className="border-b border-border px-3 py-3">
        <h3 className="text-xs font-semibold text-foreground">Teaching Tools</h3>
        <p className="text-[10px] text-muted-foreground">Drag & drop to build automata</p>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-3">
          {Object.entries(groupedTools).map(([category, categoryTools]) => (
            <div key={category}>
              <div className="mb-1.5 px-1">
                <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {categoryLabels[category as keyof typeof categoryLabels]}
                </span>
              </div>
              <div className="space-y-1">
                {categoryTools.map((tool) => {
                  const Icon = tool.icon
                  const isActive = activeTool === tool.type

                  return (
                    <motion.div
                      key={tool.type}
                      draggable={isEditing}
                      onDragStart={(e) => {
                        if (!isEditing) return
                        handleDragStart(tool.type)
                        const img = new Image()
                        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
                        ;(e as any).dataTransfer?.setDragImage(img, 0, 0)
                      }}
                      onDragEnd={handleDragEnd}
                      onClick={() => setActiveTool(tool.type)}
                      className={cn(
                        "group flex cursor-pointer items-center gap-2 rounded-lg border p-2 transition-all",
                        isActive
                          ? "border-primary bg-primary/10"
                          : isEditing
                            ? "cursor-grab border-border bg-background hover:border-primary/50 hover:bg-muted/50 active:cursor-grabbing"
                            : "cursor-not-allowed border-border/50 bg-muted/30 opacity-50"
                      )}
                      whileHover={isEditing ? { scale: 1.02 } : {}}
                      whileTap={isEditing ? { scale: 0.98 } : {}}
                    >
                      {isEditing && (
                        <GripVertical className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      )}
                      <div className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-md",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "bg-primary/10 text-primary"
                      )}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium">{tool.label}</div>
                        <p className="truncate text-[9px] text-muted-foreground">
                          {tool.description}
                        </p>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
