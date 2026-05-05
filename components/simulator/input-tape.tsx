"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface InputTapeProps {
  input: string;
  currentIndex: number;
  isRunning: boolean;
  result?: "accepted" | "rejected" | null;
}

export function InputTape({ input, currentIndex, isRunning, result }: InputTapeProps) {
  const characters = input.split("");
  
  if (characters.length === 0) {
    return (
      <div className="flex items-center justify-center p-4 rounded-lg bg-muted/30 border border-dashed">
        <span className="text-sm text-muted-foreground">
          Enter an input string to simulate
        </span>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Tape Container */}
      <div className="flex items-center justify-center gap-0.5 p-4 rounded-lg bg-muted/30 overflow-x-auto">
        {/* Start marker */}
        <div className="flex items-center justify-center w-10 h-10 rounded-l-md bg-muted border border-r-0 text-muted-foreground text-xs">
          ⊢
        </div>
        
        {/* Input characters */}
        {characters.map((char, index) => (
          <motion.div
            key={index}
            className={cn(
              "relative flex items-center justify-center w-10 h-10 border text-lg font-mono transition-colors duration-200",
              index === currentIndex && isRunning && "bg-primary text-primary-foreground border-primary",
              index < currentIndex && "bg-muted/50 text-muted-foreground",
              index > currentIndex && "bg-background",
              result === "accepted" && !isRunning && "bg-chart-2/20 border-chart-2",
              result === "rejected" && !isRunning && "bg-destructive/20 border-destructive"
            )}
            initial={false}
            animate={{
              scale: index === currentIndex && isRunning ? 1.1 : 1,
            }}
            transition={{ duration: 0.15 }}
          >
            {char}
            
            {/* Read head indicator */}
            {index === currentIndex && isRunning && (
              <motion.div
                className="absolute -top-3 left-1/2 -translate-x-1/2"
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-primary" />
              </motion.div>
            )}
          </motion.div>
        ))}
        
        {/* End marker */}
        <div className="flex items-center justify-center w-10 h-10 rounded-r-md bg-muted border border-l-0 text-muted-foreground text-xs">
          ⊣
        </div>
      </div>

      {/* Position indicator */}
      {isRunning && (
        <div className="mt-2 text-center text-sm text-muted-foreground">
          Reading position: {currentIndex + 1} of {characters.length}
        </div>
      )}

      {/* Result indicator */}
      {result && !isRunning && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "mt-2 text-center text-sm font-medium",
            result === "accepted" ? "text-chart-2" : "text-destructive"
          )}
        >
          String {result === "accepted" ? "ACCEPTED" : "REJECTED"}
        </motion.div>
      )}
    </div>
  );
}
