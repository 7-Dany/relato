"use client"

import { useMemo } from "react"
import { useNodes, useReactFlow } from "@xyflow/react"
import { cn } from "@/lib/utils"
import type {
  ClassDiagramNode,
  DiagramNodeId,
  NoteDiagramNode,
} from "../../domain"
import type { WorkbenchProps } from "./types"

export function LeftPanel({
  session,
  dispatch,
  collapsed,
}: WorkbenchProps & {
  collapsed: boolean
}) {
  const { rootNodes, notesByTarget } = useMemo(() => {
    const notesByTarget = new Map<string, NoteDiagramNode[]>()
    const floatingNotes: NoteDiagramNode[] = []

    for (const node of session.diagram.nodes) {
      if (node.kind !== "note") continue
      if (node.targetNodeId) {
        const list = notesByTarget.get(node.targetNodeId) ?? []
        list.push(node)
        notesByTarget.set(node.targetNodeId, list)
      } else {
        floatingNotes.push(node)
      }
    }

    const classNodes = session.diagram.nodes.filter(
      (n): n is ClassDiagramNode => n.kind === "class"
    )
    return { rootNodes: classNodes, floatingNotes, notesByTarget }
  }, [session.diagram.nodes])

  // Read multi-selection from React Flow node state
  const rfNodes = useNodes()
  const selectedIds = useMemo(() => {
    const ids = new Set<string>()
    for (const n of rfNodes) {
      if (n.selected) ids.add(n.id)
    }
    return ids
  }, [rfNodes])

  const { setNodes } = useReactFlow()

  function selectNode(id: string, mod: boolean) {
    if (mod) {
      // Toggle: add/remove from React Flow selection
      setNodes((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, selected: !n.selected } : n
        )
      )
    } else {
      // Replace: clear all, select just this node
      setNodes((prev) =>
        prev.map((n) => ({ ...n, selected: n.id === id }))
      )
    }
    dispatch({
      type: "select",
      selection: { kind: "node", id: id as DiagramNodeId },
    })
  }

  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col overflow-hidden border-r border-border bg-card transition-all duration-200",
        collapsed ? "w-0 border-r-0" : "w-[260px]"
      )}
      aria-label="Diagram layers"
    >
      {/* Header */}
      <div className="flex h-10 shrink-0 items-center gap-2 border-b border-border px-3">
        <p className="font-mono text-[10px] font-black tracking-widest text-muted-foreground uppercase">
          Layers
        </p>
        <span className="font-mono text-[10px] text-muted-foreground">
          {session.diagram.nodes.length}
        </span>
      </div>

      {/* Layer list */}
      {!collapsed && (
        <div className="flex-1 overflow-y-auto p-3 pt-2">
          <div className="space-y-0.5">
            {rootNodes.map((classNode) => (
              <div key={classNode.id}>
                <NodeRow
                  label={classNode.name}
                  isSelected={selectedIds.has(classNode.id)}
                  dotColor={classNode.color ?? undefined}
                  onClick={(e) => selectNode(classNode.id, e.ctrlKey || e.metaKey || e.shiftKey)}
                />

                {(notesByTarget.get(classNode.id) ?? []).map((note) => (
                  <NoteRow
                    key={note.id}
                    note={note}
                    isSelected={selectedIds.has(note.id)}
                    onClick={(e) => selectNode(note.id, e.ctrlKey || e.metaKey || e.shiftKey)}
                  />
                ))}
              </div>
            ))}

            {session.diagram.nodes
              .filter(
                (n): n is NoteDiagramNode => n.kind === "note" && !n.targetNodeId
              )
              .map((note) => (
                <NoteRow
                  key={note.id}
                  note={note}
                  isSelected={selectedIds.has(note.id)}
                  onClick={(e) => selectNode(note.id, e.ctrlKey || e.metaKey || e.shiftKey)}
                />
              ))}
            {session.diagram.nodes.length === 0 && (
              <p className="rounded-md border border-border bg-muted/50 px-2.5 py-2 text-xs text-muted-foreground">
                Add a class or insert a template to start this project.
              </p>
            )}
          </div>
        </div>
      )}
    </aside>
  )
}

// ─── Row components ────────────────────────────────────────────────────────────

function NodeRow({
  label,
  isSelected,
  dotColor,
  onClick,
}: {
  label: string
  isSelected: boolean
  dotColor?: string
  onClick: (e: React.MouseEvent) => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-sm transition-colors",
        isSelected
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-accent/60"
      )}
    >
      <span
        className="size-2 shrink-0 rounded-full"
        style={{ background: dotColor ?? "var(--muted-foreground)" }}
        aria-hidden
      />
      <span className="truncate">{label || "ClassName"}</span>
    </button>
  )
}

function NoteRow({
  note,
  isSelected,
  onClick,
}: {
  note: NoteDiagramNode
  isSelected: boolean
  onClick: (e: React.MouseEvent) => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-md py-1 pr-2 pl-6 text-left text-[12px] transition-colors",
        isSelected
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground/80 hover:bg-accent/60 hover:text-muted-foreground"
      )}
    >
      <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-[9px] text-muted-foreground">
        {note.number}
      </span>
      <span className="truncate">{note.title || "Note"}</span>
    </button>
  )
}
