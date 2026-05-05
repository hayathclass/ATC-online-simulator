"use client";

import { useState, useCallback, useEffect } from "react";
import { useAutomataStore } from "@/lib/store/automata-store";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Plus, GitBranch } from "lucide-react";

export function TransitionTable() {
  const { currentAutomaton, addTransition, deleteTransition, addState, generateFromTable } = useAutomataStore();
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [tableData, setTableData] = useState<{ [stateLabel: string]: { [symbol: string]: string } }>({});

  // Build table data from current transitions for display
  const buildTableDataFromTransitions = useCallback(() => {
    if (!currentAutomaton) return {};
    
    const data: { [stateLabel: string]: { [symbol: string]: string } } = {};
    
    currentAutomaton.states.forEach(state => {
      data[state.label] = {};
      const displayAlphabet = currentAutomaton.type === 'epsilon-nfa' 
        ? [...(currentAutomaton?.alphabet || []), ''] 
        : currentAutomaton?.alphabet || [];
      
      displayAlphabet.forEach(symbol => {
        const transitions = currentAutomaton.transitions.filter(
          (t) => t.from === state.id && t.symbol === symbol
        );
        
        if (transitions.length > 0) {
          const targets = transitions
            .map((t) => {
              const targetState = currentAutomaton?.states.find((s) => s.id === t.to);
              return targetState?.label || t.to;
            })
            .join(', ');
          data[state.label][symbol] = targets;
        } else {
          data[state.label][symbol] = '';
        }
      });
    });
    
    return data;
  }, [currentAutomaton]);
  
  // Initialize table data from store on mount and when automaton changes
  useEffect(() => {
    setTableData(buildTableDataFromTransitions());
  }, [currentAutomaton?.id, buildTableDataFromTransitions]);

  const getTransitionsForCell = (stateId: string, symbol: string) => {
    if (!currentAutomaton) return [];
    return currentAutomaton.transitions.filter(
      (t) => t.from === stateId && t.symbol === symbol
    );
  };

  const getCellDisplayValue = (stateId: string, symbol: string) => {
    const transitions = getTransitionsForCell(stateId, symbol);
    if (transitions.length === 0) return "";
    
    return transitions
      .map((t) => {
        const targetState = currentAutomaton?.states.find((s) => s.id === t.to);
        return targetState?.label || t.to;
      })
      .join(", ");
  };



  const handleCellChange = useCallback(
    (stateLabel: string, symbol: string, value: string) => {
      // Update local table data
      setTableData(prev => ({
        ...prev,
        [stateLabel]: {
          ...prev[stateLabel],
          [symbol]: value,
        },
      }));
      
      // Auto-generate diagram from updated table
      setTableData(prev => {
        generateFromTable(prev);
        return prev;
      });
      
      setEditingCell(null);
    },
    [generateFromTable]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, stateLabel: string, symbol: string, value: string) => {
      if (e.key === "Enter") {
        handleCellChange(stateLabel, symbol, value);
      }
      if (e.key === "Escape") {
        setEditingCell(null);
      }
    },
    [handleCellChange]
  );

  const handleGenerateDiagram = useCallback(() => {
    generateFromTable(tableData);
  }, [tableData, generateFromTable]);

  const handleAddState = useCallback(() => {
    if (!currentAutomaton) return;
    
    const stateCount = currentAutomaton.states.length;
    const spacing = 150;
    const cols = 3;
    const row = Math.floor(stateCount / cols);
    const col = stateCount % cols;
    
    addState({
      x: 100 + col * spacing,
      y: 100 + row * spacing,
    });
  }, [currentAutomaton, addState]);

  const displayAlphabet = currentAutomaton?.type === 'epsilon-nfa' 
    ? [...(currentAutomaton?.alphabet || []), ''] 
    : currentAutomaton?.alphabet || [];

  const symbolDisplay = (symbol: string) => symbol === '' ? 'ε' : symbol;

  if (!currentAutomaton) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Transition Table</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Create an automaton to use the transition table
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Transition Table</CardTitle>
          <Button size="sm" onClick={handleAddState} className="gap-2">
            <Plus className="h-4 w-4" />
            Add State
          </Button>
          <Button size="sm" onClick={handleGenerateDiagram} className="gap-2" variant="outline">
            <GitBranch className="h-4 w-4" />
            Generate Diagram
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {currentAutomaton.states.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground mb-4">
              No states yet. Add a state to get started!
            </p>
            <Button onClick={handleAddState} className="gap-2">
              <Plus className="h-4 w-4" />
              Add First State
            </Button>
          </div>
        ) : (
          <>
            <div className="rounded-md border overflow-auto max-h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">State</TableHead>
                    {displayAlphabet.map((symbol) => (
                      <TableHead key={symbol} className="text-center min-w-24">
                        {symbolDisplay(symbol)}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentAutomaton.states.map((state) => {
                    return (
                      <TableRow key={state.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {state.isStart && (
                              <span className="text-primary">→</span>
                            )}
                            <span>{state.label}</span>
                            {state.isFinal && (
                              <Badge variant="secondary" className="text-xs">F</Badge>
                            )}
                          </div>
                        </TableCell>
                        {displayAlphabet.map((symbol) => {
                          const cellKey = `${state.id}-${symbol}`;
                          const isEditing = editingCell === cellKey;
                          const displayValue = tableData[state.label]?.[symbol] || '';
                          
                          // Parse display value to get target states
                          const targetLabels = displayValue
                            .split(',')
                            .map(s => s.trim())
                            .filter(s => s);
                          
                          // Check if any target state doesn't exist
                          const hasInvalidState = targetLabels.some(
                            (label) => !currentAutomaton.states.find((s) => s.label === label)
                          );

                          return (
                            <TableCell key={symbol} className="text-center p-1">
                              {isEditing ? (
                                <Input
                                  autoFocus
                                  defaultValue={displayValue}
                                  className="h-8 text-center text-sm"
                                  onBlur={(e) =>
                                    handleCellChange(state.label, symbol, e.target.value)
                                  }
                                  onKeyDown={(e) =>
                                    handleKeyDown(
                                      e,
                                      state.label,
                                      symbol,
                                      (e.target as HTMLInputElement).value
                                    )
                                  }
                                />
                              ) : (
                                <div
                                  className={cn(
                                    "h-8 flex items-center justify-center cursor-pointer hover:bg-accent rounded text-sm transition-colors",
                                    hasInvalidState && "text-destructive"
                                  )}
                                  onClick={() => setEditingCell(cellKey)}
                                >
                                  {displayValue || (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </div>
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Click any cell to edit. Type state labels (e.g., q0, q1) - they'll be created automatically!
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
