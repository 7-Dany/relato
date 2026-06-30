"use client"

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Add01Icon,
  ArrowRight01Icon,
  Delete02Icon,
  Download04Icon,
  FlowIcon,
  Link01Icon,
} from "@hugeicons/core-free-icons"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import type { DiagramId, DiagramSummary, SavedDiagram } from "../../domain"
import { relativeTime, downloadJson, theme } from "./theme"
import { ShareDialog } from "../../ui/share-dialog"

type ViewMode = "grid" | "list"

function DotsIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="4" r="1.2" fill="currentColor" />
      <circle cx="8" cy="8" r="1.2" fill="currentColor" />
      <circle cx="8" cy="12" r="1.2" fill="currentColor" />
    </svg>
  )
}

export function ProjectCard({
  diagram,
  titleValue,
  descriptionValue,
  view,
  canEditDescription,
  onTitleChange,
  onTitleBlur,
  onDescriptionChange,
  onDescriptionBlur,
  onOpen,
  onDelete,
  onDuplicate,
  onExportDiagram,
}: {
  diagram: DiagramSummary
  titleValue: string
  descriptionValue: string
  view: ViewMode
  canEditDescription: boolean
  onTitleChange: (value: string) => void
  onTitleBlur: () => void
  onDescriptionChange: (value: string) => void
  onDescriptionBlur: () => void
  onOpen: () => void
  onDelete: () => void
  onDuplicate: () => void
  onExportDiagram?: (id: DiagramId) => Promise<SavedDiagram | null>
}) {
  const [shareOpen, setShareOpen] = useState(false)
  const isList = view === "list"

  return (
    <div
      onClick={onOpen}
      className={cn(
        "group relative flex cursor-pointer flex-col rounded-xl border transition-all",
        theme.card,
        theme.border,
        "hover:border-primary/40 hover:shadow-lg hover:shadow-foreground/10",
        isList
          ? "flex-row items-center gap-3 px-4 py-3"
          : "min-h-[200px] px-4 pt-4 pb-3"
      )}
    >
      <div className={cn("flex min-w-0 flex-1 flex-col gap-2")}>
        <div className="flex items-start justify-between gap-2">
          <input
            value={titleValue}
            onChange={(event) => {
              event.stopPropagation()
              onTitleChange(event.target.value)
            }}
            onBlur={onTitleBlur}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur()
              event.stopPropagation()
            }}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Rename ${diagram.title}`}
            className={cn(
              "min-w-0 flex-1 bg-transparent text-base font-medium outline-none",
              theme.text,
              theme.placeholder,
              isList && "text-sm"
            )}
          />

          <DropdownMenu>
            <DropdownMenuTrigger
              onClick={(e) => e.stopPropagation()}
              aria-label="More actions"
              title="More actions"
              className={cn(
                "flex size-7 items-center justify-center rounded-lg opacity-0 transition-all",
                "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                "group-hover:opacity-100 focus-visible:opacity-100"
              )}
            >
              <DotsIcon size={14} />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="min-w-36 overflow-hidden rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenuItem
                onClick={onDuplicate}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-popover-foreground/90 focus:bg-accent focus:text-accent-foreground data-highlighted:bg-accent data-highlighted:text-accent-foreground"
              >
                <HugeiconsIcon icon={Add01Icon} size={14} />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator className="mx-1" />
              <DropdownMenuItem
                onClick={() => setShareOpen(true)}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-popover-foreground/90 focus:bg-accent focus:text-accent-foreground data-highlighted:bg-accent data-highlighted:text-accent-foreground"
              >
                <HugeiconsIcon icon={Link01Icon} size={14} />
                Share
              </DropdownMenuItem>
              <DropdownMenuSeparator className="mx-1" />
              <DropdownMenuItem
                onClick={() => {
                  onExportDiagram?.(diagram.id)?.then((data) => {
                    if (data) downloadJson(data)
                  })
                }}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-popover-foreground/90 focus:bg-accent focus:text-accent-foreground data-highlighted:bg-accent data-highlighted:text-accent-foreground"
              >
                <HugeiconsIcon icon={Download04Icon} size={14} />
                Export JSON
              </DropdownMenuItem>
              <DropdownMenuSeparator className="mx-1" />
              <DropdownMenuItem
                onClick={onDelete}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-destructive focus:bg-destructive/10 focus:text-destructive data-highlighted:bg-destructive/10 data-highlighted:text-destructive"
              >
                <HugeiconsIcon icon={Delete02Icon} size={14} />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {!isList && (
          <>
            {canEditDescription ? (
              <textarea
                value={descriptionValue}
                onChange={(event) => {
                  onDescriptionChange(event.target.value)
                }}
                onBlur={onDescriptionBlur}
                placeholder="Add a description..."
                rows={2}
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  "min-h-16 resize-none rounded-lg border px-2.5 py-1.5 text-sm outline-none",
                  "border-border bg-input/30 text-foreground",
                  theme.placeholder,
                  "focus:border-primary/50 focus:bg-accent/40 focus:text-foreground"
                )}
              />
            ) : (
              <p
                className={cn(
                  "line-clamp-2 text-sm leading-relaxed",
                  theme.muted
                )}
              >
                {descriptionValue || "No description"}
              </p>
            )}
          </>
        )}
      </div>

      <div
        className={cn(
          "flex items-center justify-between gap-3",
          !isList && "mt-3 border-t pt-2.5",
          !isList && theme.border
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5",
              "font-mono text-[10px] font-semibold tracking-wider uppercase",
              "bg-muted text-muted-foreground"
            )}
          >
            <HugeiconsIcon icon={FlowIcon} size={10} />
            {diagram.nodeCount}n
          </span>
          <span
            className={cn(
              "inline-flex items-center rounded-md px-1.5 py-0.5",
              "font-mono text-[10px] font-semibold tracking-wider uppercase",
              "bg-muted text-muted-foreground"
            )}
          >
            {diagram.edgeCount}e
          </span>
          <span
            className={cn(
              "inline-flex items-center font-mono text-[10px]",
              "text-muted-foreground/70"
            )}
          >
            {relativeTime(diagram.updatedAt)}
          </span>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onOpen()
          }}
          className={cn(
            "flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-all",
            "bg-primary text-primary-foreground",
            "hover:bg-primary/90",
            isList && "px-2 py-1 text-xs"
          )}
        >
          Open
          <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
        </button>
      </div>

      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        diagramId={diagram.id}
      />
    </div>
  )
}
