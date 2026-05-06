"use client"

import { useAutomataStore } from '@/lib/store/automata-store'
import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Save,
  Download,
  Upload,
  FileJson,
  Image,
  MoreVertical,
  FolderOpen,
  Trash2,
  CircleDot,
  GitBranch,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'

export function Header({ title }: { title: string }) {
  const {
    currentAutomaton,
    saveAutomaton,
    exportAutomaton,
    importAutomaton,
    loadAllAutomata,
    loadAutomaton,
    deleteAutomaton,
    savedAutomata,
    isLoadingFromFirebase,
  } = useAutomataStore()

  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [savedDialogOpen, setSavedDialogOpen] = useState(false)
  const [importJson, setImportJson] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load all automata from Firebase on mount
  useEffect(() => {
    loadAllAutomata().catch(console.error)
  }, [])

  const handleSave = () => {
    if (!currentAutomaton) {
      toast.error('No automaton to save')
      return
    }
    saveAutomaton()
    toast.success('Automaton saved — visible to all users')
  }

  const handleExport = () => {
    const json = exportAutomaton()
    if (!json) {
      toast.error('No automaton to export')
      return
    }
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentAutomaton?.name || 'automaton'}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Automaton exported as JSON')
  }

  const handleImport = () => {
    try {
      const success = importAutomaton(importJson)
      if (success) {
        toast.success('Automaton imported successfully')
        setImportDialogOpen(false)
        setImportJson('')
      } else {
        toast.error('Invalid automaton data')
      }
    } catch {
      toast.error('Failed to parse JSON')
    }
  }

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      const success = importAutomaton(content)
      if (success) {
        toast.success('Automaton imported from file')
      } else {
        toast.error('Invalid automaton file')
      }
    }
    reader.readAsText(file)
  }

  const handleLoadSaved = (id: string, name: string) => {
    loadAutomaton(id)
    setSavedDialogOpen(false)
    toast.success(`Loaded "${name}"`)
  }

  const handleDeleteSaved = (id: string, name: string) => {
    deleteAutomaton(id)
    toast.success(`Deleted "${name}"`)
  }

  return (
    <header className="h-14 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-4 sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <div className="h-6 w-px bg-border" />
        <h1 className="font-semibold">{title}</h1>
        {currentAutomaton && (
          <span className="text-sm text-muted-foreground">
            — {currentAutomaton.name}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Open Saved Automata */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            loadAllAutomata().catch(console.error)
            setSavedDialogOpen(true)
          }}
        >
          {isLoadingFromFirebase ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <FolderOpen className="h-4 w-4 mr-2" />
          )}
          Saved ({savedAutomata.length})
        </Button>

        {/* Save Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleSave}
          disabled={!currentAutomaton}
        >
          <Save className="h-4 w-4 mr-2" />
          Save
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleExport} disabled={!currentAutomaton}>
              <Download className="h-4 w-4 mr-2" />
              Export JSON
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setImportDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Import JSON
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
              <FileJson className="h-4 w-4 mr-2" />
              Import from File
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              <Image className="h-4 w-4 mr-2" />
              Export as PNG
              <span className="ml-auto text-xs text-muted-foreground">Soon</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileImport}
          className="hidden"
        />
      </div>

      {/* Saved Automata Dialog */}
      <Dialog open={savedDialogOpen} onOpenChange={setSavedDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Saved Automata
            </DialogTitle>
            <DialogDescription>
              All saved automata — shared across all devices and users.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => loadAllAutomata().catch(console.error)}
              disabled={isLoadingFromFirebase}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingFromFirebase ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          <ScrollArea className="h-[350px] pr-2">
            {isLoadingFromFirebase ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                Loading from Firebase...
              </div>
            ) : savedAutomata.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground gap-2">
                <FolderOpen className="h-10 w-10 opacity-30" />
                <p className="text-sm">No saved automata yet</p>
                <p className="text-xs">Save an automaton to see it here</p>
              </div>
            ) : (
              <div className="space-y-2">
                {savedAutomata.map((automaton) => (
                  <div
                    key={automaton.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {automaton.type === 'dfa' ? (
                        <CircleDot className="h-4 w-4 text-blue-500 shrink-0" />
                      ) : (
                        <GitBranch className="h-4 w-4 text-green-500 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{automaton.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {automaton.states.length} states · {automaton.transitions.length} transitions
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <Badge variant="secondary" className="text-xs uppercase">
                        {automaton.type}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleLoadSaved(automaton.id, automaton.name)}
                      >
                        Load
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteSaved(automaton.id, automaton.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Automaton</DialogTitle>
            <DialogDescription>
              Paste the JSON data of an automaton to import it.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="import-json">JSON Data</Label>
            <Textarea
              id="import-json"
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              placeholder='{"id": "...", "name": "...", "type": "dfa", ...}'
              rows={10}
              className="mt-2 font-mono text-sm"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleImport}>Import</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  )
}
