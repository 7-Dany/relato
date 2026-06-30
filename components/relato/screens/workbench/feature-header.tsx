"use client"

import { useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  AlertCircleIcon,
  ArrowTurnBackwardIcon,
  ArrowTurnForwardIcon,
  CircleQuestionMarkIcon,
  CloudIcon,
  Delete02Icon,
  KeyboardIcon,
  Layers01Icon,
  Menu01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { ThemeToggle } from "@/components/theme-toggle"
import { ShortcutsDialog } from "../../ui/shortcuts-dialog"
import { RelationshipReferenceSheet } from "../../ui/relationship-reference-sheet"
import type { WorkbenchProps } from "./types"

const SAVE_ICON: Record<
  WorkbenchProps["saveStatus"],
  { icon: typeof CloudIcon; color: string; label: string }
> = {
  loading: { icon: CloudIcon, color: "text-muted-foreground", label: "Loading" },
  saving: { icon: CloudIcon, color: "text-muted-foreground", label: "Saving" },
  saved: { icon: Tick02Icon, color: "text-primary", label: "Saved" },
  error: { icon: AlertCircleIcon, color: "text-destructive", label: "Error" },
}

export function RelatoFeatureHeader({
  session,
  saveStatus,
  canUndo,
  canRedo,
  dispatch,
  onUndo,
  onRedo,
  onClearDiagram,
  onShowProjects,
  leftCollapsed,
  onToggleLeft,
}: WorkbenchProps & {
  leftCollapsed: boolean
  onToggleLeft: () => void
}) {
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [refOpen, setRefOpen] = useState(false)
  const [confirmClearOpen, setConfirmClearOpen] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [draft, setDraft] = useState(session.diagram.title)
  const inputRef = useRef<HTMLInputElement>(null)

  function commitTitle() {
    setEditingTitle(false)
    const trimmed = draft.trim()
    if (trimmed && trimmed !== session.diagram.title) {
      dispatch({ type: "rename-diagram", title: trimmed })
    } else {
      setDraft(session.diagram.title)
    }
  }

  const saveMeta = SAVE_ICON[saveStatus]

  return (
    <>
      <header className="flex h-12 shrink-0 items-center gap-1 border-b border-border bg-card px-2 text-foreground">
        {/* ── Navigation ── */}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onShowProjects}
          aria-label="Back to projects"
          title="Back to projects"
          className="text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <HugeiconsIcon icon={Menu01Icon} size={18} />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onToggleLeft}
          aria-label={leftCollapsed ? "Show layers" : "Hide layers"}
          title={leftCollapsed ? "Show layers" : "Hide layers"}
          className={
            leftCollapsed
              ? "text-primary"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          }
        >
          <HugeiconsIcon icon={Layers01Icon} size={16} />
        </Button>

        {/* ── Project name ── */}
        <div className="flex min-w-0 flex-1 items-center justify-center">
          {editingTitle ? (
            <input
              ref={inputRef}
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitTitle()
                if (e.key === "Escape") {
                  setDraft(session.diagram.title)
                  setEditingTitle(false)
                }
              }}
              aria-label="Project name"
              className="h-7 max-w-xs rounded-md border border-input bg-input/50 px-2 text-center text-sm font-medium text-foreground outline-none focus:border-ring"
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                setDraft(session.diagram.title)
                setEditingTitle(true)
              }}
              className="max-w-xs truncate rounded-md px-2 py-1 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              title="Click to rename"
            >
              {session.diagram.title || "Untitled"}
            </button>
          )}
        </div>

        {/* ── Canvas tools ── */}

        {/* History */}
        <div className="flex items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onUndo}
            disabled={!canUndo}
            aria-label="Undo"
            title="Undo"
            className="text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <HugeiconsIcon icon={ArrowTurnBackwardIcon} size={15} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onRedo}
            disabled={!canRedo}
            aria-label="Redo"
            title="Redo"
            className="text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <HugeiconsIcon icon={ArrowTurnForwardIcon} size={15} />
          </Button>
        </div>

        <div className="mx-1 h-5 w-px bg-border" aria-hidden />

        {/* Actions */}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => setConfirmClearOpen(true)}
          aria-label="Clear all classes and relationships"
          title="Clear diagram"
          className="text-muted-foreground hover:bg-accent hover:text-destructive"
        >
          <HugeiconsIcon icon={Delete02Icon} size={15} />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => setRefOpen(true)}
          aria-label="Relationship reference"
          title="Relationship reference"
          className="text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <HugeiconsIcon icon={CircleQuestionMarkIcon} size={16} />
        </Button>

        <div className="mx-1 h-5 w-px bg-border" aria-hidden />

        {/* Meta */}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => setShortcutsOpen(true)}
          aria-label="Keyboard shortcuts"
          title="Keyboard shortcuts"
          className="text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <HugeiconsIcon icon={KeyboardIcon} size={15} />
        </Button>

        <ThemeToggle />

        <span className={saveMeta.color} title={saveMeta.label}>
          <HugeiconsIcon icon={saveMeta.icon} size={14} />
        </span>
      </header>

      <ShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
      <RelationshipReferenceSheet
        open={refOpen}
        onOpenChange={setRefOpen}
      />

      {/* Confirm clear dialog */}
      <Dialog open={confirmClearOpen} onOpenChange={setConfirmClearOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Clear diagram?</DialogTitle>
            <DialogDescription>
              This will remove all classes, notes, and relationships. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setConfirmClearOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                setConfirmClearOpen(false)
                onClearDiagram()
              }}
            >
              Clear
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
