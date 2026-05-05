import type { State, Transition, Automaton } from '@/lib/store/automata-store'

/**
 * Compute epsilon closure of a set of states
 */
export function epsilonClosure(
  states: string[],
  transitions: Transition[]
): string[] {
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

/**
 * Compute the move function: states reachable from given states on a symbol
 */
export function move(
  states: string[],
  symbol: string,
  transitions: Transition[]
): string[] {
  const result = new Set<string>()

  for (const state of states) {
    const matching = transitions.filter(
      (t) => t.from === state && t.symbol === symbol
    )
    for (const t of matching) {
      result.add(t.to)
    }
  }

  return [...result]
}

/**
 * Simulate NFA on an input string
 */
export interface NFASimulationStep {
  states: string[]
  stateLabels: string[]
  symbol: string | null
  remaining: string
}

export function simulateNFA(
  automaton: Automaton,
  input: string
): { accepted: boolean; steps: NFASimulationStep[] } {
  const steps: NFASimulationStep[] = []

  if (!automaton.startState) {
    return { accepted: false, steps }
  }

  // Start with epsilon closure of start state
  let currentStates = epsilonClosure([automaton.startState], automaton.transitions)

  const getLabels = (ids: string[]) =>
    ids.map((id) => automaton.states.find((s) => s.id === id)?.label || id)

  steps.push({
    states: currentStates,
    stateLabels: getLabels(currentStates),
    symbol: null,
    remaining: input,
  })

  for (let i = 0; i < input.length; i++) {
    const symbol = input[i]

    // Move on symbol, then compute epsilon closure
    const afterMove = move(currentStates, symbol, automaton.transitions)
    currentStates = epsilonClosure(afterMove, automaton.transitions)

    steps.push({
      states: currentStates,
      stateLabels: getLabels(currentStates),
      symbol,
      remaining: input.slice(i + 1),
    })

    // If no states, the NFA rejects (dead configuration)
    if (currentStates.length === 0) {
      return { accepted: false, steps }
    }
  }

  // Check if any current state is final
  const accepted = currentStates.some((stateId) => {
    const state = automaton.states.find((s) => s.id === stateId)
    return state?.isFinal
  })

  return { accepted, steps }
}

/**
 * NFA to DFA conversion using subset construction
 */
export interface SubsetConstructionStep {
  dfaState: string[]
  dfaStateLabel: string
  symbol: string
  targetStates: string[]
  targetLabel: string
}

export interface NFAToDFAResult {
  dfa: Automaton
  steps: SubsetConstructionStep[]
  stateMapping: Map<string, string[]>
}

export function nfaToDFA(nfa: Automaton): NFAToDFAResult {
  const steps: SubsetConstructionStep[] = []
  const stateMapping = new Map<string, string[]>()

  if (!nfa.startState) {
    return {
      dfa: { ...nfa, type: 'dfa', states: [], transitions: [] },
      steps,
      stateMapping,
    }
  }

  const generateId = () => Math.random().toString(36).substring(2, 9)

  // Helper to create a unique key for a set of states
  const setKey = (states: string[]): string => [...states].sort().join(',')

  // Helper to create a label for a DFA state
  const createLabel = (states: string[]): string => {
    if (states.length === 0) return '∅'
    const labels = states
      .map((id) => nfa.states.find((s) => s.id === id)?.label || id)
      .sort()
    return `{${labels.join(',')}}`
  }

  // Start state is epsilon closure of NFA start state
  const startSet = epsilonClosure([nfa.startState], nfa.transitions)
  const startKey = setKey(startSet)

  const dfaStates: State[] = []
  const dfaTransitions: Transition[] = []
  const processed = new Set<string>()
  const queue: string[][] = [startSet]
  const keyToId = new Map<string, string>()

  // Create start state
  const startId = generateId()
  keyToId.set(startKey, startId)
  stateMapping.set(startId, startSet)

  dfaStates.push({
    id: startId,
    label: createLabel(startSet),
    isStart: true,
    isFinal: startSet.some((id) => nfa.states.find((s) => s.id === id)?.isFinal),
    position: { x: 100, y: 200 },
  })

  while (queue.length > 0) {
    const currentSet = queue.shift()!
    const currentKey = setKey(currentSet)

    if (processed.has(currentKey)) continue
    processed.add(currentKey)

    const currentId = keyToId.get(currentKey)!

    // For each symbol in alphabet
    for (const symbol of nfa.alphabet) {
      if (symbol === 'ε' || symbol === '') continue

      // Compute move then epsilon closure
      const afterMove = move(currentSet, symbol, nfa.transitions)
      const targetSet = epsilonClosure(afterMove, nfa.transitions)
      const targetKey = setKey(targetSet)

      // Skip empty sets (dead state) - or add dead state if needed
      if (targetSet.length === 0) continue

      // Create target state if new
      if (!keyToId.has(targetKey)) {
        const targetId = generateId()
        keyToId.set(targetKey, targetId)
        stateMapping.set(targetId, targetSet)

        dfaStates.push({
          id: targetId,
          label: createLabel(targetSet),
          isStart: false,
          isFinal: targetSet.some(
            (id) => nfa.states.find((s) => s.id === id)?.isFinal
          ),
          position: {
            x: 100 + dfaStates.length * 150,
            y: 200 + (dfaStates.length % 2) * 100,
          },
        })

        queue.push(targetSet)
      }

      const targetId = keyToId.get(targetKey)!

      // Add transition
      dfaTransitions.push({
        id: generateId(),
        from: currentId,
        to: targetId,
        symbol,
      })

      steps.push({
        dfaState: currentSet,
        dfaStateLabel: createLabel(currentSet),
        symbol,
        targetStates: targetSet,
        targetLabel: createLabel(targetSet),
      })
    }
  }

  const dfa: Automaton = {
    id: generateId(),
    name: `DFA from ${nfa.name}`,
    type: 'dfa',
    states: dfaStates,
    transitions: dfaTransitions,
    alphabet: nfa.alphabet.filter((s) => s !== 'ε' && s !== ''),
    startState: startId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  return { dfa, steps, stateMapping }
}

/**
 * Remove epsilon transitions from an NFA
 */
export function removeEpsilonTransitions(nfa: Automaton): Automaton {
  const generateId = () => Math.random().toString(36).substring(2, 9)
  const newTransitions: Transition[] = []

  for (const state of nfa.states) {
    // Get epsilon closure of this state
    const closure = epsilonClosure([state.id], nfa.transitions)

    // For each symbol in alphabet (except epsilon)
    for (const symbol of nfa.alphabet) {
      if (symbol === 'ε' || symbol === '') continue

      // Find all states reachable by: epsilon* -> symbol -> epsilon*
      const targets = new Set<string>()

      for (const closureState of closure) {
        const afterSymbol = move([closureState], symbol, nfa.transitions)
        const afterEpsilon = epsilonClosure(afterSymbol, nfa.transitions)
        afterEpsilon.forEach((t) => targets.add(t))
      }

      // Add transitions
      for (const target of targets) {
        newTransitions.push({
          id: generateId(),
          from: state.id,
          to: target,
          symbol,
        })
      }
    }
  }

  // Update final states: a state is final if its epsilon closure contains a final state
  const newStates = nfa.states.map((state) => {
    const closure = epsilonClosure([state.id], nfa.transitions)
    const isFinal = closure.some((id) => nfa.states.find((s) => s.id === id)?.isFinal)
    return { ...state, isFinal }
  })

  return {
    ...nfa,
    id: generateId(),
    name: `${nfa.name} (ε-free)`,
    type: 'nfa',
    states: newStates,
    transitions: newTransitions,
    alphabet: nfa.alphabet.filter((s) => s !== 'ε' && s !== ''),
    updatedAt: Date.now(),
  }
}

/**
 * Validate NFA
 */
export interface NFAValidationResult {
  isValid: boolean
  hasEpsilonTransitions: boolean
  errors: string[]
  warnings: string[]
}

export function validateNFA(automaton: Automaton): NFAValidationResult {
  const result: NFAValidationResult = {
    isValid: true,
    hasEpsilonTransitions: false,
    errors: [],
    warnings: [],
  }

  if (!automaton.startState) {
    result.errors.push('No start state defined')
    result.isValid = false
  }

  const hasFinalState = automaton.states.some((s) => s.isFinal)
  if (!hasFinalState) {
    result.warnings.push('No final states defined')
  }

  // Check for epsilon transitions
  result.hasEpsilonTransitions = automaton.transitions.some(
    (t) => t.symbol === 'ε' || t.symbol === ''
  )

  return result
}

/**
 * Generate accepted strings from NFA
 */
export function generateAcceptedStringsNFA(
  automaton: Automaton,
  maxLength: number = 5,
  maxCount: number = 100
): string[] {
  const accepted: string[] = []
  if (!automaton.startState) return accepted

  interface QueueItem {
    states: string[]
    string: string
  }

  const initialStates = epsilonClosure([automaton.startState], automaton.transitions)
  const queue: QueueItem[] = [{ states: initialStates, string: '' }]
  const visited = new Set<string>()

  while (queue.length > 0 && accepted.length < maxCount) {
    const { states, string } = queue.shift()!

    // Create unique key to avoid revisiting same configuration
    const key = `${[...states].sort().join(',')}|${string}`
    if (visited.has(key)) continue
    visited.add(key)

    // Check if any current state is final
    const isFinal = states.some((id) => automaton.states.find((s) => s.id === id)?.isFinal)
    if (isFinal && !accepted.includes(string || 'ε')) {
      accepted.push(string || 'ε')
    }

    if (string.length >= maxLength) continue

    // Try all symbols
    for (const symbol of automaton.alphabet) {
      if (symbol === 'ε' || symbol === '') continue

      const afterMove = move(states, symbol, automaton.transitions)
      const nextStates = epsilonClosure(afterMove, automaton.transitions)

      if (nextStates.length > 0) {
        queue.push({ states: nextStates, string: string + symbol })
      }
    }
  }

  return accepted
}
