'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Pen,
  Eraser,
  Undo2,
  Redo2,
  Trash2,
  Save,
  FolderOpen,
  Plus,
  ArrowLeft,
  Palette,
  Minus,
  Download,
  Calendar,
  User,
  Lock,
  Unlock,
} from 'lucide-react'
import Link from 'next/link'
import {
  saveWhiteboardSession,
  deleteWhiteboardSession,
  getAllWhiteboardSessions,
} from '@/lib/firebase/whiteboard-service'

// Type definitions
interface Point {
  x: number
  y: number
}

interface Stroke {
  id: string
  points: Point[]
  color: string
  width: number
  tool: 'pen' | 'eraser'
}

interface Page {
  id: string
  name: string
  strokes: Stroke[]
}

interface Session {
  id: string
  className: string
  date: string
  teacher: string
  pages: Page[]
  currentPageIndex: number
}

export default function StudioPage() {
  // Teacher access password
  const [showTeacherLoginDialog, setShowTeacherLoginDialog] = useState(false)
  const [teacherPasswordInput, setTeacherPasswordInput] = useState('')
  const [isTeacherMode, setIsTeacherMode] = useState(false)
  const [loginError, setLoginError] = useState('')
  const TEACHER_MASTER_PASSWORD = process.env.NEXT_PUBLIC_TEACHER_PASSWORD || '112233' // Default teacher password
  
  // Teacher mode check
  const isTeacher = isTeacherMode
  const isStudent = !isTeacherMode
  
  // Canvas ref
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  // Drawing state using refs for performance
  const isDrawingRef = useRef(false)
  const currentStrokeRef = useRef<Stroke | null>(null)
  
  // UI state
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen')
  const [color, setColor] = useState('#ffffff')
  const [brushSize, setBrushSize] = useState(3)
  
  // Session state
  const [pages, setPages] = useState<Page[]>([
    { id: `page-${Date.now()}`, name: 'Page 1', strokes: [] }
  ])
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  
  // Undo/Redo stacks
  const [undoStack, setUndoStack] = useState<Stroke[][]>([])
  const [redoStack, setRedoStack] = useState<Stroke[][]>([])
  
  // Dialogs and sidebar
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [sessionName, setSessionName] = useState('')
  const [savedSessions, setSavedSessions] = useState<Session[]>([])
  const [showSidebar, setShowSidebar] = useState(false)
  const [currentSession, setCurrentSession] = useState<Session | null>(null)
  
  // Read-only mode for students
  const isReadOnly = isStudent
  
  // Color palette
  const colors = ['#ffffff', '#fbbf24', '#f87171', '#60a5fa', '#34d399', '#a78bfa', '#f472b6']
  
  // Load saved sessions from Firebase
  useEffect(() => {
    getAllWhiteboardSessions()
      .then(sessions => setSavedSessions(sessions))
      .catch(console.error)
  }, [])
  
  // Initialize and resize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const resizeCanvas = () => {
      const parent = canvas.parentElement
      if (!parent) return
      
      const dpr = window.devicePixelRatio || 1
      canvas.width = parent.clientWidth * dpr
      canvas.height = parent.clientHeight * dpr
      canvas.style.width = `${parent.clientWidth}px`
      canvas.style.height = `${parent.clientHeight}px`
      
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.scale(dpr, dpr)
      }
      
      redrawCanvas()
    }
    
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [currentPageIndex, pages])
  
  // Redraw all strokes on canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const dpr = window.devicePixelRatio || 1
    const width = canvas.width / dpr
    const height = canvas.height / dpr
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height)
    
    // Get current page strokes
    const currentPage = pages[currentPageIndex]
    if (!currentPage) return
    
    const strokes = currentPage.strokes || []
    
    // Draw each stroke
    strokes.forEach(stroke => {
      if (!stroke || !stroke.points || stroke.points.length < 2) return
      
      ctx.beginPath()
      ctx.strokeStyle = stroke.tool === 'eraser' ? '#1a1a2e' : stroke.color
      ctx.lineWidth = stroke.tool === 'eraser' ? stroke.width * 3 : stroke.width
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
      
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y)
      }
      
      ctx.stroke()
    })
  }, [pages, currentPageIndex])
  
  // Get mouse/touch position
  const getPosition = (e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    
    const rect = canvas.getBoundingClientRect()
    
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      }
    }
    
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }
  
  // Start drawing
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    
    // Prevent students from drawing
    if (isReadOnly) return
    
    const position = getPosition(e)
    
    currentStrokeRef.current = {
      id: `stroke-${Date.now()}`,
      points: [position],
      color,
      width: brushSize,
      tool,
    }
    
    isDrawingRef.current = true
  }
  
  // Draw
  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    
    if (!isDrawingRef.current || !currentStrokeRef.current) return
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const position = getPosition(e)
    const stroke = currentStrokeRef.current
    
    // Add point to stroke
    stroke.points.push(position)
    
    // Draw line segment
    if (stroke.points.length >= 2) {
      const lastPoint = stroke.points[stroke.points.length - 2]
      const currentPoint = stroke.points[stroke.points.length - 1]
      
      ctx.beginPath()
      ctx.strokeStyle = stroke.tool === 'eraser' ? '#1a1a2e' : stroke.color
      ctx.lineWidth = stroke.tool === 'eraser' ? stroke.width * 3 : stroke.width
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      
      ctx.moveTo(lastPoint.x, lastPoint.y)
      ctx.lineTo(currentPoint.x, currentPoint.y)
      ctx.stroke()
    }
  }
  
  // Stop drawing
  const stopDrawing = () => {
    if (!isDrawingRef.current || !currentStrokeRef.current) {
      isDrawingRef.current = false
      return
    }
    
    const stroke = currentStrokeRef.current
    
    // Only save if stroke has enough points
    if (stroke.points.length >= 2) {
      // Save current state to undo stack
      const currentPage = pages[currentPageIndex]
      if (currentPage) {
        setUndoStack(prev => [currentPage.strokes, ...prev])
        setRedoStack([]) // Clear redo stack on new action
        
        // Add stroke to current page
        setPages(prev => {
          const updated = [...prev]
          updated[currentPageIndex] = {
            ...updated[currentPageIndex],
            strokes: [...updated[currentPageIndex].strokes, stroke]
          }
          return updated
        })
      }
    }
    
    currentStrokeRef.current = null
    isDrawingRef.current = false
  }
  
  // Undo last stroke
  const undo = () => {
    const currentPage = pages[currentPageIndex]
    if (!currentPage || currentPage.strokes.length === 0) return
    
    // Save current state to redo stack
    setRedoStack(prev => [currentPage.strokes, ...prev])
    
    // Remove last stroke
    const newStrokes = currentPage.strokes.slice(0, -1)
    setPages(prev => {
      const updated = [...prev]
      updated[currentPageIndex] = {
        ...updated[currentPageIndex],
        strokes: newStrokes
      }
      return updated
    })
  }
  
  // Redo last undone stroke
  const redo = () => {
    if (redoStack.length === 0) return
    
    const currentPage = pages[currentPageIndex]
    if (!currentPage) return
    
    // Get last undone state
    const [stateToRedo, ...remaining] = redoStack
    setRedoStack(remaining)
    
    // Save current state to undo stack
    setUndoStack(prev => [currentPage.strokes, ...prev])
    
    // Restore state
    setPages(prev => {
      const updated = [...prev]
      updated[currentPageIndex] = {
        ...updated[currentPageIndex],
        strokes: stateToRedo
      }
      return updated
    })
  }
  
  // Clear current page
  const clearCanvas = () => {
    const currentPage = pages[currentPageIndex]
    if (!currentPage || currentPage.strokes.length === 0) return
    
    if (!confirm('Clear the current page?')) return
    
    // Save to undo stack
    setUndoStack(prev => [currentPage.strokes, ...prev])
    setRedoStack([])
    
    // Clear strokes
    setPages(prev => {
      const updated = [...prev]
      updated[currentPageIndex] = {
        ...updated[currentPageIndex],
        strokes: []
      }
      return updated
    })
  }
  
  // Save session (Teacher only) - saves to Firebase
  const saveSession = async () => {
    if (!isTeacher) {
      alert('Only teachers can save sessions')
      return
    }
    if (!sessionName.trim()) {
      alert('Please enter a session name')
      return
    }
    const hasStrokes = pages.some(page => page.strokes.length > 0)
    // Allow saving even with empty canvas
    const session: Session = {
      id: `session-${Date.now()}`,
      className: sessionName.trim(),
      date: new Date().toISOString(),
      teacher: isTeacherMode ? 'Teacher' : 'Anonymous',
      pages: pages.map(page => ({
        id: page.id,
        name: page.name,
        strokes: [...page.strokes]
      })),
      currentPageIndex: 0,
    }
    try {
      await saveWhiteboardSession(session)
      const updatedSessions = [session, ...savedSessions]
      setSavedSessions(updatedSessions)
      setCurrentSession(session)
      setShowSaveDialog(false)
      setSessionName('')
      alert('Session saved! All students can now see it.')
    } catch (error: any) {
      console.error('Failed to save session:', error)
      alert(`Failed to save session: ${error?.message || 'Unknown error'}. Check browser console for details.`)
    }
  }
  
  // Load session
  const loadSession = (session: Session) => {
    if (session.pages && session.pages.length > 0) {
      setPages(session.pages)
      setCurrentPageIndex(session.currentPageIndex || 0)
    }
    
    setCurrentSession(session)
    setShowSidebar(false)
    
    // Clear undo/redo
    setUndoStack([])
    setRedoStack([])
  }
  
  // Delete session (Teacher only) - deletes from Firebase
  const deleteSession = async (sessionId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    if (!isTeacher) {
      alert('Only teachers can delete sessions')
      return
    }
    if (!confirm('Are you sure you want to delete this session? This action cannot be undone.')) return
    try {
      await deleteWhiteboardSession(sessionId)
      const updatedSessions = savedSessions.filter(s => s.id !== sessionId)
      setSavedSessions(updatedSessions)
      if (currentSession?.id === sessionId) setCurrentSession(null)
      alert('Session deleted successfully!')
    } catch (error) {
      console.error('Failed to delete session:', error)
      alert('Failed to delete session. Please try again.')
    }
  }
  
  // Export as image
  const exportAsImage = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const currentPage = pages[currentPageIndex]
    if (!currentPage || currentPage.strokes.length === 0) {
      alert('Draw something before exporting')
      return
    }
    
    try {
      const link = document.createElement('a')
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
      const pageName = currentPage.name || 'page'
      link.download = `whiteboard-${pageName}-${timestamp}.png`
      link.href = canvas.toDataURL('image/png')
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Failed to export image')
    }
  }
  
  // Add new page
  const addPage = () => {
    const newPage: Page = {
      id: `page-${Date.now()}`,
      name: `Page ${pages.length + 1}`,
      strokes: []
    }
    
    setPages(prev => [...prev, newPage])
    setCurrentPageIndex(pages.length)
    
    // Clear undo/redo
    setUndoStack([])
    setRedoStack([])
  }
  
  // Switch to page
  const switchToPage = (index: number) => {
    setCurrentPageIndex(index)
    
    // Clear undo/redo
    setUndoStack([])
    setRedoStack([])
  }
  
  // Delete page (Teacher only)
  const deletePage = (index: number) => {
    // Only teachers can delete
    if (!isTeacher) {
      alert('Only teachers can delete pages')
      return
    }
    
    if (pages.length <= 1) return
    if (!confirm(`Delete ${pages[index].name}?`)) return
    
    setPages(prev => prev.filter((_, i) => i !== index))
    
    if (currentPageIndex >= pages.length - 1) {
      setCurrentPageIndex(Math.max(0, pages.length - 2))
    }
    
    // Clear undo/redo
    setUndoStack([])
    setRedoStack([])
  }
  
  // Get current page strokes count
  const currentPageStrokesCount = pages[currentPageIndex]?.strokes.length || 0
  const hasAnyStrokes = pages.some(page => page.strokes.length > 0)
  
  // Teacher login
  const loginAsTeacher = () => {
    if (teacherPasswordInput === TEACHER_MASTER_PASSWORD) {
      setIsTeacherMode(true)
      setShowTeacherLoginDialog(false)
      setTeacherPasswordInput('')
      setLoginError('')
    } else {
      setLoginError('Incorrect password!')
      setTeacherPasswordInput('')
    }
  }
  
  // Logout from teacher mode
  const logoutTeacher = () => {
    setIsTeacherMode(false)
  }
  
  return (
    <div className="flex h-screen flex-col bg-[#1a1a2e]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 bg-black/20 px-4 py-2">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 text-white hover:bg-white/10">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white">Interactive Whiteboard</h1>
              {/* Role Badge */}
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                isTeacher 
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-green-500/20 text-green-400 border border-green-500/30'
              }`}>
                {isTeacher ? 'Teacher' : 'Student'}
              </span>
              {isReadOnly && (
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                  Read Only
                </span>
              )}
            </div>
            {currentSession ? (
              <p className="text-xs text-white/60">
                {currentSession.className} • {new Date(currentSession.date).toLocaleDateString()}
              </p>
            ) : (
              <p className="text-xs text-white/60">
                {pages.length} page{pages.length !== 1 ? 's' : ''} • Page {currentPageIndex + 1} • {currentPageStrokesCount} strokes
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Teacher Login/Logout Button */}
          {isTeacherMode ? (
            <Button
              variant="outline"
              size="sm"
              onClick={logoutTeacher}
              className="gap-2 border-green-500/30 text-green-400 hover:bg-green-500/10"
            >
              <Unlock className="h-4 w-4" />
              Teacher Mode
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTeacherLoginDialog(true)}
              className="gap-2 border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
            >
              <Lock className="h-4 w-4" />
              Teacher Login
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSidebar(!showSidebar)}
            className="gap-2 border-white/20 text-white hover:bg-white/10"
          >
            <FolderOpen className="h-4 w-4" />
            Sessions
          </Button>
          {/* Save button - Teacher only */}
          {isTeacher && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSaveDialog(true)}
              className="gap-2 border-white/20 text-white hover:bg-white/10"
            >
              <Save className="h-4 w-4" />
              Save
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={exportAsImage}
            disabled={currentPageStrokesCount === 0}
            className="gap-2 border-white/20 text-white hover:bg-white/10"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Saved Sessions */}
        {showSidebar && (
          <div className="w-80 border-r border-white/10 bg-black/20 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white">Saved Sessions</h2>
              <div className="flex items-center gap-2">
                {isReadOnly && (
                  <span className="text-xs text-yellow-400">View Only</span>
                )}
                <button
                  onClick={() => getAllWhiteboardSessions().then(setSavedSessions).catch(console.error)}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  Refresh
                </button>
              </div>
            </div>
            {savedSessions.length === 0 ? (
              <p className="text-sm text-white/50">No saved sessions yet</p>
            ) : (
              <div className="space-y-2">
                {savedSessions.map(session => (
                  <div
                    key={session.id}
                    className="relative group"
                  >
                    <button
                      onClick={() => loadSession(session)}
                      className="w-full rounded-lg border border-white/10 bg-white/5 p-3 text-left hover:bg-white/10 transition"
                    >
                      <p className="text-sm font-medium text-white">{session.className}</p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-white/50">
                        <Calendar className="h-3 w-3" />
                        {new Date(session.date).toLocaleDateString()}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-white/50">
                        <User className="h-3 w-3" />
                        {session.teacher}
                      </div>
                      <div className="mt-1 text-xs text-white/40">
                        {session.pages?.length || 1} page{(session.pages?.length || 1) !== 1 ? 's' : ''}
                      </div>
                    </button>
                    {/* Delete button - Teacher only */}
                    {isTeacher && (
                      <button
                        onClick={(e) => deleteSession(session.id, e)}
                        className="absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-white/40 hover:text-red-400 transition"
                        title="Delete session"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Canvas Area */}
        <div className="flex-1 relative flex flex-col">
          {/* Page Navigation */}
          <div className="flex items-center gap-2 px-4 py-2 bg-black/30 border-b border-white/10 overflow-x-auto">
            {pages.map((page, index) => (
              <div key={page.id} className="flex items-center gap-1">
                <button
                  onClick={() => switchToPage(index)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    index === currentPageIndex
                      ? 'bg-white text-black'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {page.name}
                </button>
                {pages.length > 1 && (
                  <button
                    onClick={() => deletePage(index)}
                    className="p-1 rounded hover:bg-red-500/20 text-white/40 hover:text-red-400 transition"
                    title="Delete page"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={addPage}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition"
            >
              <Plus className="h-3 w-3" />
              Add Page
            </button>
          </div>
          
          {/* Canvas */}
          <div className="flex-1 relative">
            <canvas
              ref={canvasRef}
              className="absolute inset-0 cursor-crosshair touch-none"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
          </div>
        </div>
      </div>
      
      {/* Toolbar */}
      <div className="border-t border-white/10 bg-black/40 px-4 py-3">
        {isReadOnly ? (
          // Read-only message for students
          <div className="flex items-center justify-center">
            <p className="text-sm text-white">
              Read-only mode - Students can view but cannot edit
            </p>
          </div>
        ) : (
          // Full toolbar for teachers
          <div className="flex items-center justify-center gap-4">
            {/* Tools */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={tool === 'pen' ? 'default' : 'outline'}
                onClick={() => setTool('pen')}
                className={tool === 'pen' ? 'bg-white text-black' : 'border-white/20 text-white hover:bg-white/10'}
              >
                <Pen className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={tool === 'eraser' ? 'default' : 'outline'}
                onClick={() => setTool('eraser')}
                className={tool === 'eraser' ? 'bg-white text-black' : 'border-white/20 text-white hover:bg-white/10'}
              >
                <Eraser className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="h-8 w-px bg-white/20" />
            
            {/* Colors */}
            {tool === 'pen' && (
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-white/60" />
                {colors.map(c => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`h-6 w-6 rounded-full border-2 transition ${
                      color === c ? 'border-white scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            )}
            
            <div className="h-8 w-px bg-white/20" />
            
            {/* Brush Size */}
            <div className="flex items-center gap-2">
              <Minus className="h-4 w-4 text-white/60" />
              <input
                type="range"
                min="1"
                max="20"
                value={brushSize}
                onChange={e => setBrushSize(Number(e.target.value))}
                className="w-24"
              />
              <span className="text-xs text-white/60 w-6">{brushSize}px</span>
            </div>
            
            <div className="h-8 w-px bg-white/20" />
            
            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={undo}
                disabled={currentPageStrokesCount === 0}
                className="border-white/20 text-white hover:bg-white/10"
              >
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={redo}
                disabled={redoStack.length === 0}
                className="border-white/20 text-white hover:bg-white/10"
              >
                <Redo2 className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={clearCanvas}
                disabled={currentPageStrokesCount === 0}
                className="border-white/20 text-white hover:bg-red-500/20 hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="w-96 rounded-lg border border-white/10 bg-[#1a1a2e] p-6">
            <h2 className="mb-4 text-lg font-bold text-white">Save Session</h2>
            <div className="space-y-4">
              <div>
                <Label className="text-white">Class/Session Name</Label>
                <Input
                  value={sessionName}
                  onChange={e => setSessionName(e.target.value)}
                  placeholder="e.g., DFA Introduction - March 15"
                  className="mt-2 border-white/20 bg-white/5 text-white"
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && saveSession()}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={saveSession}
                  disabled={!sessionName.trim()}
                  className="flex-1"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSaveDialog(false)
                    setSessionName('')
                  }}
                  className="flex-1 border-white/20 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Teacher Login Dialog */}
      {showTeacherLoginDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="w-96 rounded-lg border border-blue-500/30 bg-[#1a1a2e] p-6">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="h-5 w-5 text-blue-400" />
              <h2 className="text-lg font-bold text-white">Teacher Login</h2>
            </div>
            <p className="text-sm text-white/60 mb-4">
              Enter the teacher password to unlock full access.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Label className="text-white">Teacher Password</Label>
                {loginError && (
                  <span className="text-xs text-red-400">{loginError}</span>
                )}
              </div>
              <Input
                value={teacherPasswordInput}
                onChange={e => {
                  setTeacherPasswordInput(e.target.value)
                  setLoginError('')
                }}
                placeholder="Enter password"
                className="mt-2 border-blue-500/30 bg-white/5 text-white"
                type="password"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && loginAsTeacher()}
              />
              <div className="flex gap-2">
                <Button
                  onClick={loginAsTeacher}
                  disabled={!teacherPasswordInput}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <Unlock className="mr-2 h-4 w-4" />
                  Login as Teacher
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowTeacherLoginDialog(false)
                    setTeacherPasswordInput('')
                  }}
                  className="flex-1 border-white/20 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
