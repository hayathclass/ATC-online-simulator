'use client'

import { useState } from 'react'
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Save, 
  Download, 
  Upload,
  Sun,
  Moon,
  Maximize,
  Minimize,
  FileText,
  Trash2,
  Pen,
  Type,
  Eraser,
  MousePointer
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useStudioStore } from '@/lib/store/studio-store'
import { cn } from '@/lib/utils'

interface StudioToolbarProps {
  onExportPDF: () => void
}

export function StudioToolbar({ onExportPDF }: StudioToolbarProps) {
  const {
    currentLesson,
    isPresentationMode,
    isDarkBoard,
    isEditing,
    activeTool,
    setActiveTool,
    addPage,
    deletePage,
    renamePage,
    goToPage,
    nextPage,
    prevPage,
    togglePresentationMode,
    toggleDarkBoard,
    saveLessonToLibrary,
    saveLesson,
  } = useStudioStore()

  const [newPageName, setNewPageName] = useState('')
  const [isAddPageOpen, setIsAddPageOpen] = useState(false)

  if (!currentLesson) return null

  const currentPage = currentLesson.pages[currentLesson.currentPageIndex] || currentLesson.pages[0]
  const canGoPrev = currentLesson.currentPageIndex > 0
  const canGoNext = currentLesson.currentPageIndex < currentLesson.pages.length - 1

  const handleAddPage = () => {
    addPage(newPageName || undefined)
    setNewPageName('')
    setIsAddPageOpen(false)
  }

  const handleExportJSON = () => {
    const lesson = saveLesson()
    if (!lesson) return

    const blob = new Blob([JSON.stringify(lesson, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${lesson.title.toLowerCase().replace(/\s+/g, '-')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportJSON = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      try {
        const text = await file.text()
        const lesson = JSON.parse(text)
        useStudioStore.getState().loadLesson(lesson)
      } catch (error) {
        console.error('Failed to import lesson:', error)
      }
    }
    input.click()
  }

  return (
    <div className={cn(
      "flex items-center justify-between border-b px-3 py-2",
      isDarkBoard ? "border-white/10 bg-black/50" : "border-border bg-card/50"
    )}>
      {/* Left: Lesson info and page navigation */}
      <div className="flex items-center gap-3">
        {/* Page navigation */}
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
            onClick={prevPage}
            disabled={!canGoPrev}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 gap-1 px-2">
                <span className="text-xs font-medium">{currentPage.name}</span>
                <span className="text-[10px] text-muted-foreground">
                  ({currentLesson.currentPageIndex + 1}/{currentLesson.pages.length})
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {currentLesson.pages.map((page, index) => (
                <DropdownMenuItem
                  key={page.id}
                  onClick={() => goToPage(index)}
                  className={cn(
                    index === currentLesson.currentPageIndex && "bg-primary/10"
                  )}
                >
                  <FileText className="mr-2 h-3 w-3" />
                  <span className="flex-1 truncate">{page.name}</span>
                  <span className="text-[10px] text-muted-foreground">{index + 1}</span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <Dialog open={isAddPageOpen} onOpenChange={setIsAddPageOpen}>
                <DialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Plus className="mr-2 h-3 w-3" />
                    Add Page
                  </DropdownMenuItem>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Page</DialogTitle>
                    <DialogDescription>
                      Create a new page for your lesson.
                    </DialogDescription>
                  </DialogHeader>
                  <Input
                    placeholder="Page name (optional)"
                    value={newPageName}
                    onChange={(e) => setNewPageName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddPage()}
                  />
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddPageOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddPage}>Add Page</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              {currentLesson.pages.length > 1 && (
                <DropdownMenuItem
                  onClick={() => deletePage(currentPage.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-3 w-3" />
                  Delete Current Page
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
            onClick={nextPage}
            disabled={!canGoNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Center: Lesson title */}
      <div className="flex items-center gap-2">
        <h2 className={cn(
          "text-sm font-semibold",
          isDarkBoard ? "text-white" : "text-foreground"
        )}>
          {currentLesson.title}
        </h2>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        {/* Drawing Tools */}
        {!isPresentationMode && (
          <>
            <div className="mr-2 flex items-center gap-0.5 rounded-lg border border-border bg-background/50 p-0.5">
              <Button
                size="sm"
                variant={activeTool === 'select' ? 'default' : 'ghost'}
                className="h-6 w-6 p-0"
                onClick={() => setActiveTool('select')}
                title="Select Tool"
              >
                <MousePointer className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant={activeTool === 'draw' ? 'default' : 'ghost'}
                className="h-6 w-6 p-0"
                onClick={() => setActiveTool('draw')}
                title="Pen Tool"
              >
                <Pen className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant={activeTool === 'text' ? 'default' : 'ghost'}
                className="h-6 w-6 p-0"
                onClick={() => setActiveTool('text')}
                title="Text Tool"
              >
                <Type className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant={activeTool === 'eraser' ? 'default' : 'ghost'}
                className="h-6 w-6 p-0"
                onClick={() => setActiveTool('eraser')}
                title="Eraser Tool"
              >
                <Eraser className="h-3.5 w-3.5" />
              </Button>
            </div>
          </>
        )}

        {/* Board theme toggle */}
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0"
          onClick={toggleDarkBoard}
          title={isDarkBoard ? "Light board" : "Dark board"}
        >
          {isDarkBoard ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>

        {/* Presentation mode */}
        <Button
          size="sm"
          variant={isPresentationMode ? "default" : "ghost"}
          className="h-7 w-7 p-0"
          onClick={togglePresentationMode}
          title={isPresentationMode ? "Exit presentation" : "Present"}
        >
          {isPresentationMode ? (
            <Minimize className="h-4 w-4" />
          ) : (
            <Maximize className="h-4 w-4" />
          )}
        </Button>

        <div className="mx-1 h-4 w-px bg-border" />

        {/* Save */}
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0"
          onClick={saveLessonToLibrary}
          title="Save to library"
        >
          <Save className="h-4 w-4" />
        </Button>

        {/* Export/Import */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
              <Download className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleExportJSON}>
              <Download className="mr-2 h-3 w-3" />
              Export as JSON
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExportPDF}>
              <FileText className="mr-2 h-3 w-3" />
              Export as PDF
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleImportJSON}>
              <Upload className="mr-2 h-3 w-3" />
              Import JSON
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
