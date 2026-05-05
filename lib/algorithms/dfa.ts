import type { State, Transition, Automaton } from '@/lib/store/automata-store'

export interface DFAValidationResult {
  isValid: boolean
  isDeterministic: boolean
  isComplete: boolean
  errors: string[]
  warnings: string[]
  unreachableStates: string[]
  deadStates: string[]
}

/**
 * Validates a DFA for correctness
 */
export function validateDFA(automaton: Automaton): DFAValidationResult {
  const result: DFAValidationResult = {
    isValid: true,
    isDeterministic: true,
    isComplete: true,
    errors: [],
    warnings: [],
    unreachableStates: [],
    deadStates: [],
  }

  // Check for start state
  if (!automaton.startState) {
    result.errors.push('No start state defined')
    result.isValid = false
  }

  // Check for at least one final state
  const hasFinalState = automaton.states.some((s) => s.isFinal)
  if (!hasFinalState) {
    result.warnings.push('No final states defined - all strings will be rejected')
  }

  // Check determinism: each state should have exactly one transition per symbol
  for (const state of automaton.states) {
    for (const symbol of automaton.alphabet) {
      const transitions = automaton.transitions.filter(
        (t) => t.from === state.id && t.symbol === symbol
      )

      if (transitions.length > 1) {
        result.errors.push(
          `State ${state.label} has multiple transitions on symbol '${symbol}'`
        )
        result.isDeterministic = false
        result.isValid = false
      }

      if (transitions.length === 0) {
        result.warnings.push(
          `State ${state.label} has no transition on symbol '${symbol}'`
        )
        result.isComplete = false
      }
    }
  }

  // Find unreachable states
  const reachable = findReachableStates(automaton)
  for (const state of automaton.states) {
    if (!reachable.has(state.id)) {
      result.unreachableStates.push(state.label)
      result.warnings.push(`State ${state.label} is unreachable`)
    }
  }

  // Find dead states (non-final states from which no final state is reachable)
  const deadStates = findDeadStates(automaton)
  result.deadStates = deadStates.map(
    (id) => automaton.states.find((s) => s.id === id)?.label || id
  )
  for (const label of result.deadStates) {
    result.warnings.push(`State ${label} is a dead state`)
  }

  return result
}

/**
 * Find all states reachable from the start state
 */
export function findReachableStates(automaton: Automaton): Set<string> {
  const reachable = new Set<string>()
  if (!automaton.startState) return reachable

  const stack = [automaton.startState]
  reachable.add(automaton.startState)

  while (stack.length > 0) {
    const current = stack.pop()!
    const transitions = automaton.transitions.filter((t) => t.from === current)

    for (const t of transitions) {
      if (!reachable.has(t.to)) {
        reachable.add(t.to)
        stack.push(t.to)
      }
    }
  }

  return reachable
}

/**
 * Find dead states (states from which no final state is reachable)
 */
export function findDeadStates(automaton: Automaton): string[] {
  const finalStates = new Set(
    automaton.states.filter((s) => s.isFinal).map((s) => s.id)
  )

  // Reverse the graph and find states that can reach a final state
  const canReachFinal = new Set<string>(finalStates)
  let changed = true

  while (changed) {
    changed = false
    for (const t of automaton.transitions) {
      if (canReachFinal.has(t.to) && !canReachFinal.has(t.from)) {
        canReachFinal.add(t.from)
        changed = true
      }
    }
  }

  // Dead states are those that cannot reach any final state
  return automaton.states
    .filter((s) => !s.isFinal && !canReachFinal.has(s.id))
    .map((s) => s.id)
}

/**
 * Simulate DFA on an input string
 */
export interface SimulationStep {
  state: string
  stateLabel: string
  symbol: string | null
  remaining: string
}

export function simulateDFA(
  automaton: Automaton,
  input: string
): { accepted: boolean; steps: SimulationStep[] } {
  const steps: SimulationStep[] = []

  if (!automaton.startState) {
    return { accepted: false, steps }
  }

  let currentState = automaton.startState
  const startStateObj = automaton.states.find((s) => s.id === currentState)

  steps.push({
    state: currentState,
    stateLabel: startStateObj?.label || currentState,
    symbol: null,
    remaining: input,
  })

  for (let i = 0; i < input.length; i++) {
    const symbol = input[i]
    const transition = automaton.transitions.find(
      (t) => t.from === currentState && t.symbol === symbol
    )

    if (!transition) {
      // No valid transition - reject
      return { accepted: false, steps }
    }

    currentState = transition.to
    const stateObj = automaton.states.find((s) => s.id === currentState)

    steps.push({
      state: currentState,
      stateLabel: stateObj?.label || currentState,
      symbol,
      remaining: input.slice(i + 1),
    })
  }

  const finalState = automaton.states.find((s) => s.id === currentState)
  return { accepted: finalState?.isFinal || false, steps }
}

/**
 * Generate strings accepted by the DFA (up to maxLength)
 */
export function generateAcceptedStrings(
  automaton: Automaton,
  maxLength: number = 5,
  maxCount: number = 100
): string[] {
  const accepted: string[] = []
  if (!automaton.startState) return accepted

  // BFS to generate strings
  interface QueueItem {
    state: string
    string: string
  }

  const queue: QueueItem[] = [{ state: automaton.startState, string: '' }]

  while (queue.length > 0 && accepted.length < maxCount) {
    const { state, string } = queue.shift()!

    // Check if current state is final
    const stateObj = automaton.states.find((s) => s.id === state)
    if (stateObj?.isFinal) {
      accepted.push(string || 'ε')
    }

    // Don't explore beyond maxLength
    if (string.length >= maxLength) continue

    // Add all possible transitions
    for (const symbol of automaton.alphabet) {
      const transition = automaton.transitions.find(
        (t) => t.from === state && t.symbol === symbol
      )
      if (transition) {
        queue.push({ state: transition.to, string: string + symbol })
      }
    }
  }

  return accepted
}

/**
 * Test multiple strings against the DFA
 */
export function batchTest(
  automaton: Automaton,
  strings: string[]
): { string: string; accepted: boolean }[] {
  return strings.map((str) => ({
    string: str,
    accepted: simulateDFA(automaton, str).accepted,
  }))
}

/**
 * Check if two DFAs are equivalent
 */
export function areEquivalent(dfa1: Automaton, dfa2: Automaton): boolean {
  // Table-filling algorithm
  // First, we need to ensure both DFAs have the same alphabet
  const alphabet = [...new Set([...dfa1.alphabet, ...dfa2.alphabet])]

  // Create a product automaton conceptually and check for distinguishable states
  type StatePair = [string, string]

  const pairs: Map<string, boolean> = new Map()
  const pairKey = (p: StatePair) => `${p[0]}|${p[1]}`

  // Initialize: mark pairs where one is final and one is not
  for (const s1 of dfa1.states) {
    for (const s2 of dfa2.states) {
      const key = pairKey([s1.id, s2.id])
      if (s1.isFinal !== s2.isFinal) {
        pairs.set(key, true) // distinguishable
      } else {
        pairs.set(key, false) // potentially equivalent
      }
    }
  }

  // Iterate until no changes
  let changed = true
  while (changed) {
    changed = false
    for (const s1 of dfa1.states) {
      for (const s2 of dfa2.states) {
        const key = pairKey([s1.id, s2.id])
        if (pairs.get(key)) continue // already distinguishable

        for (const symbol of alphabet) {
          const t1 = dfa1.transitions.find(
            (t) => t.from === s1.id && t.symbol === symbol
          )
          const t2 = dfa2.transitions.find(
            (t) => t.from === s2.id && t.symbol === symbol
          )

          if (t1 && t2) {
            const nextKey = pairKey([t1.to, t2.to])
            if (pairs.get(nextKey)) {
              pairs.set(key, true)
              changed = true
              break
            }
          } else if (t1 || t2) {
            // One has transition, other doesn't
            pairs.set(key, true)
            changed = true
            break
          }
        }
      }
    }
  }

  // Check if start states are equivalent
  if (!dfa1.startState || !dfa2.startState) return false
  const startKey = pairKey([dfa1.startState, dfa2.startState])
  return !pairs.get(startKey)
}

/**
 * Complement of a DFA (swap final and non-final states)
 */
export function complementDFA(automaton: Automaton): Automaton {
  return {
    ...automaton,
    id: Math.random().toString(36).substring(2, 9),
    name: `Complement of ${automaton.name}`,
    states: automaton.states.map((s) => ({ ...s, isFinal: !s.isFinal })),
    updatedAt: Date.now(),
  }
}

/**
 * Count states and transitions
 */
export function getAutomatonStats(automaton: Automaton) {
  return {
    stateCount: automaton.states.length,
    transitionCount: automaton.transitions.length,
    alphabetSize: automaton.alphabet.length,
    finalStateCount: automaton.states.filter((s) => s.isFinal).length,
    hasStartState: !!automaton.startState,
  }
}
