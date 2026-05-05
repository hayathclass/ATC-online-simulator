'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useStudioStore, type WhiteboardElement } from '@/lib/store/studio-store'
import { cn } from '@/lib/utils'

interface WhiteboardRendererProps {
  elements: WhiteboardElement[]
}

export function WhiteboardRenderer({ elements }: WhiteboardRendererProps) {
  const { isPresentationMode, isEditing, updateElement, deleteElement } = useStudioStore()
  const [editingId, setEditingId] = useState<string | null>(null)

  if (!elements || elements.length === 0) return null

  const handleLabelEdit = (element: WhiteboardElement, newLabel: string) => {
    updateElement(element.id, {
      data: { ...element.data, label: newLabel }
    })
    setEditingId(null)
  }

  return (
    <>
      {elements.map((element) => {
        const isSelected = false // Can be enhanced with selection state
        
        // Render based on tool type
        switch (element.toolType) {
          case 'state':
          case 'final-state':
          case 'reject-state':
            return (
              <motion.div
                key={element.id}
                drag={isEditing && !isPresentationMode}
                dragMomentum={false}
                dragElastic={0}
                onDragEnd={(e, info) => {
                  const newX = Math.round((element.x + info.offset.x) / 10) * 10
                  const newY = Math.round((element.y + info.offset.y) / 10) * 10
                  updateElement(element.id, { x: newX, y: newY })
                }}
                onDoubleClick={() => setEditingId(element.id)}
                className={cn(
                  "absolute flex items-center justify-center rounded-full shadow-lg cursor-grab active:cursor-grabbing transition-shadow hover:shadow-xl",
                  element.toolType === 'final-state' && "ring-4 ring-blue-600",
                  element.toolType === 'reject-state' && "ring-4 ring-red-500"
                )}
                style={{
                  left: element.x,
                  top: element.y,
                  width: element.width || 70,
                  height: element.height || 70,
                  backgroundColor: '#f8f9fa',
                  border: element.toolType === 'state' ? '3px solid #1f2937' : 
                          element.toolType === 'final-state' ? '3px solid #1f2937' : 
                          '3px solid #ef4444',
                }}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              >
                {editingId === element.id ? (
                  <input
                    autoFocus
                    className="w-full text-center text-sm font-bold bg-transparent outline-none text-gray-900"
                    defaultValue={element.data.label || 'q0'}
                    onBlur={(e) => handleLabelEdit(element, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleLabelEdit(element, (e.target as HTMLInputElement).value)
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="text-sm font-bold select-none text-gray-900">
                    {element.data.label || 'q0'}
                  </span>
                )}
              </motion.div>
            )

          case 'label':
          case 'text':
            return (
              <motion.div
                key={element.id}
                drag={isEditing && !isPresentationMode}
                dragMomentum={false}
                dragElastic={0}
                onDragEnd={(e, info) => {
                  const newX = Math.round((element.x + info.offset.x) / 5) * 5
                  const newY = Math.round((element.y + info.offset.y) / 5) * 5
                  updateElement(element.id, { x: newX, y: newY })
                }}
                onDoubleClick={() => setEditingId(element.id)}
                className="absolute px-3 py-1 rounded bg-white shadow-md cursor-grab active:cursor-grabbing hover:shadow-lg transition-shadow"
                style={{
                  left: element.x,
                  top: element.y,
                }}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {editingId === element.id ? (
                  <input
                    autoFocus
                    className="text-lg font-medium bg-transparent outline-none min-w-[50px] text-gray-900"
                    defaultValue={element.data.label || 'a'}
                    onBlur={(e) => handleLabelEdit(element, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleLabelEdit(element, (e.target as HTMLInputElement).value)
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="text-lg font-medium select-none text-gray-900">
                    {element.data.label || 'a'}
                  </span>
                )}
              </motion.div>
            )

          case 'transition':
            return (
              <motion.div
                key={element.id}
                drag={isEditing && !isPresentationMode}
                dragMomentum={false}
                dragElastic={0}
                onDragEnd={(e, info) => {
                  const newX = Math.round((element.x + info.offset.x) / 10) * 10
                  const newY = Math.round((element.y + info.offset.y) / 10) * 10
                  updateElement(element.id, { x: newX, y: newY })
                }}
                onDoubleClick={() => setEditingId(element.id)}
                className="absolute cursor-grab active:cursor-grabbing"
                style={{
                  left: element.x,
                  top: element.y,
                  width: element.width || 120,
                  height: element.height || 60,
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <svg width="100%" height="100%" className="overflow-visible">
                  <defs>
                    <marker
                      id={`arrowhead-${element.id}`}
                      markerWidth="10"
                      markerHeight="7"
                      refX="9"
                      refY="3.5"
                      orient="auto"
                    >
                      <polygon
                        points="0 0, 10 3.5, 0 7"
                        fill="#1f2937"
                      />
                    </marker>
                  </defs>
                  <line
                    x1="5"
                    y1="50%"
                    x2="100%"
                    y2="50%"
                    stroke="#1f2937"
                    strokeWidth="2"
                    markerEnd={`url(#arrowhead-${element.id})`}
                  />
                  {/* Editable Label */}
                  {editingId === element.id ? (
                    <foreignObject x="30%" y="20%" width="40%" height="60%">
                      <input
                        autoFocus
                        className="w-full text-center text-sm font-medium bg-white border border-gray-300 rounded px-1 outline-none text-gray-900"
                        defaultValue={element.data.label || 'a'}
                        onBlur={(e) => handleLabelEdit(element, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleLabelEdit(element, (e.target as HTMLInputElement).value)
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </foreignObject>
                  ) : (
                    <text
                      x="50%"
                      y="40%"
                      textAnchor="middle"
                      className="text-sm font-medium fill-gray-900 select-none cursor-pointer hover:fill-blue-600"
                      onClick={() => setEditingId(element.id)}
                    >
                      {element.data.label || 'a'}
                    </text>
                  )}
                </svg>
              </motion.div>
            )

          case 'transition-curved':
            return (
              <motion.div
                key={element.id}
                drag={isEditing && !isPresentationMode}
                dragMomentum={false}
                dragElastic={0}
                onDragEnd={(e, info) => {
                  const newX = Math.round((element.x + info.offset.x) / 10) * 10
                  const newY = Math.round((element.y + info.offset.y) / 10) * 10
                  updateElement(element.id, { x: newX, y: newY })
                }}
                className="absolute cursor-grab active:cursor-grabbing"
                style={{
                  left: element.x,
                  top: element.y,
                  width: element.width || 120,
                  height: element.height || 60,
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <svg width="100%" height="100%" className="overflow-visible">
                  <defs>
                    <marker
                      id={`arrowhead-curved-${element.id}`}
                      markerWidth="10"
                      markerHeight="7"
                      refX="9"
                      refY="3.5"
                      orient="auto"
                    >
                      <polygon
                        points="0 0, 10 3.5, 0 7"
                        fill="#1f2937"
                      />
                    </marker>
                  </defs>
                  <path
                    d={`M 5,${element.height || 60} Q ${(element.width || 120) / 2},0 ${element.width || 120},${element.height || 60}`}
                    stroke="#1f2937"
                    strokeWidth="2"
                    fill="none"
                    markerEnd={`url(#arrowhead-curved-${element.id})`}
                  />
                  <text
                    x="50%"
                    y="30%"
                    textAnchor="middle"
                    className="text-sm font-medium fill-foreground select-none"
                  >
                    {element.data.label || 'a'}
                  </text>
                </svg>
              </motion.div>
            )

          case 'self-loop':
            return (
              <motion.div
                key={element.id}
                drag={isEditing && !isPresentationMode}
                dragMomentum={false}
                dragElastic={0}
                onDragEnd={(e, info) => {
                  const newX = Math.round((element.x + info.offset.x) / 10) * 10
                  const newY = Math.round((element.y + info.offset.y) / 10) * 10
                  updateElement(element.id, { x: newX, y: newY })
                }}
                className="absolute cursor-grab active:cursor-grabbing"
                style={{
                  left: element.x,
                  top: element.y,
                  width: element.width || 80,
                  height: element.height || 80,
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <svg width="100%" height="100%" className="overflow-visible">
                  <defs>
                    <marker
                      id={`arrowhead-loop-${element.id}`}
                      markerWidth="8"
                      markerHeight="6"
                      refX="7"
                      refY="3"
                      orient="auto"
                    >
                      <polygon
                        points="0 0, 8 3, 0 6"
                        fill="#1f2937"
                      />
                    </marker>
                  </defs>
                  <path
                    d={`M 50%,5 Q 90%,5 90%,50 Q 90%,95 50%,95`}
                    stroke="#1f2937"
                    strokeWidth="2"
                    fill="none"
                    markerEnd={`url(#arrowhead-loop-${element.id})`}
                  />
                  <text
                    x="75%"
                    y="45%"
                    textAnchor="middle"
                    className="text-xs font-medium fill-foreground select-none"
                  >
                    {element.data.label || 'a'}
                  </text>
                </svg>
              </motion.div>
            )

          case 'start-arrow':
            return (
              <motion.div
                key={element.id}
                drag={isEditing && !isPresentationMode}
                dragMomentum={false}
                dragElastic={0}
                onDragEnd={(e, info) => {
                  const newX = Math.round((element.x + info.offset.x) / 10) * 10
                  const newY = Math.round((element.y + info.offset.y) / 10) * 10
                  updateElement(element.id, { x: newX, y: newY })
                }}
                className="absolute cursor-grab active:cursor-grabbing"
                style={{
                  left: element.x,
                  top: element.y,
                  width: element.width || 80,
                  height: element.height || 40,
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <svg width="100%" height="100%" className="overflow-visible">
                  <defs>
                    <marker
                      id={`arrowhead-start-${element.id}`}
                      markerWidth="10"
                      markerHeight="7"
                      refX="9"
                      refY="3.5"
                      orient="auto"
                    >
                      <polygon
                        points="0 0, 10 3.5, 0 7"
                        fill="#1f2937"
                      />
                    </marker>
                  </defs>
                  <line
                    x1="0"
                    y1="50%"
                    x2="100%"
                    y2="50%"
                    stroke="#1f2937"
                    strokeWidth="2"
                    markerEnd={`url(#arrowhead-start-${element.id})`}
                  />
                </svg>
              </motion.div>
            )

          case 'comment-box':
            return (
              <motion.div
                key={element.id}
                drag={isEditing && !isPresentationMode}
                dragMomentum={false}
                dragElastic={0}
                onDragEnd={(e, info) => {
                  const newX = Math.round((element.x + info.offset.x) / 10) * 10
                  const newY = Math.round((element.y + info.offset.y) / 10) * 10
                  updateElement(element.id, { x: newX, y: newY })
                }}
                className="absolute rounded-lg border-2 border-yellow-400 bg-yellow-50 p-3 shadow-md cursor-grab active:cursor-grabbing"
                style={{
                  left: element.x,
                  top: element.y,
                  width: element.width || 200,
                  height: element.height || 100,
                }}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-sm text-yellow-900">
                  {element.data.label || 'Comment'}
                </p>
              </motion.div>
            )

          case 'highlight':
            return (
              <motion.div
                key={element.id}
                drag={isEditing && !isPresentationMode}
                dragMomentum={false}
                dragElastic={0}
                onDragEnd={(e, info) => {
                  const newX = Math.round((element.x + info.offset.x) / 10) * 10
                  const newY = Math.round((element.y + info.offset.y) / 10) * 10
                  updateElement(element.id, { x: newX, y: newY })
                }}
                className="absolute rounded-lg opacity-30 cursor-grab active:cursor-grabbing"
                style={{
                  left: element.x,
                  top: element.y,
                  width: element.width || 150,
                  height: element.height || 100,
                  backgroundColor: element.data.color || '#fbbf24',
                }}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.3 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            )

          default:
            return null
        }
      })}
    </>
  )
}
