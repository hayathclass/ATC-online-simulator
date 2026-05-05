'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Plus, 
  BookOpen, 
  Trash2, 
  Play,
  FileText,
  PenTool,
  Eraser,
  CircleDot,
  GitBranch,
  Regex,
  Table2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useStudioStore, type Lesson } from '@/lib/store/studio-store'
import { cn } from '@/lib/utils'

export function LessonLibrary() {
  const {
    savedLessons,
    createNewLesson,
    deleteLessonFromLibrary,
    loadLesson,
  } = useStudioStore()

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')

  const handleCreateLesson = () => {
    const title = newTitle.trim() || 'Untitled Whiteboard'
    createNewLesson(title, newDescription.trim())
    setNewTitle('')
    setNewDescription('')
    setIsCreateOpen(false)
  }

  const handleStartWhiteboard = () => {
    createNewLesson('Whiteboard', 'Interactive whiteboard for explaining automata concepts')
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <PenTool className="h-6 w-6 text-primary" />
              Learning Studio
            </h1>
            <p className="text-sm text-muted-foreground">
              Interactive whiteboard for explaining automata concepts
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleStartWhiteboard} className="gap-2">
              <Plus className="h-4 w-4" />
              New Whiteboard
            </Button>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Custom Lesson
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Custom Lesson</DialogTitle>
                  <DialogDescription>
                    Create a lesson with a custom title and description.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Title (optional)</label>
                    <Input
                      placeholder="e.g., Introduction to DFA"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description (optional)</label>
                    <Textarea
                      placeholder="What will students learn?"
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateLesson}>
                    Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* Whiteboard Features */}
        <section className="mb-8">
          <div className="mb-4 flex items-center gap-2">
            <Eraser className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Whiteboard Tools</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: CircleDot, title: 'DFA Widget', desc: 'Deterministic Finite Automata' },
              { icon: GitBranch, title: 'NFA Widget', desc: 'Non-deterministic FA' },
              { icon: Regex, title: 'Regex Tester', desc: 'Regular Expressions' },
              { icon: Table2, title: 'Transition Table', desc: 'Tabular view' },
            ].map((tool, index) => {
              const Icon = tool.icon
              return (
                <motion.div
                  key={tool.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="group relative overflow-hidden transition-all hover:border-primary/50 hover:shadow-md">
                    <CardHeader className="pb-2">
                      <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-base">{tool.title}</CardTitle>
                      <CardDescription className="text-xs">{tool.desc}</CardDescription>
                    </CardHeader>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </section>

        {/* Saved Whiteboards */}
        <section>
          <div className="mb-4 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <h2 className="text-lg font-semibold">Saved Whiteboards</h2>
            {savedLessons.length > 0 && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {savedLessons.length}
              </span>
            )}
          </div>

          {savedLessons.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <PenTool className="mb-4 h-12 w-12 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No saved whiteboards yet</p>
                <p className="text-xs text-muted-foreground/70">
                  Click "New Whiteboard" to start creating
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {savedLessons.map((lesson, index) => (
                <motion.div
                  key={lesson.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="group relative overflow-hidden transition-all hover:border-primary/50 hover:shadow-md">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center justify-between text-base">
                        <span className="truncate">{lesson.title}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteLessonFromLibrary(lesson.id)
                          }}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </CardTitle>
                      {lesson.description && (
                        <CardDescription className="text-xs line-clamp-2">
                          {lesson.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {lesson.pages.length} page{lesson.pages.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full gap-2"
                        onClick={() => useStudioStore.getState().loadLessonFromLibrary(lesson.id)}
                      >
                        <Play className="h-3 w-3" />
                        Open
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
