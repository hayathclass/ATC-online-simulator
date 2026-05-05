import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface WhiteboardStroke {
  id: string
  points: Array<{ x: number; y: number }>
  color: string
  width: number
  tool: 'pen' | 'eraser'
}

export interface WhiteboardSession {
  id: string
  className: string
  date: string
  teacher: string
  strokes: WhiteboardStroke[]
}

export interface AutomataWidget {
  id: string
  type: 'dfa' | 'nfa' | 'pda' | 'turing' | 'regex' | 'cfg' | 'parse-tree' | 'transition-table'
  x: number
  y: number
  width: number
  height: number
  data: any
}

export interface WhiteboardElement {
  id: string
  toolType: 'state' | 'final-state' | 'reject-state' | 'transition' | 'transition-curved' | 'self-loop' | 'label' | 'text' | 'draw' | 'comment-box' | 'highlight' | 'start-arrow'
  x: number
  y: number
  width?: number
  height?: number
  rotation?: number
  data: {
    label?: string
    isFinal?: boolean
    isReject?: boolean
    fromX?: number
    fromY?: number
    toX?: number
    toY?: number
    controlX?: number
    controlY?: number
    path?: Array<{ x: number; y: number }>
    color?: string
    [key: string]: any
  }
}

export interface LessonPage {
  id: string
  name: string
  widgets: AutomataWidget[]
  elements?: WhiteboardElement[]
  tldrawSnapshot: any
}

export interface Lesson {
  id: string
  title: string
  description: string
  author: string
  createdAt: string
  updatedAt: string
  pages: LessonPage[]
  currentPageIndex: number
}

export interface StudioState {
  // Current lesson
  currentLesson: Lesson | null
  isEditing: boolean
  isPresentationMode: boolean
  isDarkBoard: boolean
  
  // Firebase integration
  currentClass: Class | null
  currentSessionId: string | null
  user: User | null
  classes: Class[]
  sessions: Session[]
  syncStatus: 'idle' | 'saving' | 'saved' | 'error'
  
  // Widgets on current page
  selectedWidgetId: string | null
  draggedWidgetType: string | null
  activeTool: string
  
  // Actions
  createNewLesson: (title: string, description?: string) => void
  loadLesson: (lesson: Lesson) => void
  saveLesson: () => Lesson | null
  
  // Firebase actions
  setUser: (user: User | null) => void
  setCurrentClass: (classData: Class | null) => void
  setCurrentSessionId: (sessionId: string | null) => void
  loadClasses: () => Promise<void>
  loadSessions: () => Promise<void>
  saveSessionToFirebase: () => Promise<string | null>
  loadSessionFromFirebase: (sessionId: string) => Promise<void>
  createClassInFirebase: (name: string, description: string) => Promise<string | null>
  
  // Page management
  addPage: (name?: string) => void
  deletePage: (pageId: string) => void
  renamePage: (pageId: string, name: string) => void
  goToPage: (index: number) => void
  nextPage: () => void
  prevPage: () => void
  
  // Widget management
  addWidget: (type: AutomataWidget['type'], x: number, y: number) => void
  updateWidget: (id: string, updates: Partial<AutomataWidget>) => void
  deleteWidget: (id: string) => void
  selectWidget: (id: string | null) => void
  setDraggedWidgetType: (type: string | null) => void
  setActiveTool: (tool: string) => void
  
  // Whiteboard element management
  addElement: (toolType: WhiteboardElement['toolType'], x: number, y: number) => void
  updateElement: (id: string, updates: Partial<WhiteboardElement>) => void
  deleteElement: (id: string) => void
  
  // UI toggles
  togglePresentationMode: () => void
  toggleDarkBoard: () => void
  setEditing: (editing: boolean) => void
  
  // tldraw snapshot
  updateTldrawSnapshot: (snapshot: any) => void
  
  // Saved lessons
  savedLessons: Lesson[]
  saveLessonToLibrary: () => void
  deleteLessonFromLibrary: (id: string) => void
  loadLessonFromLibrary: (id: string) => void
}

const createEmptyPage = (name: string = 'Page 1'): LessonPage => ({
  id: `page-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  name,
  widgets: [],
  elements: [],
  tldrawSnapshot: null,
})

const createEmptyLesson = (title: string, description: string = ''): Lesson => ({
  id: `lesson-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  title,
  description,
  author: 'Anonymous',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  pages: [createEmptyPage()],
  currentPageIndex: 0,
})

export const useStudioStore = create<StudioState>()(
  persist(
    (set, get) => ({
      currentLesson: null,
      isEditing: true,
      isPresentationMode: false,
      isDarkBoard: true,
      currentClass: null,
      currentSessionId: null,
      user: null,
      classes: [],
      sessions: [],
      syncStatus: 'idle',
      selectedWidgetId: null,
      draggedWidgetType: null,
      activeTool: 'select',
      savedLessons: [],
      
      createNewLesson: (title, description) => {
        set({
          currentLesson: createEmptyLesson(title, description),
          isEditing: true,
          isPresentationMode: false,
        })
      },
      
      loadLesson: (lesson) => {
        set({
          currentLesson: { ...lesson, currentPageIndex: 0 },
          isEditing: false,
        })
      },
      
      saveLesson: () => {
        const { currentLesson } = get()
        if (!currentLesson) return null
        return {
          ...currentLesson,
          updatedAt: new Date().toISOString(),
        }
      },
      
      addPage: (name) => {
        const { currentLesson } = get()
        if (!currentLesson) return
        
        const pageNumber = currentLesson.pages.length + 1
        const newPage = createEmptyPage(name || `Page ${pageNumber}`)
        
        set({
          currentLesson: {
            ...currentLesson,
            pages: [...currentLesson.pages, newPage],
            currentPageIndex: currentLesson.pages.length,
            updatedAt: new Date().toISOString(),
          },
        })
      },
      
      deletePage: (pageId) => {
        const { currentLesson } = get()
        if (!currentLesson || currentLesson.pages.length <= 1) return
        
        const pageIndex = currentLesson.pages.findIndex(p => p.id === pageId)
        const newPages = currentLesson.pages.filter(p => p.id !== pageId)
        const newIndex = Math.min(currentLesson.currentPageIndex, newPages.length - 1)
        
        set({
          currentLesson: {
            ...currentLesson,
            pages: newPages,
            currentPageIndex: newIndex,
            updatedAt: new Date().toISOString(),
          },
        })
      },
      
      renamePage: (pageId, name) => {
        const { currentLesson } = get()
        if (!currentLesson) return
        
        set({
          currentLesson: {
            ...currentLesson,
            pages: currentLesson.pages.map(p =>
              p.id === pageId ? { ...p, name } : p
            ),
            updatedAt: new Date().toISOString(),
          },
        })
      },
      
      goToPage: (index) => {
        const { currentLesson } = get()
        if (!currentLesson) return
        if (index < 0 || index >= currentLesson.pages.length) return
        
        set({
          currentLesson: {
            ...currentLesson,
            currentPageIndex: index,
          },
          selectedWidgetId: null,
        })
      },
      
      nextPage: () => {
        const { currentLesson, goToPage } = get()
        if (!currentLesson) return
        goToPage(currentLesson.currentPageIndex + 1)
      },
      
      prevPage: () => {
        const { currentLesson, goToPage } = get()
        if (!currentLesson) return
        goToPage(currentLesson.currentPageIndex - 1)
      },
      
      addWidget: (type, x, y) => {
        const { currentLesson } = get()
        if (!currentLesson) return
        
        const widget: AutomataWidget = {
          id: `widget-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          type,
          x,
          y,
          width: type === 'regex' ? 400 : type === 'transition-table' ? 350 : 500,
          height: type === 'regex' ? 200 : type === 'transition-table' ? 300 : 400,
          data: getDefaultWidgetData(type),
        }
        
        const currentPage = currentLesson.pages[currentLesson.currentPageIndex]
        
        set({
          currentLesson: {
            ...currentLesson,
            pages: currentLesson.pages.map((p, i) =>
              i === currentLesson.currentPageIndex
                ? { ...p, widgets: [...p.widgets, widget] }
                : p
            ),
            updatedAt: new Date().toISOString(),
          },
          selectedWidgetId: widget.id,
          draggedWidgetType: null,
        })
      },
      
      updateWidget: (id, updates) => {
        const { currentLesson } = get()
        if (!currentLesson) return
        
        set({
          currentLesson: {
            ...currentLesson,
            pages: currentLesson.pages.map((p, i) =>
              i === currentLesson.currentPageIndex
                ? {
                    ...p,
                    widgets: p.widgets.map(w =>
                      w.id === id ? { ...w, ...updates } : w
                    ),
                  }
                : p
            ),
            updatedAt: new Date().toISOString(),
          },
        })
      },
      
      deleteWidget: (id) => {
        const { currentLesson, selectedWidgetId } = get()
        if (!currentLesson) return
        
        set({
          currentLesson: {
            ...currentLesson,
            pages: currentLesson.pages.map((p, i) =>
              i === currentLesson.currentPageIndex
                ? { ...p, widgets: p.widgets.filter(w => w.id !== id) }
                : p
            ),
            updatedAt: new Date().toISOString(),
          },
          selectedWidgetId: selectedWidgetId === id ? null : selectedWidgetId,
        })
      },
      
      selectWidget: (id) => {
        set({ selectedWidgetId: id })
      },
      
      setDraggedWidgetType: (type) => {
        set({ draggedWidgetType: type })
      },
      
      setActiveTool: (tool) => {
        set({ activeTool: tool })
      },
      
      addElement: (toolType, x, y) => {
        const { currentLesson } = get()
        if (!currentLesson) return
        
        // Generate sequential state labels
        const currentPage = currentLesson.pages[currentLesson.currentPageIndex]
        const existingStates = (currentPage.elements || []).filter(e => 
          e.toolType === 'state' || e.toolType === 'final-state' || e.toolType === 'reject-state'
        )
        const stateNumber = existingStates.length
        
        const element: WhiteboardElement = {
          id: `element-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          toolType,
          x: Math.round(x / 10) * 10, // Snap to grid
          y: Math.round(y / 10) * 10, // Snap to grid
          rotation: 0,
          data: {
            color: '#3b82f6',
          },
        }
        
        // Set tool-specific defaults
        switch (toolType) {
          case 'state':
            element.width = 70
            element.height = 70
            element.data.label = `q${stateNumber}`
            element.data.isFinal = false
            break
          case 'final-state':
            element.width = 70
            element.height = 70
            element.data.label = `q${stateNumber}`
            element.data.isFinal = true
            break
          case 'reject-state':
            element.width = 70
            element.height = 70
            element.data.label = `q${stateNumber}`
            element.data.isReject = true
            break
          case 'transition':
          case 'transition-curved':
            element.width = 120
            element.height = 60
            element.data.label = 'a'
            break
          case 'self-loop':
            element.width = 80
            element.height = 80
            element.data.label = 'a'
            break
          case 'start-arrow':
            element.width = 80
            element.height = 40
            break
          case 'label':
            element.data.label = 'a'
            break
          case 'text':
            element.data.label = 'Text'
            break
          case 'comment-box':
            element.width = 200
            element.height = 100
            element.data.label = 'Comment'
            break
          case 'highlight':
            element.width = 150
            element.height = 100
            element.data.color = '#fbbf24'
            break
        }
        
        set({
          currentLesson: {
            ...currentLesson,
            pages: currentLesson.pages.map((p, i) =>
              i === currentLesson.currentPageIndex
                ? { ...p, elements: [...(p.elements || []), element] }
                : p
            ),
            updatedAt: new Date().toISOString(),
          },
        })
      },
      
      updateElement: (id, updates) => {
        const { currentLesson } = get()
        if (!currentLesson) return
        
        set({
          currentLesson: {
            ...currentLesson,
            pages: currentLesson.pages.map((p, i) =>
              i === currentLesson.currentPageIndex
                ? {
                    ...p,
                    elements: (p.elements || []).map(e =>
                      e.id === id ? { ...e, ...updates } : e
                    ),
                  }
                : p
            ),
            updatedAt: new Date().toISOString(),
          },
        })
      },
      
      deleteElement: (id) => {
        const { currentLesson } = get()
        if (!currentLesson) return
        
        set({
          currentLesson: {
            ...currentLesson,
            pages: currentLesson.pages.map((p, i) =>
              i === currentLesson.currentPageIndex
                ? { ...p, elements: (p.elements || []).filter(e => e.id !== id) }
                : p
            ),
            updatedAt: new Date().toISOString(),
          },
        })
      },
      
      togglePresentationMode: () => {
        set(state => ({
          isPresentationMode: !state.isPresentationMode,
          isEditing: state.isPresentationMode,
          selectedWidgetId: null,
        }))
      },
      
      toggleDarkBoard: () => {
        set(state => ({ isDarkBoard: !state.isDarkBoard }))
      },
      
      setEditing: (editing) => {
        set({ isEditing: editing })
      },
      
      updateTldrawSnapshot: (snapshot) => {
        const { currentLesson } = get()
        if (!currentLesson) return
        
        set({
          currentLesson: {
            ...currentLesson,
            pages: currentLesson.pages.map((p, i) =>
              i === currentLesson.currentPageIndex
                ? { ...p, tldrawSnapshot: snapshot }
                : p
            ),
          },
        })
      },
      
      saveLessonToLibrary: () => {
        const { currentLesson, savedLessons } = get()
        if (!currentLesson) return
        
        const updatedLesson = {
          ...currentLesson,
          updatedAt: new Date().toISOString(),
        }
        
        const existingIndex = savedLessons.findIndex(l => l.id === currentLesson.id)
        
        if (existingIndex >= 0) {
          set({
            savedLessons: savedLessons.map((l, i) =>
              i === existingIndex ? updatedLesson : l
            ),
            currentLesson: updatedLesson,
          })
        } else {
          set({
            savedLessons: [...savedLessons, updatedLesson],
            currentLesson: updatedLesson,
          })
        }
      },
      
      deleteLessonFromLibrary: (id) => {
        const { savedLessons, currentLesson } = get()
        set({
          savedLessons: savedLessons.filter(l => l.id !== id),
          currentLesson: currentLesson?.id === id ? null : currentLesson,
        })
      },
      
      loadLessonFromLibrary: (id) => {
        const { savedLessons } = get()
        const lesson = savedLessons.find(l => l.id === id)
        if (lesson) {
          set({
            currentLesson: { ...lesson, currentPageIndex: 0 },
            isEditing: false,
            isPresentationMode: false,
          })
        }
      },
      
      // Firebase actions
      setUser: (user) => {
        set({ user })
      },
      
      setCurrentClass: (classData) => {
        set({ currentClass: classData })
      },
      
      setCurrentSessionId: (sessionId) => {
        set({ currentSessionId: sessionId })
      },
      
      loadClasses: async () => {
        const { user } = get()
        if (!user) return
        
        try {
          const classes = await getClassesByTeacher(user.uid)
          set({ classes })
        } catch (error) {
          console.error('Failed to load classes:', error)
        }
      },
      
      loadSessions: async () => {
        const { currentClass } = get()
        if (!currentClass) return
        
        try {
          const sessions = await getSessionsByClass(currentClass.id)
          set({ sessions })
        } catch (error) {
          console.error('Failed to load sessions:', error)
        }
      },
      
      saveSessionToFirebase: async () => {
        const { currentLesson, user, currentClass, currentSessionId } = get()
        if (!currentLesson || !user || !currentClass) return null
        
        try {
          set({ syncStatus: 'saving' })
          
          const sessionId = await saveStudioSession(
            currentClass.id,
            currentLesson,
            user.uid,
            user.email || 'Anonymous',
            currentSessionId || undefined
          )
          
          set({ 
            currentSessionId: sessionId,
            syncStatus: 'saved' 
          })
          
          // Reload sessions
          await get().loadSessions()
          
          return sessionId
        } catch (error) {
          console.error('Failed to save session:', error)
          set({ syncStatus: 'error' })
          return null
        }
      },
      
      loadSessionFromFirebase: async (sessionId: string) => {
        try {
          const lesson = await loadStudioSession(sessionId)
          if (lesson) {
            set({
              currentLesson: { ...lesson, currentPageIndex: 0 },
              currentSessionId: sessionId,
              isEditing: false,
              isPresentationMode: false,
            })
          }
        } catch (error) {
          console.error('Failed to load session:', error)
        }
      },
      
      createClassInFirebase: async (name: string, description: string) => {
        const { user } = get()
        if (!user) return null
        
        try {
          const classId = await createClass(
            name,
            description,
            user.uid,
            user.email || 'Anonymous'
          )
          
          // Reload classes
          await get().loadClasses()
          
          return classId
        } catch (error) {
          console.error('Failed to create class:', error)
          return null
        }
      },
    }),
    {
      name: 'automatalab-studio',
      partialize: (state) => ({
        savedLessons: state.savedLessons,
        isDarkBoard: state.isDarkBoard,
      }),
    }
  )
)

function getDefaultWidgetData(type: AutomataWidget['type']): any {
  switch (type) {
    case 'dfa':
    case 'nfa':
      return {
        states: [
          { id: 'q0', name: 'q0', isStart: true, isFinal: false, x: 100, y: 150 },
          { id: 'q1', name: 'q1', isStart: false, isFinal: true, x: 350, y: 150 },
        ],
        transitions: [
          { id: 't1', from: 'q0', to: 'q1', symbols: ['a'] },
        ],
        alphabet: ['a', 'b'],
      }
    case 'pda':
      return {
        states: [],
        transitions: [],
        alphabet: [],
        stackAlphabet: ['Z'],
        stack: ['Z'],
      }
    case 'turing':
      return {
        states: [],
        transitions: [],
        tape: ['_', '_', '_', '_', '_'],
        headPosition: 2,
        tapeAlphabet: ['0', '1', '_'],
      }
    case 'regex':
      return {
        pattern: 'a*b+',
        testStrings: ['aab', 'b', 'ab', 'aabb'],
      }
    case 'cfg':
      return {
        productions: [
          { variable: 'S', rules: ['aSb', 'ε'] },
        ],
        startSymbol: 'S',
      }
    case 'parse-tree':
      return {
        root: null,
      }
    case 'transition-table':
      return {
        states: ['q0', 'q1'],
        alphabet: ['a', 'b'],
        transitions: {
          'q0,a': 'q1',
          'q0,b': 'q0',
          'q1,a': 'q1',
          'q1,b': 'q0',
        },
        startState: 'q0',
        finalStates: ['q1'],
      }
    default:
      return {}
  }
}

// Sample lessons
export const sampleLessons: Omit<Lesson, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    title: 'Introduction to DFA',
    description: 'Learn the basics of Deterministic Finite Automata - states, transitions, and acceptance.',
    author: 'AutomataLab',
    pages: [
      {
        id: 'intro-dfa-1',
        name: 'What is a DFA?',
        widgets: [
          {
            id: 'dfa-widget-1',
            type: 'dfa',
            x: 100,
            y: 100,
            width: 500,
            height: 400,
            data: {
              states: [
                { id: 'q0', name: 'q0', isStart: true, isFinal: false, x: 100, y: 150 },
                { id: 'q1', name: 'q1', isStart: false, isFinal: true, x: 350, y: 150 },
              ],
              transitions: [
                { id: 't1', from: 'q0', to: 'q1', symbols: ['1'] },
                { id: 't2', from: 'q0', to: 'q0', symbols: ['0'] },
                { id: 't3', from: 'q1', to: 'q1', symbols: ['0', '1'] },
              ],
              alphabet: ['0', '1'],
            },
          },
        ],
        tldrawSnapshot: null,
      },
      {
        id: 'intro-dfa-2',
        name: 'DFA Components',
        widgets: [
          {
            id: 'table-widget-1',
            type: 'transition-table',
            x: 100,
            y: 100,
            width: 350,
            height: 300,
            data: {
              states: ['q0', 'q1'],
              alphabet: ['0', '1'],
              transitions: {
                'q0,0': 'q0',
                'q0,1': 'q1',
                'q1,0': 'q1',
                'q1,1': 'q1',
              },
              startState: 'q0',
              finalStates: ['q1'],
            },
          },
        ],
        tldrawSnapshot: null,
      },
      {
        id: 'intro-dfa-3',
        name: 'Try It Yourself',
        widgets: [
          {
            id: 'dfa-widget-2',
            type: 'dfa',
            x: 100,
            y: 100,
            width: 600,
            height: 450,
            data: {
              states: [
                { id: 'q0', name: 'q0', isStart: true, isFinal: false, x: 80, y: 180 },
                { id: 'q1', name: 'q1', isStart: false, isFinal: false, x: 280, y: 180 },
                { id: 'q2', name: 'q2', isStart: false, isFinal: true, x: 480, y: 180 },
              ],
              transitions: [
                { id: 't1', from: 'q0', to: 'q1', symbols: ['a'] },
                { id: 't2', from: 'q1', to: 'q2', symbols: ['b'] },
                { id: 't3', from: 'q0', to: 'q0', symbols: ['b'] },
                { id: 't4', from: 'q1', to: 'q1', symbols: ['a'] },
                { id: 't5', from: 'q2', to: 'q2', symbols: ['a', 'b'] },
              ],
              alphabet: ['a', 'b'],
            },
          },
        ],
        tldrawSnapshot: null,
      },
    ],
    currentPageIndex: 0,
  },
  {
    title: 'NFA vs DFA',
    description: 'Compare Non-deterministic and Deterministic Finite Automata - understand the key differences.',
    author: 'AutomataLab',
    pages: [
      {
        id: 'nfa-dfa-1',
        name: 'NFA Example',
        widgets: [
          {
            id: 'nfa-widget-1',
            type: 'nfa',
            x: 100,
            y: 100,
            width: 500,
            height: 400,
            data: {
              states: [
                { id: 'q0', name: 'q0', isStart: true, isFinal: false, x: 100, y: 150 },
                { id: 'q1', name: 'q1', isStart: false, isFinal: false, x: 280, y: 80 },
                { id: 'q2', name: 'q2', isStart: false, isFinal: false, x: 280, y: 220 },
                { id: 'q3', name: 'q3', isStart: false, isFinal: true, x: 420, y: 150 },
              ],
              transitions: [
                { id: 't1', from: 'q0', to: 'q1', symbols: ['a'] },
                { id: 't2', from: 'q0', to: 'q2', symbols: ['a'] },
                { id: 't3', from: 'q1', to: 'q3', symbols: ['b'] },
                { id: 't4', from: 'q2', to: 'q3', symbols: ['c'] },
              ],
              alphabet: ['a', 'b', 'c'],
            },
          },
        ],
        tldrawSnapshot: null,
      },
      {
        id: 'nfa-dfa-2',
        name: 'Equivalent DFA',
        widgets: [
          {
            id: 'dfa-widget-3',
            type: 'dfa',
            x: 100,
            y: 100,
            width: 550,
            height: 400,
            data: {
              states: [
                { id: 'q0', name: '{q0}', isStart: true, isFinal: false, x: 80, y: 180 },
                { id: 'q12', name: '{q1,q2}', isStart: false, isFinal: false, x: 250, y: 180 },
                { id: 'q3', name: '{q3}', isStart: false, isFinal: true, x: 450, y: 180 },
                { id: 'dead', name: '∅', isStart: false, isFinal: false, x: 250, y: 320 },
              ],
              transitions: [
                { id: 't1', from: 'q0', to: 'q12', symbols: ['a'] },
                { id: 't2', from: 'q0', to: 'dead', symbols: ['b', 'c'] },
                { id: 't3', from: 'q12', to: 'q3', symbols: ['b', 'c'] },
                { id: 't4', from: 'q12', to: 'dead', symbols: ['a'] },
                { id: 't5', from: 'q3', to: 'dead', symbols: ['a', 'b', 'c'] },
                { id: 't6', from: 'dead', to: 'dead', symbols: ['a', 'b', 'c'] },
              ],
              alphabet: ['a', 'b', 'c'],
            },
          },
        ],
        tldrawSnapshot: null,
      },
    ],
    currentPageIndex: 0,
  },
  {
    title: 'Regular Expressions',
    description: 'Master regular expressions and their connection to finite automata.',
    author: 'AutomataLab',
    pages: [
      {
        id: 'regex-1',
        name: 'Regex Basics',
        widgets: [
          {
            id: 'regex-widget-1',
            type: 'regex',
            x: 100,
            y: 100,
            width: 450,
            height: 250,
            data: {
              pattern: '(a|b)*abb',
              testStrings: ['abb', 'aabb', 'babb', 'ababb', 'ab', 'a'],
            },
          },
        ],
        tldrawSnapshot: null,
      },
      {
        id: 'regex-2',
        name: 'Regex to NFA',
        widgets: [
          {
            id: 'regex-widget-2',
            type: 'regex',
            x: 100,
            y: 50,
            width: 400,
            height: 180,
            data: {
              pattern: 'a*b',
              testStrings: ['b', 'ab', 'aab', 'aaab'],
            },
          },
          {
            id: 'nfa-widget-2',
            type: 'nfa',
            x: 100,
            y: 260,
            width: 500,
            height: 350,
            data: {
              states: [
                { id: 'q0', name: 'q0', isStart: true, isFinal: false, x: 80, y: 150 },
                { id: 'q1', name: 'q1', isStart: false, isFinal: false, x: 250, y: 150 },
                { id: 'q2', name: 'q2', isStart: false, isFinal: true, x: 420, y: 150 },
              ],
              transitions: [
                { id: 't1', from: 'q0', to: 'q1', symbols: ['ε'] },
                { id: 't2', from: 'q1', to: 'q1', symbols: ['a'] },
                { id: 't3', from: 'q1', to: 'q2', symbols: ['b'] },
              ],
              alphabet: ['a', 'b'],
            },
          },
        ],
        tldrawSnapshot: null,
      },
    ],
    currentPageIndex: 0,
  },
]
