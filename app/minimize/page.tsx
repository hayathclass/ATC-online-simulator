"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Header } from "@/components/layout/header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { useAutomataStore } from "@/lib/store/automata-store";
import { minimizeDFA, type MinimizationStep } from "@/lib/algorithms/minimize";
import { Play, ChevronRight, ChevronLeft, RotateCcw, Minimize2 } from "lucide-react";

export default function MinimizePage() {
  const { currentAutomaton } = useAutomataStore();
  
  // Extract states and transitions from currentAutomaton with fallbacks
  const states = currentAutomaton?.states || [];
  const transitions = currentAutomaton?.transitions || [];
  const initialState = currentAutomaton?.startState || null;
  const finalStates = currentAutomaton?.states.filter(s => s.isFinal).map(s => s.id) || [];
  const alphabet = currentAutomaton?.alphabet || [];
  
  const [steps, setSteps] = useState<MinimizationStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);

  const handleMinimize = () => {
    if (!currentAutomaton || states.length === 0) return;
    
    const result = minimizeDFA(currentAutomaton);
    
    setSteps(result.steps);
    setCurrentStep(0);
    setIsMinimized(true);
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const reset = () => {
    setSteps([]);
    setCurrentStep(0);
    setIsMinimized(false);
  };

  const currentStepData = steps[currentStep];

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header />
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-6xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">DFA Minimization</h1>
              <p className="text-muted-foreground mt-2">
                Minimize your DFA using the partition refinement algorithm (Hopcroft&apos;s algorithm)
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Original DFA Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    Original DFA
                  </CardTitle>
                  <CardDescription>
                    Your current automaton configuration
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground">States</p>
                      <p className="text-2xl font-bold">{states.length}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground">Transitions</p>
                      <p className="text-2xl font-bold">{transitions.length}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">States:</p>
                    <div className="flex flex-wrap gap-2">
                      {states.map((state) => (
                        <Badge
                          key={state.id}
                          variant={finalStates.includes(state.id) ? "default" : "secondary"}
                          className={state.id === initialState ? "ring-2 ring-primary ring-offset-2" : ""}
                        >
                          {state.label}
                          {state.id === initialState && " (start)"}
                          {finalStates.includes(state.id) && " (final)"}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Alphabet:</p>
                    <div className="flex flex-wrap gap-2">
                      {alphabet.map((symbol) => (
                        <Badge key={symbol} variant="outline">
                          {symbol}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {!isMinimized && (
                    <Button 
                      onClick={handleMinimize} 
                      className="w-full"
                      disabled={states.length === 0}
                    >
                      <Minimize2 className="w-4 h-4 mr-2" />
                      Start Minimization
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Minimization Result */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-chart-2" />
                    Minimized DFA
                  </CardTitle>
                  <CardDescription>
                    Result after applying the minimization algorithm
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isMinimized && steps.length > 0 ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 rounded-lg bg-chart-2/10">
                          <p className="text-sm text-muted-foreground">States</p>
                          <p className="text-2xl font-bold text-chart-2">
                            {steps[steps.length - 1]?.equivalenceClasses.length || 0}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-chart-2/10">
                          <p className="text-sm text-muted-foreground">Reduction</p>
                          <p className="text-2xl font-bold text-chart-2">
                            {states.length - (steps[steps.length - 1]?.equivalenceClasses.length || 0)} states
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-medium">Final Partitions (Equivalent States):</p>
                        <div className="space-y-2">
                          {steps[steps.length - 1]?.equivalenceClasses.map((partition: string[], idx: number) => (
                            <div 
                              key={idx}
                              className="p-2 rounded-lg bg-muted/50 flex items-center gap-2"
                            >
                              <Badge variant="outline" className="bg-chart-2/20">
                                Q{idx}
                              </Badge>
                              <span className="text-sm">
                                {"{"}{partition.map((id: string) => 
                                  states.find(s => s.id === id)?.label || id
                                ).join(", ")}{"}"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <Button onClick={reset} variant="outline" className="w-full">
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Reset
                      </Button>
                    </>
                  ) : (
                    <div className="h-48 flex items-center justify-center text-muted-foreground">
                      <p>Run the minimization algorithm to see results</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Step-by-Step Visualization */}
            {isMinimized && steps.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Step-by-Step Visualization</CardTitle>
                  <CardDescription>
                    Follow the partition refinement process
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Step Controls */}
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={prevStep}
                      disabled={currentStep === 0}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        Step {currentStep + 1} of {steps.length}
                      </Badge>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={nextStep}
                      disabled={currentStep === steps.length - 1}
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>

                  {/* Current Step Details */}
                  <AnimatePresence mode="wait">
                    {currentStepData && (
                      <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-4"
                      >
                        <div className="p-4 rounded-lg bg-muted/50">
                          <h4 className="font-medium mb-2">
                            {currentStepData.description}
                          </h4>
                          
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm text-muted-foreground mb-2">
                                Current Partitions:
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {currentStepData.equivalenceClasses.map((partition: string[], idx: number) => (
                                  <Badge
                                    key={idx}
                                    variant="outline"
                                    className="py-1 px-3"
                                  >
                                    {"{"}{partition.map((id: string) => 
                                      states.find(s => s.id === id)?.label || id
                                    ).join(", ")}{"}"}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            {currentStepData.splitInfo && (
                              <div className="p-3 rounded bg-destructive/10 border border-destructive/20">
                                <p className="text-sm font-medium text-destructive">
                                  Split detected: {currentStepData.splitInfo}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            )}

            {/* Algorithm Explanation */}
            <Card>
              <CardHeader>
                <CardTitle>How DFA Minimization Works</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  DFA minimization uses the <strong>partition refinement algorithm</strong> to find 
                  equivalent states that can be merged without changing the language accepted by the automaton.
                </p>
                <ol className="space-y-2">
                  <li>
                    <strong>Initial Partition:</strong> Start by separating final states from non-final states.
                  </li>
                  <li>
                    <strong>Refinement:</strong> For each partition, check if all states in it behave 
                    identically for every input symbol. If not, split the partition.
                  </li>
                  <li>
                    <strong>Repeat:</strong> Continue refining until no more splits are possible.
                  </li>
                  <li>
                    <strong>Result:</strong> Each final partition represents one state in the minimized DFA.
                  </li>
                </ol>
              </CardContent>
            </Card>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
