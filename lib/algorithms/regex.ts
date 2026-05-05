import type { State, Transition, Automaton } from '@/lib/store/automata-store'

/**
 * Regular Expression Parser and NFA Constructor (Thompson's Construction)
 */

// AST Node types for regex
type RegexNode =
  | { type: 'char'; value: string }
  | { type: 'epsilon' }
  | { type: 'concat'; left: RegexNode; right: RegexNode }
  | { type: 'union'; left: RegexNode; right: RegexNode }
  | { type: 'star'; operand: RegexNode }
  | { type: 'plus'; operand: RegexNode }
  | { type: 'optional'; operand: RegexNode }

/**
 * Parse a regular expression string into an AST
 * Supports: a-z, 0-9, *, +, ?, |, (), ε
 */
export function parseRegex(pattern: string): RegexNode | null {
  let pos = 0

  const peek = (): string | null => (pos < pattern.length ? pattern[pos] : null)
  const consume = (): string | null => (pos < pattern.length ? pattern[pos++] : null)

  // expr = term ('|' term)*
  const parseExpr = (): RegexNode | null => {
    let left = parseTerm()
    if (!left) return null

    while (peek() === '|') {
      consume() // eat '|'
      const right = parseTerm()
      if (!right) return null
      left = { type: 'union', left, right }
    }

    return left
  }

  // term = factor+
  const parseTerm = (): RegexNode | null => {
    let left = parseFactor()
    if (!left) return null

    while (peek() !== null && peek() !== '|' && peek() !== ')') {
      const right = parseFactor()
      if (!right) break
      left = { type: 'concat', left, right }
    }

    return left
  }

  // factor = base ('*' | '+' | '?')*
  const parseFactor = (): RegexNode | null => {
    let base = parseBase()
    if (!base) return null

    while (true) {
      const c = peek()
      if (c === '*') {
        consume()
        base = { type: 'star', operand: base }
      } else if (c === '+') {
        consume()
        base = { type: 'plus', operand: base }
      } else if (c === '?') {
        consume()
        base = { type: 'optional', operand: base }
      } else {
        break
      }
    }

    return base
  }

  // base = char | '(' expr ')' | 'ε'
  const parseBase = (): RegexNode | null => {
    const c = peek()
    if (c === null) return null

    if (c === '(') {
      consume() // eat '('
      const expr = parseExpr()
      if (peek() !== ')') return null
      consume() // eat ')'
      return expr
    }

    if (c === 'ε' || c === 'e' || (c === '\\' && pattern[pos + 1] === 'e')) {
      if (c === '\\') {
        consume()
        consume()
      } else {
        consume()
      }
      return { type: 'epsilon' }
    }

    if (c === '*' || c === '+' || c === '?' || c === '|' || c === ')') {
      return null
    }

    consume()
    return { type: 'char', value: c }
  }

  const result = parseExpr()

  // Check if we consumed the entire input
  if (pos !== pattern.length) return null

  return result
}

/**
 * Thompson's Construction: Convert regex AST to ε-NFA
 */
interface NFAFragment {
  start: string
  accept: string
  states: State[]
  transitions: Transition[]
}

let stateCounter = 0

function generateStateId(): string {
  return `s${stateCounter++}`
}

function createState(id: string, x: number, y: number): State {
  return {
    id,
    label: `q${id.substring(1)}`,
    isStart: false,
    isFinal: false,
    position: { x, y },
  }
}

function buildNFA(node: RegexNode, x: number, y: number): NFAFragment {
  switch (node.type) {
    case 'char': {
      const start = generateStateId()
      const accept = generateStateId()
      return {
        start,
        accept,
        states: [createState(start, x, y), createState(accept, x + 150, y)],
        transitions: [
          { id: generateStateId(), from: start, to: accept, symbol: node.value },
        ],
      }
    }

    case 'epsilon': {
      const start = generateStateId()
      const accept = generateStateId()
      return {
        start,
        accept,
        states: [createState(start, x, y), createState(accept, x + 150, y)],
        transitions: [
          { id: generateStateId(), from: start, to: accept, symbol: 'ε' },
        ],
      }
    }

    case 'concat': {
      const left = buildNFA(node.left, x, y)
      const right = buildNFA(node.right, x + left.states.length * 100, y)

      // Connect left's accept to right's start with epsilon
      return {
        start: left.start,
        accept: right.accept,
        states: [...left.states, ...right.states],
        transitions: [
          ...left.transitions,
          ...right.transitions,
          { id: generateStateId(), from: left.accept, to: right.start, symbol: 'ε' },
        ],
      }
    }

    case 'union': {
      const start = generateStateId()
      const accept = generateStateId()
      const left = buildNFA(node.left, x + 150, y - 100)
      const right = buildNFA(node.right, x + 150, y + 100)

      return {
        start,
        accept,
        states: [
          createState(start, x, y),
          createState(accept, x + 300 + Math.max(left.states.length, right.states.length) * 50, y),
          ...left.states,
          ...right.states,
        ],
        transitions: [
          ...left.transitions,
          ...right.transitions,
          { id: generateStateId(), from: start, to: left.start, symbol: 'ε' },
          { id: generateStateId(), from: start, to: right.start, symbol: 'ε' },
          { id: generateStateId(), from: left.accept, to: accept, symbol: 'ε' },
          { id: generateStateId(), from: right.accept, to: accept, symbol: 'ε' },
        ],
      }
    }

    case 'star': {
      const start = generateStateId()
      const accept = generateStateId()
      const inner = buildNFA(node.operand, x + 150, y)

      return {
        start,
        accept,
        states: [
          createState(start, x, y),
          createState(accept, x + 300 + inner.states.length * 50, y),
          ...inner.states,
        ],
        transitions: [
          ...inner.transitions,
          { id: generateStateId(), from: start, to: inner.start, symbol: 'ε' },
          { id: generateStateId(), from: start, to: accept, symbol: 'ε' },
          { id: generateStateId(), from: inner.accept, to: inner.start, symbol: 'ε' },
          { id: generateStateId(), from: inner.accept, to: accept, symbol: 'ε' },
        ],
      }
    }

    case 'plus': {
      // a+ = aa*
      const start = generateStateId()
      const accept = generateStateId()
      const inner = buildNFA(node.operand, x + 150, y)

      return {
        start,
        accept,
        states: [
          createState(start, x, y),
          createState(accept, x + 300 + inner.states.length * 50, y),
          ...inner.states,
        ],
        transitions: [
          ...inner.transitions,
          { id: generateStateId(), from: start, to: inner.start, symbol: 'ε' },
          { id: generateStateId(), from: inner.accept, to: inner.start, symbol: 'ε' },
          { id: generateStateId(), from: inner.accept, to: accept, symbol: 'ε' },
        ],
      }
    }

    case 'optional': {
      // a? = (a|ε)
      const start = generateStateId()
      const accept = generateStateId()
      const inner = buildNFA(node.operand, x + 150, y)

      return {
        start,
        accept,
        states: [
          createState(start, x, y),
          createState(accept, x + 300 + inner.states.length * 50, y),
          ...inner.states,
        ],
        transitions: [
          ...inner.transitions,
          { id: generateStateId(), from: start, to: inner.start, symbol: 'ε' },
          { id: generateStateId(), from: start, to: accept, symbol: 'ε' },
          { id: generateStateId(), from: inner.accept, to: accept, symbol: 'ε' },
        ],
      }
    }
  }
}

/**
 * Convert regex string to ε-NFA using Thompson's construction
 */
export function regexToNFA(pattern: string): Automaton | null {
  stateCounter = 0

  const ast = parseRegex(pattern)
  if (!ast) return null

  const fragment = buildNFA(ast, 100, 200)

  // Mark start and final states
  const states = fragment.states.map((s) => ({
    ...s,
    isStart: s.id === fragment.start,
    isFinal: s.id === fragment.accept,
  }))

  // Extract alphabet
  const alphabet = [
    ...new Set(
      fragment.transitions
        .map((t) => t.symbol)
        .filter((s) => s !== 'ε')
    ),
  ]

  return {
    id: Math.random().toString(36).substring(2, 9),
    name: `NFA for /${pattern}/`,
    type: 'epsilon-nfa',
    states,
    transitions: fragment.transitions,
    alphabet,
    startState: fragment.start,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

/**
 * Test if a string matches a regex pattern
 */
export function testRegex(pattern: string, input: string): boolean {
  try {
    // Use native JavaScript regex for testing
    const regex = new RegExp(`^${pattern}$`)
    return regex.test(input)
  } catch {
    return false
  }
}

/**
 * Test multiple strings against a regex
 */
export function batchTestRegex(
  pattern: string,
  strings: string[]
): { string: string; matches: boolean }[] {
  return strings.map((str) => ({
    string: str,
    matches: testRegex(pattern, str),
  }))
}

/**
 * Validate regex syntax
 */
export function validateRegex(pattern: string): { valid: boolean; error?: string } {
  try {
    new RegExp(pattern)
    // Also try our parser
    const ast = parseRegex(pattern)
    if (!ast && pattern.length > 0) {
      return { valid: false, error: 'Invalid regex syntax for automata conversion' }
    }
    return { valid: true }
  } catch (e) {
    return { valid: false, error: (e as Error).message }
  }
}

/**
 * Generate example strings that match/don't match the regex
 */
export function generateRegexExamples(
  pattern: string,
  maxLength: number = 5
): { matches: string[]; nonMatches: string[] } {
  const nfa = regexToNFA(pattern)
  if (!nfa) return { matches: [], nonMatches: [] }

  const matches: string[] = []
  const nonMatches: string[] = []

  // Get alphabet from the pattern
  const alphabet = nfa.alphabet.length > 0 ? nfa.alphabet : ['a', 'b']

  // Generate strings systematically
  const generateStrings = (maxLen: number): string[] => {
    const result: string[] = ['']
    const queue = ['']

    while (queue.length > 0) {
      const current = queue.shift()!
      if (current.length >= maxLen) continue

      for (const symbol of alphabet) {
        const next = current + symbol
        result.push(next)
        queue.push(next)
      }
    }

    return result
  }

  const testStrings = generateStrings(maxLength)

  for (const str of testStrings) {
    if (matches.length >= 10 && nonMatches.length >= 10) break

    if (testRegex(pattern, str)) {
      if (matches.length < 10) matches.push(str || 'ε')
    } else {
      if (nonMatches.length < 10) nonMatches.push(str || 'ε')
    }
  }

  return { matches, nonMatches }
}

/**
 * Get regex AST as string (for visualization)
 */
export function regexToString(node: RegexNode): string {
  switch (node.type) {
    case 'char':
      return node.value
    case 'epsilon':
      return 'ε'
    case 'concat':
      return `${regexToString(node.left)}${regexToString(node.right)}`
    case 'union':
      return `(${regexToString(node.left)}|${regexToString(node.right)})`
    case 'star':
      return `(${regexToString(node.operand)})*`
    case 'plus':
      return `(${regexToString(node.operand)})+`
    case 'optional':
      return `(${regexToString(node.operand)})?`
  }
}
