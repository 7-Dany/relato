"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, Loading03Icon, Search01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { theme } from "./theme"

export function EmptyProjectState({
  onCreateDiagram,
  isCreatingDiagram,
}: {
  onCreateDiagram: () => void
  isCreatingDiagram?: boolean
}) {
  return (
    <div
      className={cn(
        "flex min-h-[420px] flex-col items-center justify-center gap-5 rounded-xl border",
        theme.card,
        theme.border
      )}
    >
      <div
        className={cn(
          "flex size-14 items-center justify-center rounded-2xl",
          "bg-accent text-accent-foreground"
        )}
      >
        <HugeiconsIcon icon={Add01Icon} size={24} />
      </div>
      <div className="flex flex-col items-center gap-1.5 text-center">
        <p className={cn("text-lg font-medium", theme.text)}>
          Start your first project
        </p>
        <p className={cn("max-w-sm text-sm", theme.muted)}>
          Relato keeps your architecture diagrams grouped into projects so the
          canvas stays focused.
        </p>
      </div>
      <Button
        onClick={onCreateDiagram}
        disabled={isCreatingDiagram}
        aria-busy={isCreatingDiagram}
        className="mt-1 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <HugeiconsIcon
          icon={isCreatingDiagram ? Loading03Icon : Add01Icon}
          data-icon="inline-start"
          className={isCreatingDiagram ? "animate-spin" : undefined}
        />
        {isCreatingDiagram ? "Creating…" : "New project"}
      </Button>
    </div>
  )
}

export function SearchEmptyState({
  search,
  onClear,
}: {
  search: string
  onClear: () => void
}) {
  return (
    <div
      className={cn(
        "flex min-h-[320px] flex-col items-center justify-center gap-5 rounded-xl border",
        theme.card,
        theme.border
      )}
    >
      <div
        className={cn(
          "flex size-14 items-center justify-center rounded-2xl",
          "bg-accent text-accent-foreground"
        )}
      >
        <HugeiconsIcon icon={Search01Icon} size={24} />
      </div>
      <div className="flex flex-col items-center gap-1.5 text-center">
        <p className={cn("text-lg font-medium", theme.text)}>
          No matching projects
        </p>
        <p className={cn("max-w-sm text-sm", theme.muted)}>
          Nothing matches &ldquo;{search}&rdquo;. Try another name or clear the
          search filter.
        </p>
      </div>
      <Button variant="outline" onClick={onClear} className="mt-1">
        Clear search
      </Button>
    </div>
  )
}
