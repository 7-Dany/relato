"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";

// ─── Props ──────────────────────────────────────────────────────────────────

interface ShortcutsDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function ShortcutsDialog({ open, onOpenChange }: ShortcutsDialogProps) {
  const isMac =
    typeof navigator !== "undefined" &&
    /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const mod = isMac ? "\u2318" : "Ctrl";
  const modShiftZ: string[] = isMac
    ? [mod, "\u21E7", "Z"]
    : [mod, "Shift", "Z"];

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
              { keys: ["Del", "\u232B"], action: "Delete selected" },
              { keys: [mod, "Z"], action: "Undo" },
              { keys: modShiftZ, action: "Redo" },
            ]}
          />
          <ShortcutSection
            title="Add Nodes"
            shortcuts={[{ keys: ["N"], action: "Add class" }]}
          />
          <ShortcutSection
            title="Layout"
            shortcuts={[{ keys: ["L"], action: "Auto-layout diagram" }]}
          />
          <ShortcutSection
            title="Edge Types"
            shortcuts={[
              { keys: ["1"], action: "Association" },
              { keys: ["2"], action: "Dependency" },
              { keys: ["3"], action: "Inheritance" },
              { keys: ["4"], action: "Aggregation" },
            ]}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ShortcutSection({
  title,
  shortcuts,
}: {
  title: string;
  shortcuts: { keys: string[]; action: string }[];
}) {
  return (
    <div>
      <h4 className="mb-2 text-sm font-medium">{title}</h4>
      <div className="flex flex-col gap-1.5">
        {shortcuts.map(({ keys, action }) => (
          <div
            key={`${keys.join("+")}-${action}`}
            className="flex items-center justify-between text-sm"
          >
            <span className="text-muted-foreground">{action}</span>
            <div className="flex gap-1">
              {keys.map((key) => (
                <Kbd key={key}>{key}</Kbd>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
