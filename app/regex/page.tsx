"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Toaster } from '@/components/ui/sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  validateRegex,
  batchTestRegex,
  generateRegexExamples,
} from '@/lib/algorithms/regex'
import {
  Check,
  X,
  FlaskConical,
  Sparkles,
  Info,
  AlertCircle,
  Regex as RegexIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function RegexPage() {
  const [pattern, setPattern] = useState('')
  const [testStrings, setTestStrings] = useState('')
  const [results, setResults] = useState<{ string: string; matches: boolean }[]>([])
  const [generatedExamples, setGeneratedExamples] = useState<{
    matches: string[]
    nonMatches: string[]
  }>({ matches: [], nonMatches: [] })
  const [validation, setValidation] = useState<{ valid: boolean; error?: string } | null>(null)

  const handlePatternChange = (value: string) => {
    setPattern(value)
    if (value) {
      setValidation(validateRegex(value))
    } else {
      setValidation(null)
    }
  }

  const handleTest = () => {
    if (!pattern) return

    const strings = testStrings
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)

    const testResults = batchTestRegex(pattern, strings)
    setResults(testResults)
  }

  const handleGenerate = () => {
    if (!pattern) return
    const examples = generateRegexExamples(pattern, 5)
    setGeneratedExamples(examples)
  }

  const acceptedCount = results.filter((r) => r.matches).length
  const rejectedCount = results.filter((r) => !r.matches).length

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header title="Regex Tester" />
        <ScrollArea className="flex-1">
          <div className="p-6 max-w-4xl mx-auto space-y-6">
            {/* Pattern Input */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RegexIcon className="h-5 w-5 text-primary" />
                  Regular Expression
                </CardTitle>
                <CardDescription>
                  Enter a regular expression pattern to test strings against
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pattern">Pattern</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">/</span>
                      <Input
                        id="pattern"
                        value={pattern}
                        onChange={(e) => handlePatternChange(e.target.value)}
                        placeholder="e.g., (a|b)*abb"
                        className="pl-6 pr-6 font-mono"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">/</span>
                    </div>
                  </div>
                  {validation && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {validation.valid ? (
                        <p className="text-sm text-success flex items-center gap-1">
                          <Check className="h-4 w-4" />
                          Valid regex pattern
                        </p>
                      ) : (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          {validation.error}
                        </p>
                      )}
                    </motion.div>
                  )}
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Supported Syntax</AlertTitle>
                  <AlertDescription>
                    <span className="font-mono text-sm">
                      a-z, 0-9, | (union), * (star), + (plus), ? (optional), () (grouping), ε (epsilon)
                    </span>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Test Strings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FlaskConical className="h-5 w-5 text-primary" />
                  Test Strings
                </CardTitle>
                <CardDescription>
                  Enter strings to test against the pattern (one per line)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Textarea
                    value={testStrings}
                    onChange={(e) => setTestStrings(e.target.value)}
                    placeholder="Enter strings to test, one per line...&#10;&#10;Example:&#10;aabb&#10;ababb&#10;bba"
                    rows={6}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleTest}
                    disabled={!pattern || !testStrings.trim()}
                    className="flex-1"
                  >
                    <FlaskConical className="h-4 w-4 mr-2" />
                    Test Strings
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleGenerate}
                    disabled={!pattern || !validation?.valid}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Examples
                  </Button>
                </div>

                {/* Results */}
                <AnimatePresence>
                  {results.length > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-3"
                    >
                      <Separator />
                      <div className="flex items-center gap-4 text-sm">
                        <Badge variant="default" className="bg-success text-success-foreground">
                          {acceptedCount} Match
                        </Badge>
                        <Badge variant="destructive">
                          {rejectedCount} No Match
                        </Badge>
                      </div>

                      <div className="space-y-1 max-h-64 overflow-y-auto">
                        {results.map((result, index) => (
                          <motion.div
                            key={index}
                            initial={{ x: -10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className={cn(
                              "flex items-center justify-between px-3 py-2 rounded text-sm font-mono",
                              result.matches
                                ? "bg-success/10 text-success"
                                : "bg-destructive/10 text-destructive"
                            )}
                          >
                            <span>{result.string || 'ε'}</span>
                            {result.matches ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <X className="h-4 w-4" />
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>

            {/* Generated Examples */}
            <AnimatePresence>
              {(generatedExamples.matches.length > 0 || generatedExamples.nonMatches.length > 0) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Generated Examples
                      </CardTitle>
                      <CardDescription>
                        Example strings that match and don&apos;t match the pattern
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-success">
                          <Check className="h-4 w-4" />
                          Matching Strings ({generatedExamples.matches.length})
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {generatedExamples.matches.map((str, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="font-mono bg-success/10 text-success border-success/30"
                            >
                              {str}
                            </Badge>
                          ))}
                          {generatedExamples.matches.length === 0 && (
                            <span className="text-sm text-muted-foreground">None found</span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-destructive">
                          <X className="h-4 w-4" />
                          Non-Matching Strings ({generatedExamples.nonMatches.length})
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {generatedExamples.nonMatches.map((str, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="font-mono bg-destructive/10 text-destructive border-destructive/30"
                            >
                              {str}
                            </Badge>
                          ))}
                          {generatedExamples.nonMatches.length === 0 && (
                            <span className="text-sm text-muted-foreground">None found</span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quick Reference */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Reference</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <code className="text-primary font-mono">a</code>
                    <span className="text-muted-foreground ml-2">Matches literal &apos;a&apos;</span>
                  </div>
                  <div>
                    <code className="text-primary font-mono">a|b</code>
                    <span className="text-muted-foreground ml-2">Matches &apos;a&apos; or &apos;b&apos;</span>
                  </div>
                  <div>
                    <code className="text-primary font-mono">a*</code>
                    <span className="text-muted-foreground ml-2">Zero or more &apos;a&apos;</span>
                  </div>
                  <div>
                    <code className="text-primary font-mono">a+</code>
                    <span className="text-muted-foreground ml-2">One or more &apos;a&apos;</span>
                  </div>
                  <div>
                    <code className="text-primary font-mono">a?</code>
                    <span className="text-muted-foreground ml-2">Zero or one &apos;a&apos;</span>
                  </div>
                  <div>
                    <code className="text-primary font-mono">(ab)</code>
                    <span className="text-muted-foreground ml-2">Grouping</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  )
}
