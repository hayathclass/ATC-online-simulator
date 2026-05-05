"use client";

import { useState, useCallback, useEffect } from "react";
import { useAutomataStore } from "@/lib/store/automata-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Play, GitBranch, ArrowRight } from "lucide-react";
import { AutomataCanvas } from "@/components/canvas/automata-canvas";
import { ReactFlowProvider } from "@xyflow/react";

interface TableData {
  [stateLabel: string]: {
    [symbol: string]: string;
  };
}

export default function TransitionTableToDiagram() {
  const { currentAutomaton, createNewAutomaton, generateFromTable, setStartState, toggleFinalState } = useAutomataStore();
  
  const [automataType, setAutomataType] = useState<'dfa' | 'nfa' | 'epsilon-nfa'>('dfa');
  const [states, setStates] = useState<string[]>(['q0']);
  const [alphabet, setAlphabet] = useState<string[]>(['0', '1']);
  const [tableData, setTableData] = useState<TableData>({ q0: { '0': '', '1': '' } });
  const [startState, setStartStateLocal] = useState<string>('q0');
  const [finalStates, setFinalStates] = useState<Set<string>>(new Set());
  const [newStateInput, setNewStateInput] = useState('');
  const [newSymbolInput, setNewSymbolInput] = useState('');

  // Initialize automaton when type changes
  useEffect(() => {
    createNewAutomaton(automataType, `${automataType.toUpperCase()} from Table`);
  }, [automataType, createNewAutomaton]);

  // Add new state
  const addState = useCallback(() => {
    const newStateLabel = newStateInput.trim() || `q${states.length}`;
    if (states.includes(newStateLabel)) return;

    const newStates = [...states, newStateLabel];
    setStates(newStates);

    // Add row to table data - use functional update to get latest tableData
    setTableData(prev => {
      const newTableData = { ...prev };
      newTableData[newStateLabel] = {};
      alphabet.forEach(sym => {
        newTableData[newStateLabel][sym] = '';
      });
      return newTableData;
    });
    
    setNewStateInput('');
  }, [newStateInput, states, alphabet]);

  // Remove state
  const removeState = useCallback((stateLabel: string) => {
    if (states.length <= 1) return;
    
    const newStates = states.filter(s => s !== stateLabel);
    setStates(newStates);

    // Remove row from table data - use functional update
    setTableData(prev => {
      const newTableData = { ...prev };
      delete newTableData[stateLabel];
      return newTableData;
    });

    if (startState === stateLabel) {
      setStartStateLocal(newStates[0]);
    }

    const newFinalStates = new Set(finalStates);
    newFinalStates.delete(stateLabel);
    setFinalStates(newFinalStates);
  }, [states, startState, finalStates]);

  // Add new symbol
  const addSymbol = useCallback(() => {
    const newSymbol = newSymbolInput.trim();
    if (!newSymbol || alphabet.includes(newSymbol)) return;

    const newAlphabet = [...alphabet, newSymbol];
    setAlphabet(newAlphabet);

    // Add column to table data - use functional update
    setTableData(prev => {
      const newTableData = { ...prev };
      states.forEach(state => {
        if (!newTableData[state]) {
          newTableData[state] = {};
        }
        newTableData[state][newSymbol] = '';
      });
      return newTableData;
    });
    
    setNewSymbolInput('');
  }, [newSymbolInput, alphabet, states]);

  // Remove symbol
  const removeSymbol = useCallback((symbol: string) => {
    if (alphabet.length <= 1) return;

    const newAlphabet = alphabet.filter(s => s !== symbol);
    setAlphabet(newAlphabet);

    // Remove column from table data - use functional update
    setTableData(prev => {
      const newTableData = { ...prev };
      states.forEach(state => {
        if (newTableData[state]) {
          delete newTableData[state][symbol];
        }
      });
      return newTableData;
    });
  }, [alphabet, states]);

  // Update cell value
  const updateCell = useCallback((state: string, symbol: string, value: string) => {
    setTableData(prev => ({
      ...prev,
      [state]: {
        ...prev[state],
        [symbol]: value,
      },
    }));
  }, []);

  // Toggle final state
  const toggleFinalStateLocal = useCallback((state: string) => {
    setFinalStates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(state)) {
        newSet.delete(state);
      } else {
        newSet.add(state);
      }
      return newSet;
    });
  }, []);

  // Generate diagram
  const handleGenerateDiagram = useCallback(() => {
    if (!currentAutomaton) return;

    // Generate states and transitions from table
    generateFromTable(tableData);

    // After generation, set start and final states
    // We need to wait for the store to update, so use setTimeout
    setTimeout(() => {
      const updatedAutomaton = useAutomataStore.getState().currentAutomaton;
      if (!updatedAutomaton) return;

      // Map state labels to IDs
      const labelToId = new Map<string, string>();
      updatedAutomaton.states.forEach(state => {
        labelToId.set(state.label, state.id);
      });

      // Set start state
      const startStateId = labelToId.get(startState);
      if (startStateId) {
        setStartState(startStateId);
      }

      // Set final states
      finalStates.forEach(stateLabel => {
        const stateId = labelToId.get(stateLabel);
        if (stateId) {
          const state = updatedAutomaton.states.find(s => s.id === stateId);
          if (state && !state.isFinal) {
            toggleFinalState(stateId);
          }
        }
      });
    }, 100);
  }, [tableData, currentAutomaton, states, startState, finalStates, generateFromTable, setStartState, toggleFinalState]);

  const displayAlphabet = automataType === 'epsilon-nfa' 
    ? [...alphabet, 'ε'] 
    : alphabet;

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Left Panel - Transition Table Input */}
      <div className="w-1/2 border-r p-4 overflow-auto">
        <div className="space-y-6">
          {/* Automata Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Automata Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Automata Type</Label>
                <Select value={automataType} onValueChange={(v: any) => setAutomataType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dfa">DFA</SelectItem>
                    <SelectItem value="nfa">NFA</SelectItem>
                    <SelectItem value="epsilon-nfa">ε-NFA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* State Management */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">States</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="State label (e.g., q3)"
                  value={newStateInput}
                  onChange={(e) => setNewStateInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addState()}
                />
                <Button onClick={addState} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {states.map(state => (
                  <Badge key={state} variant={state === startState ? "default" : "secondary"}>
                    {state === startState && "→ "}
                    {state}
                    {finalStates.has(state) && " (F)"}
                    {states.length > 1 && (
                      <button
                        onClick={() => removeState(state)}
                        className="ml-1 hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Alphabet Management */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Alphabet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Symbol (e.g., a)"
                  value={newSymbolInput}
                  onChange={(e) => setNewSymbolInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addSymbol()}
                  maxLength={1}
                />
                <Button onClick={addSymbol} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {displayAlphabet.map(sym => (
                  <Badge key={sym} variant="outline">
                    {sym === 'ε' ? 'ε' : sym}
                    {alphabet.length > 1 && sym !== 'ε' && (
                      <button
                        onClick={() => removeSymbol(sym)}
                        className="ml-1 hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Start State Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Start State</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={startState} onValueChange={setStartStateLocal}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {states.map(state => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Final States Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Final States</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {states.map(state => (
                  <div key={state} className="flex items-center space-x-2">
                    <Checkbox
                      id={`final-${state}`}
                      checked={finalStates.has(state)}
                      onCheckedChange={() => toggleFinalStateLocal(state)}
                    />
                    <Label htmlFor={`final-${state}`} className="text-sm">
                      {state}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Transition Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Transition Table</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-auto max-h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-24">State</TableHead>
                      {displayAlphabet.map(symbol => (
                        <TableHead key={symbol} className="text-center min-w-24">
                          {symbol === 'ε' ? 'ε' : symbol}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {states.map(state => (
                      <TableRow key={state}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {state === startState && (
                              <span className="text-primary">→</span>
                            )}
                            <span>{state}</span>
                            {finalStates.has(state) && (
                              <Badge variant="secondary" className="text-xs">F</Badge>
                            )}
                          </div>
                        </TableCell>
                        {displayAlphabet.map(symbol => {
                          const symbolKey = symbol === 'ε' ? '' : symbol;
                          return (
                            <TableCell key={symbol} className="text-center p-1">
                              <Input
                                value={tableData[state]?.[symbolKey] || ''}
                                onChange={(e) => updateCell(state, symbolKey, e.target.value)}
                                className="h-8 text-center text-sm"
                                placeholder="-"
                              />
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Enter state labels (e.g., q0, q1). Use commas for multiple transitions (e.g., q1, q2)
              </p>
            </CardContent>
          </Card>

          {/* Generate Button */}
          <Button onClick={handleGenerateDiagram} className="w-full gap-2" size="lg">
            <GitBranch className="h-5 w-5" />
            Generate Diagram
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Right Panel - Diagram Canvas */}
      <div className="w-1/2">
        <ReactFlowProvider>
          <AutomataCanvas />
        </ReactFlowProvider>
      </div>
    </div>
  );
}
