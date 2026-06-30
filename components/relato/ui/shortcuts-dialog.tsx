"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

interface ShortcutsDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function ShortcutsDialog({ open, onOpenChange }: ShortcutsDialogProps) {
  const isMac =
    typeof navigator !== "undefined" &&
    /Mac|iPod|iPhone|iPad/.test(navigator.platform)
  const mod = isMac ? "⌘" : "Ctrl"
  const redo: string[] = isMac ? [mod, "⇧", "Z"] : [mod, "Shift", "Z"]
  const redoAlt: string[] | undefined = isMac ? undefined : [mod, "Y"]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Quick keys for faster diagram building.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-5">
          <ShortcutSection
            title="General"
            shortcuts={[
              { keys: ["Esc"], action: "Deselect" },
              { keys: ["Del", "⌫"], action: "Delete selected" },
              { keys: [mod, "Z"], action: "Undo" },
              { keys: redo, action: "Redo", altKeys: redoAlt },
            ]}
          />
          <ShortcutSection
            title="Add nodes"
            shortcuts={[
              { keys: ["N"], action: "Add class" },
              { keys: ["M"], action: "Add note" },
            ]}
          />
          <ShortcutSection
            title="Layout"
            shortcuts={[{ keys: ["L"], action: "Auto-layout diagram" }]}
          />
          <ShortcutSection
            title="Edge types"
            shortcuts={[
              { keys: ["1"], action: "Association" },
              { keys: ["2"], action: "Dependency" },
              { keys: ["3"], action: "Inheritance" },
              { keys: ["4"], action: "Aggregation" },
              { keys: ["5"], action: "Composition" },
              { keys: ["6"], action: "Realization" },
            ]}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ShortcutSection({
  title,
  shortcuts,
}: {
  title: string
  shortcuts: { keys: string[]; action: string; altKeys?: string[] }[]
}) {
  return (
    <div>
      <h4 className="mb-2 text-sm font-medium">{title}</h4>
      <div className="flex flex-col gap-1.5">
        {shortcuts.map(({ keys, action, altKeys }) => (
          <div
            key={`${keys.join("+")}-${action}`}
            className="flex items-center justify-between text-sm"
          >
            <span className="text-muted-foreground">{action}</span>
            <div className="flex items-center gap-1">
              {keys.map((key) => (
                <kbd
                  key={key}
                  className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground"
                >
                  {key}
                </kbd>
              ))}
              {altKeys && (
                <>
                  <span className="text-muted-foreground mx-0.5">or</span>
                  {altKeys.map((key) => (
                    <kbd
                      key={key}
                      className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground"
                    >
                      {key}
                    </kbd>
                  ))}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
