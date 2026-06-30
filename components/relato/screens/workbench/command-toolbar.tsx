"use client"

import { useMemo } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Add01Icon,
  ArrowRight01Icon,
  DiamondIcon,
  Download04Icon,
  FolderIcon,
  LinkIcon,
  NoteIcon,
  LayoutLeftIcon,
  Tick02Icon,
  UnfoldMoreIcon,
} from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { DiagramEdgeKind } from "../../domain"
import { RELATO_PATTERNS } from "../../systems/pattern-catalog"
import { useCanvasActions } from "./canvas-actions-context"
import type { WorkbenchProps } from "./types"

// ─── Constants ────────────────────────────────────────────────────────────────

const EDGE_KINDS = [
  {
    kind: "association" as DiagramEdgeKind,
    label: "Association",
    description: "Undirected structural link — no arrow",
    hotkey: "1",
    icon: ArrowRight01Icon,
  },
  {
    kind: "directed-association" as DiagramEdgeKind,
    label: "Directed Assoc.",
    description: "Navigable link with open arrow",
    hotkey: "",
    icon: ArrowRight01Icon,
  },
  {
    kind: "dependency" as DiagramEdgeKind,
    label: "Dependency",
    description: "Uses / depends on — dashed arrow",
    hotkey: "2",
    icon: LinkIcon,
  },
  {
    kind: "inheritance" as DiagramEdgeKind,
    label: "Inheritance",
    description: "Extends — hollow triangle",
    hotkey: "3",
    icon: UnfoldMoreIcon,
  },
  {
    kind: "aggregation" as DiagramEdgeKind,
    label: "Aggregation",
    description: "Hollow diamond at whole end",
    hotkey: "4",
    icon: DiamondIcon,
  },
  {
    kind: "composition" as DiagramEdgeKind,
    label: "Composition",
    description: "Filled diamond at whole end",
    hotkey: "5",
    icon: DiamondIcon,
  },
  {
    kind: "realization" as DiagramEdgeKind,
    label: "Realization",
    description: "Implements — dashed hollow triangle",
    hotkey: "6",
    icon: UnfoldMoreIcon,
  },
]

// ─── Toolbar button ──────────────────────────────────────────────────────────

function Btn({
  onClick,
  title,
  disabled = false,
  children,
  className,
}: {
  onClick?: () => void
  title?: string
  disabled?: boolean
  children: React.ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg",
        "text-muted-foreground transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        "disabled:cursor-not-allowed disabled:opacity-35",
        className
      )}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div aria-hidden className="mx-1 h-5 w-px bg-border" />
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CommandToolbar({ session, dispatch }: WorkbenchProps) {
  const { layout, exportPng, exportJson, viewportCenter } = useCanvasActions()

  const activeEdge = EDGE_KINDS.find((e) => e.kind === session.activeEdgeKind)

  const activePatternId = useMemo(() => {
    const title = (session.diagram.title ?? "").toLowerCase()
    return (
      RELATO_PATTERNS.find((p) =>
        p.diagramTitle.toLowerCase() === title ||
        title.startsWith(p.name.toLowerCase())
      )?.id ?? null
    )
  }, [session.diagram.title])

  function insertTemplate(id: string) {
    const p = RELATO_PATTERNS.find((x) => x.id === id)
    if (!p || p.id === "blank") return
    dispatch({
      type: "insert-diagram-template",
      diagram: p.createDiagram(new Date().toISOString()),
    })
  }

  return (
    <div
      role="toolbar"
      aria-label="Diagram commands"
      className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-0.5 rounded-xl border border-border bg-card/95 px-1.5 py-1 shadow-2xl shadow-foreground/10 backdrop-blur"
    >
      {/* Add nodes */}
      <Btn
        title="Add class (N)"
        onClick={() =>
          dispatch({
            type: "add-class-node",
            position: viewportCenter(),
          })
        }
      >
        <HugeiconsIcon icon={Add01Icon} size={15} />
      </Btn>
      <Btn
        title="Add note (M)"
        onClick={() => {
          const origin = viewportCenter()
          dispatch({
            type: "add-note-node",
            position: { x: origin.x, y: origin.y + 60 },
          })
        }}
      >
        <HugeiconsIcon icon={NoteIcon} size={15} />
      </Btn>

      <Divider />

      {/* Edge type */}
      <DropdownMenu>
        <DropdownMenuTrigger
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground data-pressed:bg-accent data-pressed:text-accent-foreground"
          aria-label="Edge type"
          title={`${activeEdge?.label ?? "Association"} — click to change`}
        >
          {activeEdge && <HugeiconsIcon icon={activeEdge.icon} size={15} />}
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="center"
          side="top"
          sideOffset={8}
          className="min-w-44 border border-border bg-popover p-1 text-popover-foreground"
        >
          {EDGE_KINDS.map(({ kind, label, description, hotkey, icon }) => (
            <DropdownMenuItem
              key={kind}
              title={`${description}${hotkey ? ` [${hotkey}]` : ""}`}
              onClick={() =>
                dispatch({ type: "set-active-edge-kind", kind })
              }
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-popover-foreground/90 focus:bg-accent focus:text-accent-foreground data-highlighted:bg-accent data-highlighted:text-accent-foreground"
            >
              <HugeiconsIcon icon={icon} size={14} />
              <span className="flex-1">{label}</span>
              {hotkey && (
                <span className="font-mono text-[10px] opacity-50">{hotkey}</span>
              )}
              {kind === session.activeEdgeKind && (
                <HugeiconsIcon
                  icon={Tick02Icon}
                  size={13}
                  className="text-primary"
                />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Divider />

      {/* Auto-layout */}
      <Btn title="Auto-layout (L)" onClick={() => void layout()}>
        <HugeiconsIcon icon={LayoutLeftIcon} size={15} />
      </Btn>

      {/* Blueprints */}
      <DropdownMenu>
        <DropdownMenuTrigger
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground data-pressed:bg-accent data-pressed:text-accent-foreground"
          aria-label="Blueprints"
          title="Blueprints"
        >
          <HugeiconsIcon icon={FolderIcon} size={15} />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="center"
          side="top"
          sideOffset={8}
          className="min-w-40 border border-border bg-popover p-1 text-popover-foreground"
        >
          {RELATO_PATTERNS.filter((p) => p.id !== "blank").map((p) => (
            <DropdownMenuItem
              key={p.id}
              onClick={() => insertTemplate(p.id)}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-popover-foreground/90 focus:bg-accent focus:text-accent-foreground data-highlighted:bg-accent data-highlighted:text-accent-foreground"
            >
              <span className="flex-1 truncate">{p.name}</span>
              {p.id === activePatternId && (
                <HugeiconsIcon
                  icon={Tick02Icon}
                  size={13}
                  className="text-primary"
                />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Export */}
      <DropdownMenu>
        <DropdownMenuTrigger
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground data-pressed:bg-accent data-pressed:text-accent-foreground"
          aria-label="Export"
          title="Export"
        >
          <HugeiconsIcon icon={Download04Icon} size={15} />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="center"
          side="top"
          sideOffset={8}
          className="min-w-36 border border-border bg-popover p-1 text-popover-foreground"
        >
          <DropdownMenuItem
            onClick={() => void exportPng()}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-popover-foreground/90 focus:bg-accent focus:text-accent-foreground data-highlighted:bg-accent data-highlighted:text-accent-foreground"
          >
            Export as PNG
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={exportJson}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-popover-foreground/90 focus:bg-accent focus:text-accent-foreground data-highlighted:bg-accent data-highlighted:text-accent-foreground"
          >
            Export as JSON
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
