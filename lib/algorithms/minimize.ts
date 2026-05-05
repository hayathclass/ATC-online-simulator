import type { State, Transition, Automaton } from '@/lib/store/automata-store'
import { findReachableStates } from './dfa'

/**
 * DFA Minimization using Table-Filling Algorithm (Myhill-Nerode)
 */

export interface MinimizationStep {
  step: number
  description: string
  distinguishable: [string, string][]
  equivalenceClasses: string[][]
}

export interface MinimizationResult {
  minimizedDFA: Automaton
  steps: MinimizationStep[]
  originalStateCount: number
  minimizedStateCount: number
  removedStates: string[]
  mergedStates: Map<string, string[]>
}

/**
 * Minimize a DFA using the table-filling algorithm
 */
export function minimizeDFA(dfa: Automaton): MinimizationResult {
  const steps: MinimizationStep[] = []
  const generateId = () => Math.random().toString(36).substring(2, 9)

  // Step 1: Remove unreachable states
  const reachable = findReachableStates(dfa)
  const reachableStates = dfa.states.filter((s) => reachable.has(s.id))
  const reachableTransitions = dfa.transitions.filter(
    (t) => reachable.has(t.from) && reachable.has(t.to)
  )

  const removedStates = dfa.states
    .filter((s) => !reachable.has(s.id))
    .map((s) => s.label)

  steps.push({
    step: 1,
    description: `Removed ${removedStates.length} unreachable states: ${removedStates.join(', ') || 'none'}`,
    distinguishable: [],
    equivalenceClasses: [reachableStates.map((s) => s.label)],
  })

  // Step 2: Initialize distinguishable pairs
  // Two states are distinguishable if one is final and the other is not
  const distinguishable = new Map<string, boolean>()
  const pairKey = (a: string, b: string) => [a, b].sort().join('|')

  for (let i = 0; i < reachableStates.length; i++) {
    for (let j = i + 1; j < reachableStates.length; j++) {
      const s1 = reachableStates[i]
      const s2 = reachableStates[j]
      const key = pairKey(s1.id, s2.id)

      if (s1.isFinal !== s2.isFinal) {
        distinguishable.set(key, true)
      } else {
        distinguishable.set(key, false)
      }
    }
  }

  const initialDistinguishable: [string, string][] = []
  distinguishable.forEach((isDist, key) => {
    if (isDist) {
      const [a, b] = key.split('|')
      const labelA = reachableStates.find((s) => s.id === a)?.label || a
      const labelB = reachableStates.find((s) => s.id === b)?.label || b
      initialDistinguishable.push([labelA, labelB])
    }
  })

  steps.push({
    step: 2,
    description: 'Marked pairs where one state is final and the other is not',
    distinguishable: initialDistinguishable,
    equivalenceClasses: [],
  })

  // Step 3: Iteratively mark distinguishable pairs
  let changed = true
  let iteration = 0

  while (changed && iteration < 100) {
    changed = false
    iteration++

    for (let i = 0; i < reachableStates.length; i++) {
      for (let j = i + 1; j < reachableStates.length; j++) {
        const s1 = reachableStates[i]
        const s2 = reachableStates[j]
        const key = pairKey(s1.id, s2.id)

        if (distinguishable.get(key)) continue // Already distinguishable

        // Check for each symbol if transitions lead to distinguishable states
        for (const symbol of dfa.alphabet) {
          const t1 = reachableTransitions.find(
            (t) => t.from === s1.id && t.symbol === symbol
          )
          const t2 = reachableTransitions.find(
            (t) => t.from === s2.id && t.symbol === symbol
          )

          // If one has transition and other doesn't, they're distinguishable
          if ((t1 && !t2) || (!t1 && t2)) {
            distinguishable.set(key, true)
            changed = true
            break
          }

          // If both have transitions, check if destinations are distinguishable
          if (t1 && t2 && t1.to !== t2.to) {
            const destKey = pairKey(t1.to, t2.to)
            if (distinguishable.get(destKey)) {
              distinguishable.set(key, true)
              changed = true
              break
            }
          }
        }
      }
    }

    if (changed) {
      const currentDistinguishable: [string, string][] = []
      distinguishable.forEach((isDist, key) => {
        if (isDist) {
          const [a, b] = key.split('|')
          const labelA = reachableStates.find((s) => s.id === a)?.label || a
          const labelB = reachableStates.find((s) => s.id === b)?.label || b
          currentDistinguishable.push([labelA, labelB])
        }
      })

      steps.push({
        step: 2 + iteration,
        description: `Iteration ${iteration}: Found more distinguishable pairs by checking transitions`,
        distinguishable: currentDistinguishable,
        equivalenceClasses: [],
      })
    }
  }

  // Step 4: Build equivalence classes
  const equivalenceClasses: string[][] = []
  const assigned = new Set<string>()

  for (const state of reachableStates) {
    if (assigned.has(state.id)) continue

    const equivalentStates = [state.id]
    assigned.add(state.id)

    for (const other of reachableStates) {
      if (assigned.has(other.id)) continue

      const key = pairKey(state.id, other.id)
      if (!distinguishable.get(key)) {
        equivalentStates.push(other.id)
        assigned.add(other.id)
      }
    }

    equivalenceClasses.push(equivalentStates)
  }

  const classLabels = equivalenceClasses.map((cls) =>
    cls.map((id) => reachableStates.find((s) => s.id === id)?.label || id)
  )

  steps.push({
    step: steps.length + 1,
    description: `Built ${equivalenceClasses.length} equivalence classes`,
    distinguishable: [],
    equivalenceClasses: classLabels,
  })

  // Step 5: Build minimized DFA
  const newStates: State[] = []
  const newTransitions: Transition[] = []
  const mergedStates = new Map<string, string[]>()
  const classToNewId = new Map<number, string>()

  // Create new states for each equivalence class
  for (let i = 0; i < equivalenceClasses.length; i++) {
    const cls = equivalenceClasses[i]
    const newId = generateId()
    classToNewId.set(i, newId)

    // Representative state (first in class)
    const representative = reachableStates.find((s) => s.id === cls[0])!

    // Label is union of all labels in class
    const label =
      cls.length === 1
        ? representative.label
        : `{${cls.map((id) => reachableStates.find((s) => s.id === id)?.label).join(',')}}`

    newStates.push({
      id: newId,
      label,
      isStart: cls.some((id) => id === dfa.startState),
      isFinal: representative.isFinal,
      position: {
        x: 100 + i * 200,
        y: 200,
      },
    })

    mergedStates.set(newId, cls.map((id) => reachableStates.find((s) => s.id === id)?.label || id))
  }

  // Create transitions for minimized DFA
  const getClassIndex = (stateId: string): number => {
    return equivalenceClasses.findIndex((cls) => cls.includes(stateId))
  }

  const addedTransitions = new Set<string>()

  for (const t of reachableTransitions) {
    const fromClass = getClassIndex(t.from)
    const toClass = getClassIndex(t.to)

    if (fromClass === -1 || toClass === -1) continue

    const fromNewId = classToNewId.get(fromClass)!
    const toNewId = classToNewId.get(toClass)!

    const transitionKey = `${fromNewId}|${t.symbol}|${toNewId}`
    if (addedTransitions.has(transitionKey)) continue
    addedTransitions.add(transitionKey)

    newTransitions.push({
      id: generateId(),
      from: fromNewId,
      to: toNewId,
      symbol: t.symbol,
    })
  }

  const minimizedDFA: Automaton = {
    id: generateId(),
    name: `${dfa.name} (minimized)`,
    type: 'dfa',
    states: newStates,
    transitions: newTransitions,
    alphabet: dfa.alphabet,
    startState: newStates.find((s) => s.isStart)?.id || null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  return {
    minimizedDFA,
    steps,
    originalStateCount: dfa.states.length,
    minimizedStateCount: newStates.length,
    removedStates,
    mergedStates,
  }
}

/**
 * Check if a DFA is already minimal
 */
export function isMinimal(dfa: Automaton): boolean {
  const result = minimizeDFA(dfa)
  return result.minimizedStateCount === result.originalStateCount
}
