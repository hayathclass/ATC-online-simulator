import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface State {
  id: string
  label: string
  isStart: boolean
  isFinal: boolean
  position: { x: number; y: number }
}

export interface Transition {
  id: string
  from: string
  to: string
  symbol: string
}

export interface Automaton {
  id: string
  name: string
  type: 'dfa' | 'nfa' | 'epsilon-nfa' | 'pda' | 'tm'
  states: State[]
  transitions: Transition[]
  alphabet: string[]
  startState: string | null
  createdAt: number
  updatedAt: number
}

export interface SimulationState {
  isRunning: boolean
  isPaused: boolean
  currentStates: string[]
  inputString: string
  inputIndex: number
  speed: number // ms per step
  history: {
    states: string[]
    symbol: string
    index: number
  }[]
  result: 'accepted' | 'rejected' | 'running' | null
}

interface AutomataStore {
  // Current automaton being edited
  currentAutomaton: Automaton | null
  
  // Simulation state
  simulation: SimulationState
  
  // Saved automata
  savedAutomata: Automaton[]
  
  // Actions
  setCurrentAutomaton: (automaton: Automaton | null) => void
  createNewAutomaton: (type: Automaton['type'], name?: string) => Automaton
  
  // State management
  addState: (position: { x: number; y: number }) => void
  updateState: (id: string, updates: Partial<State>) => void
  deleteState: (id: string) => void
  setStartState: (id: string) => void
  toggleFinalState: (id: string) => void
  
  // Transition management
  addTransition: (from: string, to: string, symbol: string) => void
  updateTransition: (id: string, updates: Partial<Transition>) => void
  deleteTransition: (id: string) => void
  
  // Simulation
  startSimulation: (inputString: string) => void
  stepForward: () => void
  stepBackward: () => void
  pauseSimulation: () => void
  resumeSimulation: () => void
  resetSimulation: () => void
  setSimulationSpeed: (speed: number) => void
  
  // Save/Load
  saveAutomaton: () => void
  loadAutomaton: (id: string) => void
  deleteAutomaton: (id: string) => void
  exportAutomaton: () => string
  importAutomaton: (json: string) => boolean
  
  // Undo/Redo
  history: Automaton[]
  historyIndex: number
  pushHistory: () => void
  undo: () => void
  redo: () => void
  
  // Auto-generate from transition table
  generateFromTable: (tableData: { [stateLabel: string]: { [symbol: string]: string } }) => void
}

const generateId = () => Math.random().toString(36).substring(2, 9)

const createEmptyAutomaton = (type: Automaton['type'], name?: string): Automaton => ({
  id: generateId(),
  name: name || `New ${type.toUpperCase()}`,
  type,
  states: [],
  transitions: [],
  alphabet: [],
  startState: null,
  createdAt: Date.now(),
  updatedAt: Date.now(),
})

const initialSimulation: SimulationState = {
  isRunning: false,
  isPaused: false,
  currentStates: [],
  inputString: '',
  inputIndex: 0,
  speed: 1000, // Slow speed by default
  history: [],
  result: null,
}

export const useAutomataStore = create<AutomataStore>()(
  persist(
    (set, get) => ({
      currentAutomaton: null,
      simulation: initialSimulation,
      savedAutomata: [],
      history: [],
      historyIndex: -1,

      setCurrentAutomaton: (automaton) => {
        set({ currentAutomaton: automaton, simulation: initialSimulation })
      },

      createNewAutomaton: (type, name) => {
        const automaton = createEmptyAutomaton(type, name)
        set({ currentAutomaton: automaton, simulation: initialSimulation, history: [], historyIndex: -1 })
        return automaton
      },

      addState: (position) => {
        const { currentAutomaton, pushHistory } = get()
        if (!currentAutomaton) return

        pushHistory()
        const stateNumber = currentAutomaton.states.length
        const newState: State = {
          id: generateId(),
          label: `q${stateNumber}`,
          isStart: stateNumber === 0,
          isFinal: false,
          position,
        }

        set({
          currentAutomaton: {
            ...currentAutomaton,
            states: [...currentAutomaton.states, newState],
            startState: stateNumber === 0 ? newState.id : currentAutomaton.startState,
            updatedAt: Date.now(),
          },
        })
      },

      updateState: (id, updates) => {
        const { currentAutomaton, pushHistory } = get()
        if (!currentAutomaton) return

        pushHistory()
        set({
          currentAutomaton: {
            ...currentAutomaton,
            states: currentAutomaton.states.map((s) =>
              s.id === id ? { ...s, ...updates } : s
            ),
            updatedAt: Date.now(),
          },
        })
      },

      deleteState: (id) => {
        const { currentAutomaton, pushHistory } = get()
        if (!currentAutomaton) return

        pushHistory()
        const newStates = currentAutomaton.states.filter((s) => s.id !== id)
        const newTransitions = currentAutomaton.transitions.filter(
          (t) => t.from !== id && t.to !== id
        )

        set({
          currentAutomaton: {
            ...currentAutomaton,
            states: newStates,
            transitions: newTransitions,
            startState: currentAutomaton.startState === id ? null : currentAutomaton.startState,
            updatedAt: Date.now(),
          },
        })
      },

      setStartState: (id) => {
        const { currentAutomaton, pushHistory } = get()
        if (!currentAutomaton) return

        pushHistory()
        set({
          currentAutomaton: {
            ...currentAutomaton,
            states: currentAutomaton.states.map((s) => ({
              ...s,
              isStart: s.id === id,
            })),
            startState: id,
            updatedAt: Date.now(),
          },
        })
      },

      toggleFinalState: (id) => {
        const { currentAutomaton, pushHistory } = get()
        if (!currentAutomaton) return

        pushHistory()
        set({
          currentAutomaton: {
            ...currentAutomaton,
            states: currentAutomaton.states.map((s) =>
              s.id === id ? { ...s, isFinal: !s.isFinal } : s
            ),
            updatedAt: Date.now(),
          },
        })
      },

      addTransition: (from, to, symbol) => {
        const { currentAutomaton, pushHistory } = get()
        if (!currentAutomaton) return

        // Check if transition already exists
        const exists = currentAutomaton.transitions.some(
          (t) => t.from === from && t.to === to && t.symbol === symbol
        )
        if (exists) return

        pushHistory()
        const newTransition: Transition = {
          id: generateId(),
          from,
          to,
          symbol,
        }

        // Update alphabet
        const newAlphabet = [...new Set([...currentAutomaton.alphabet, symbol])].filter(
          (s) => s !== 'ε' && s !== ''
        )

        set({
          currentAutomaton: {
            ...currentAutomaton,
            transitions: [...currentAutomaton.transitions, newTransition],
            alphabet: newAlphabet,
            updatedAt: Date.now(),
          },
        })
      },

      updateTransition: (id, updates) => {
        const { currentAutomaton, pushHistory } = get()
        if (!currentAutomaton) return

        pushHistory()
        set({
          currentAutomaton: {
            ...currentAutomaton,
            transitions: currentAutomaton.transitions.map((t) =>
              t.id === id ? { ...t, ...updates } : t
            ),
            updatedAt: Date.now(),
          },
        })
      },

      deleteTransition: (id) => {
        const { currentAutomaton, pushHistory } = get()
        if (!currentAutomaton) return

        pushHistory()
        set({
          currentAutomaton: {
            ...currentAutomaton,
            transitions: currentAutomaton.transitions.filter((t) => t.id !== id),
            updatedAt: Date.now(),
          },
        })
      },

      startSimulation: (inputString) => {
        const { currentAutomaton } = get()
        if (!currentAutomaton || !currentAutomaton.startState) return

        const initialStates = [currentAutomaton.startState]
        
        // For NFA/epsilon-NFA, compute epsilon closure
        if (currentAutomaton.type === 'epsilon-nfa' || currentAutomaton.type === 'nfa') {
          // Simple epsilon closure for start state
          const closure = computeEpsilonClosure(
            initialStates,
            currentAutomaton.transitions
          )
          set({
            simulation: {
              isRunning: true,
              isPaused: false,
              currentStates: closure,
              inputString,
              inputIndex: 0,
              speed: get().simulation.speed,
              history: [{ states: closure, symbol: '', index: -1 }],
              result: 'running',
            },
          })
        } else {
          set({
            simulation: {
              isRunning: true,
              isPaused: false,
              currentStates: initialStates,
              inputString,
              inputIndex: 0,
              speed: get().simulation.speed,
              history: [{ states: initialStates, symbol: '', index: -1 }],
              result: 'running',
            },
          })
        }
      },

      stepForward: () => {
        const { currentAutomaton, simulation } = get()
        if (!currentAutomaton || !simulation.isRunning) return

        const { currentStates, inputString, inputIndex, history } = simulation

        // Check if we've processed all input
        if (inputIndex >= inputString.length) {
          // Check if any current state is final
          const isAccepted = currentStates.some((stateId) => {
            const state = currentAutomaton.states.find((s) => s.id === stateId)
            return state?.isFinal
          })

          set({
            simulation: {
              ...simulation,
              isRunning: false,
              result: isAccepted ? 'accepted' : 'rejected',
            },
          })
          return
        }

        const currentSymbol = inputString[inputIndex]
        let nextStates: string[] = []

        if (currentAutomaton.type === 'dfa') {
          // DFA: exactly one transition per state/symbol
          for (const stateId of currentStates) {
            const transition = currentAutomaton.transitions.find(
              (t) => t.from === stateId && t.symbol === currentSymbol
            )
            if (transition) {
              nextStates.push(transition.to)
            }
          }
        } else {
          // NFA/epsilon-NFA: multiple transitions possible
          for (const stateId of currentStates) {
            const transitions = currentAutomaton.transitions.filter(
              (t) => t.from === stateId && t.symbol === currentSymbol
            )
            nextStates.push(...transitions.map((t) => t.to))
          }
          
          // Remove duplicates
          nextStates = [...new Set(nextStates)]
          
          // Compute epsilon closure for NFA with epsilon
          if (currentAutomaton.type === 'epsilon-nfa') {
            nextStates = computeEpsilonClosure(nextStates, currentAutomaton.transitions)
          }
        }

        // If no valid transitions (dead state for DFA)
        if (nextStates.length === 0 && currentAutomaton.type === 'dfa') {
          set({
            simulation: {
              ...simulation,
              isRunning: false,
              result: 'rejected',
            },
          })
          return
        }

        set({
          simulation: {
            ...simulation,
            currentStates: nextStates,
            inputIndex: inputIndex + 1,
            history: [
              ...history,
              { states: nextStates, symbol: currentSymbol, index: inputIndex },
            ],
          },
        })
      },

      stepBackward: () => {
        const { simulation } = get()
        if (simulation.history.length <= 1) return

        const newHistory = simulation.history.slice(0, -1)
        const prevStep = newHistory[newHistory.length - 1]

        set({
          simulation: {
            ...simulation,
            currentStates: prevStep.states,
            inputIndex: prevStep.index + 1,
            history: newHistory,
            result: 'running',
            isRunning: true,
          },
        })
      },

      pauseSimulation: () => {
        set((state) => ({
          simulation: { ...state.simulation, isPaused: true },
        }))
      },

      resumeSimulation: () => {
        set((state) => ({
          simulation: { ...state.simulation, isPaused: false },
        }))
      },

      resetSimulation: () => {
        set({ simulation: initialSimulation })
      },

      setSimulationSpeed: (speed) => {
        set((state) => ({
          simulation: { ...state.simulation, speed },
        }))
      },

      saveAutomaton: () => {
        const { currentAutomaton, savedAutomata } = get()
        if (!currentAutomaton) return

        const existingIndex = savedAutomata.findIndex(
          (a) => a.id === currentAutomaton.id
        )

        if (existingIndex >= 0) {
          const updated = [...savedAutomata]
          updated[existingIndex] = currentAutomaton
          set({ savedAutomata: updated })
        } else {
          set({ savedAutomata: [...savedAutomata, currentAutomaton] })
        }
      },

      loadAutomaton: (id) => {
        const { savedAutomata } = get()
        const automaton = savedAutomata.find((a) => a.id === id)
        if (automaton) {
          set({
            currentAutomaton: automaton,
            simulation: initialSimulation,
            history: [],
            historyIndex: -1,
          })
        }
      },

      deleteAutomaton: (id) => {
        set((state) => ({
          savedAutomata: state.savedAutomata.filter((a) => a.id !== id),
        }))
      },

      exportAutomaton: () => {
        const { currentAutomaton } = get()
        if (!currentAutomaton) return ''
        return JSON.stringify(currentAutomaton, null, 2)
      },

      importAutomaton: (json) => {
        try {
          const automaton = JSON.parse(json) as Automaton
          if (!automaton.id || !automaton.type || !automaton.states) {
            return false
          }
          set({
            currentAutomaton: automaton,
            simulation: initialSimulation,
            history: [],
            historyIndex: -1,
          })
          return true
        } catch {
          return false
        }
      },

      pushHistory: () => {
        const { currentAutomaton, history, historyIndex } = get()
        if (!currentAutomaton) return

        const newHistory = history.slice(0, historyIndex + 1)
        newHistory.push(JSON.parse(JSON.stringify(currentAutomaton)))

        // Keep only last 50 states
        if (newHistory.length > 50) {
          newHistory.shift()
        }

        set({
          history: newHistory,
          historyIndex: newHistory.length - 1,
        })
      },

      undo: () => {
        const { history, historyIndex } = get()
        if (historyIndex <= 0) return

        set({
          currentAutomaton: history[historyIndex - 1],
          historyIndex: historyIndex - 1,
        })
      },

      redo: () => {
        const { history, historyIndex } = get()
        if (historyIndex >= history.length - 1) return

        set({
          currentAutomaton: history[historyIndex + 1],
          historyIndex: historyIndex + 1,
        })
      },

      generateFromTable: (tableData) => {
        const { currentAutomaton, pushHistory } = get()
        if (!currentAutomaton) return

        pushHistory()

        // Clear existing transitions
        const newTransitions: Transition[] = []
        
        // Track all state labels found in table
        const stateLabels = new Set<string>()
        const existingStateMap = new Map<string, State>()
        
        // Map existing states by label
        currentAutomaton.states.forEach(state => {
          existingStateMap.set(state.label, state)
        })
        
        // Collect all state labels from table rows
        Object.keys(tableData).forEach(label => {
          stateLabels.add(label)
        })
        
        // Collect all state labels from table values
        Object.values(tableData).forEach(symbolMap => {
          Object.values(symbolMap).forEach(cellValue => {
            if (cellValue.trim()) {
              const targets = cellValue.split(',').map(s => s.trim()).filter(s => s)
              targets.forEach(target => stateLabels.add(target))
            }
          })
        })
        
        // Create or reuse states
        const newStates: State[] = []
        const stateLabelToId = new Map<string, string>()
        const spacing = 150
        const cols = 4
        
        let stateIndex = 0
        stateLabels.forEach(label => {
          // Check if state already exists
          const existingState = existingStateMap.get(label)
          if (existingState) {
            newStates.push(existingState)
            stateLabelToId.set(label, existingState.id)
          } else {
            // Create new state with auto-positioning
            const row = Math.floor(stateIndex / cols)
            const col = stateIndex % cols
            const newState: State = {
              id: generateId(),
              label,
              isStart: stateIndex === 0 && !currentAutomaton.startState,
              isFinal: false,
              position: {
                x: 100 + col * spacing,
                y: 100 + row * spacing,
              },
            }
            newStates.push(newState)
            stateLabelToId.set(label, newState.id)
            stateIndex++
          }
        })
        
        // Generate transitions from table
        const transitionSet = new Set<string>() // Prevent duplicates
        
        Object.entries(tableData).forEach(([fromLabel, symbolMap]) => {
          const fromStateId = stateLabelToId.get(fromLabel)
          if (!fromStateId) return
          
          Object.entries(symbolMap).forEach(([symbol, cellValue]) => {
            if (!cellValue.trim()) return
            
            // Parse comma-separated targets
            const targets = cellValue.split(',').map(s => s.trim()).filter(s => s)
            
            targets.forEach(targetLabel => {
              const toStateId = stateLabelToId.get(targetLabel)
              if (!toStateId) return
              
              // Normalize epsilon symbols
              const normalizedSymbol = (symbol === 'ε' || symbol === 'epsilon') ? '' : symbol
              
              // Prevent duplicate transitions
              const transitionKey = `${fromStateId}-${toStateId}-${normalizedSymbol}`
              if (transitionSet.has(transitionKey)) return
              transitionSet.add(transitionKey)
              
              newTransitions.push({
                id: generateId(),
                from: fromStateId,
                to: toStateId,
                symbol: normalizedSymbol,
              })
            })
          })
        })
        
        // Update alphabet from transitions
        const newAlphabet = [...new Set(
          newTransitions
            .map(t => t.symbol)
            .filter(s => s !== '' && s !== 'ε')
        )]
        
        // Determine start state
        let startState = currentAutomaton.startState
        if (!startState && newStates.length > 0) {
          startState = newStates[0].id
          // Mark first state as start
          newStates[0].isStart = true
        }
        
        // Preserve final state flags from existing states
        const updatedStates = newStates.map(state => {
          const existingState = existingStateMap.get(state.label)
          if (existingState) {
            return { ...state, isFinal: existingState.isFinal }
          }
          return state
        })
        
        set({
          currentAutomaton: {
            ...currentAutomaton,
            states: updatedStates,
            transitions: newTransitions,
            alphabet: newAlphabet,
            startState,
            updatedAt: Date.now(),
          },
        })
      },
    }),
    {
      name: 'automata-lab-storage',
      partialize: (state) => ({ savedAutomata: state.savedAutomata }),
    }
  )
)

// Helper function to compute epsilon closure
function computeEpsilonClosure(states: string[], transitions: Transition[]): string[] {
  const closure = new Set(states)
  const stack = [...states]

  while (stack.length > 0) {
    const current = stack.pop()!
    const epsilonTransitions = transitions.filter(
      (t) => t.from === current && (t.symbol === 'ε' || t.symbol === '')
    )

    for (const t of epsilonTransitions) {
      if (!closure.has(t.to)) {
        closure.add(t.to)
        stack.push(t.to)
      }
    }
  }

  return [...closure]
}
