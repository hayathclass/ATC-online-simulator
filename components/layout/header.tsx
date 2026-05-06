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
  DialogTrigger,
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
  Info,
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { toast } from 'sonner'

export function Header({ title }: { title: string }) {
  const {
    currentAutomaton,
    saveAutomaton,
    exportAutomaton,
    importAutomaton,
    loadAllAutomata,
  } = useAutomataStore()

  // Load all automata from Firebase on mount
  useEffect(() => {
    loadAllAutomata().catch(console.error)
  }, [])

  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importJson, setImportJson] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSave = () => {
    if (!currentAutomaton) {
      toast.error('No automaton to save')
      return
    }
    saveAutomaton()
    toast.success('Automaton saved to library')
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
        {/* Save/Load Actions */}
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
