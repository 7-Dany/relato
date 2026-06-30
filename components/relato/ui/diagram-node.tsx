"use client"

import { memo } from "react"
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react"

import type { ClassDiagramNode, NoteDiagramNode } from "../domain"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

type RelatoNodeData = ClassDiagramNode | NoteDiagramNode
type RelatoCanvasNode = Node<RelatoNodeData>

// ─── Handle constants ─────────────────────────────────────────────────────────

const SIDES = [
  { id: "top", position: Position.Top },
  { id: "right", position: Position.Right },
  { id: "bottom", position: Position.Bottom },
  { id: "left", position: Position.Left },
] as const

const SOURCE_HANDLE =
  "size-3.5! rounded-full! border-2! border-background! bg-muted-foreground! opacity-0! transition-opacity! duration-150! group-hover/node:opacity-100!"
const TARGET_HANDLE =
  "size-3.5! rounded-full! border-0! bg-transparent! opacity-0! transition-opacity! duration-150! group-hover/node:opacity-100!"
const SELECTED_HANDLE = "opacity-100!"

// ─── Shared handle grid ───────────────────────────────────────────────────────

function NodeHandles({ selected }: { selected?: boolean }) {
  const extra = selected ? SELECTED_HANDLE : ""
  return (
    <>
      {SIDES.map(({ id, position }) => (
        <Handle
          key={`t-${id}`}
          id={`target-${id}`}
          type="target"
          position={position}
          isConnectableStart={false}
          className={cn(TARGET_HANDLE, extra)}
        />
      ))}
      {SIDES.map(({ id, position }) => (
        <Handle
          key={`s-${id}`}
          id={id}
          type="source"
          position={position}
          isConnectableEnd={false}
          className={cn(SOURCE_HANDLE, extra)}
        />
      ))}
    </>
  )
}

// ─── Class node ───────────────────────────────────────────────────────────────

function ClassNodeComponent({
  data,
  selected,
}: {
  data: ClassDiagramNode
  selected?: boolean
}) {
  const { name, stereotype, role, files, fields, methods, color } = data
  const visibleFields = fields.filter(Boolean)
  const visibleMethods = methods.filter(Boolean)
  const visibleFiles = (files ?? []).filter(Boolean)
  const primaryFile = visibleFiles[0]
  const extraFileCount = Math.max(visibleFiles.length - 1, 0)

  const colorStyle = color
    ? { borderTopColor: color, borderTopWidth: 4 }
    : undefined

  return (
    <figure
      role="group"
      aria-label={`${name || "ClassName"} class node`}
      className={cn(
        "group/node min-w-[220px] overflow-hidden rounded-sm border bg-card text-card-foreground",
        "shadow-[0_10px_24px_-4px_rgba(0,0,0,0.10)]",
        "transition-[border-color,box-shadow] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
        selected
          ? "border-primary/70 shadow-[0_0_0_3px_color-mix(in_oklch,var(--color-primary)_18%,transparent),0_12px_28px_-4px_rgba(0,0,0,0.14)]"
          : "border-border/90 hover:border-border/60 hover:shadow-[0_12px_28px_-4px_rgba(0,0,0,0.14)]"
      )}
      style={colorStyle}
    >
      <NodeHandles selected={selected} />

      {/* Header */}
      <figcaption
        className={cn(
          "border-b border-border/80 px-4 py-3 text-center transition-colors duration-150",
          selected ? "bg-primary/4" : "bg-muted/40"
        )}
      >
        {role && (
          <div className="mb-1 font-mono text-[10px] tracking-[0.18em] uppercase text-muted-foreground">
            {role}
          </div>
        )}
        {stereotype === "interface" && (
          <div className="mb-0.5 font-mono text-[10px] font-medium tracking-wide uppercase text-muted-foreground">
            «interface»
          </div>
        )}
        <div
          className={cn(
            "mx-auto max-w-[200px] truncate text-[15px] font-bold leading-snug tracking-tight",
            stereotype === "abstract" && "italic",
            selected ? "text-foreground" : "text-foreground/90"
          )}
          title={name || "ClassName"}
        >
          {name || "ClassName"}
        </div>
      </figcaption>

      {/* Fields */}
      <div
        className="min-h-8 border-b border-border/80 px-4 py-2"
        role="list"
        aria-label={`${name} fields`}
      >
        {visibleFields.length === 0 ? (
          <Placeholder>no fields</Placeholder>
        ) : (
          visibleFields.map((f) => <MemberRow key={f}>{f}</MemberRow>)
        )}
      </div>

      {/* Methods */}
      <div
        className="min-h-8 px-4 py-2"
        role="list"
        aria-label={`${name} methods`}
      >
        {visibleMethods.length === 0 ? (
          <Placeholder>no methods</Placeholder>
        ) : (
          visibleMethods.map((m) => <MemberRow key={m}>{m}</MemberRow>)
        )}
      </div>

      {/* File footer */}
      {primaryFile && (
        <div className="border-t border-border/80 bg-muted/30 px-4 py-2">
          <div className="flex items-center justify-between gap-3">
            <span className="truncate font-mono text-[10px] text-muted-foreground">
              {primaryFile}
            </span>
            {extraFileCount > 0 && (
              <span className="shrink-0 rounded-full bg-background px-2 py-0.5 font-mono text-[9px] text-muted-foreground">
                +{extraFileCount}
              </span>
            )}
          </div>
        </div>
      )}
    </figure>
  )
}

// ─── Note node ────────────────────────────────────────────────────────────────

// Hoisted — no /g flag, split() doesn't use lastIndex
const INLINE_CODE_RE = /(`[^`]+`)/

function NoteNodeComponent({
  data,
  selected,
}: {
  data: NoteDiagramNode
  selected?: boolean
}) {
  const { number, title, body } = data
  const lines = body.split("\n")

  return (
    <article
      className={cn(
        "group/node relative min-w-[180px] max-w-[220px] rounded-2xl border bg-background/95 p-3 shadow-lg backdrop-blur",
        "transition-[border-color,box-shadow,opacity] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
        selected
          ? "border-primary shadow-[0_0_0_2px_color-mix(in_oklch,var(--color-primary)_20%,transparent)]"
          : "border-border/80 hover:border-border"
      )}
      aria-label={`Note ${number}: ${title}`}
    >
      {/* Anchor handle — invisible, used by anchor edge only */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="anchor"
        style={{ opacity: 0, pointerEvents: "none" }}
      />
      <NodeHandles selected={selected} />

      <div className="mb-1.5 flex items-center gap-2">
        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
          {number}
        </span>
        <span className="text-sm font-medium text-foreground">{title}</span>
      </div>

      <div className="text-[12px] leading-[1.55] text-muted-foreground">
        {lines.map((line, i) => {
          const parts = line.split(INLINE_CODE_RE)
          return (
            <p key={i} className={i > 0 ? "mt-1" : ""}>
              {parts.map((part, j) =>
                part.startsWith("`") && part.endsWith("`") ? (
                  <code
                    key={j}
                    className="rounded bg-muted px-1 py-0.5 font-mono text-[11px] text-foreground"
                  >
                    {part.slice(1, -1)}
                  </code>
                ) : (
                  <span key={j}>{part}</span>
                )
              )}
            </p>
          )
        })}
      </div>
    </article>
  )
}

// ─── Unified node component ───────────────────────────────────────────────────

function RelatoDiagramNodeComponent({
  data,
  selected,
}: NodeProps<RelatoCanvasNode>) {
  if (data.kind === "note") {
    return <NoteNodeComponent data={data} selected={selected} />
  }
  return <ClassNodeComponent data={data} selected={selected} />
}

export const RelatoDiagramNode = memo(RelatoDiagramNodeComponent)

// ─── Sub-components ───────────────────────────────────────────────────────────

function Placeholder({ children }: { children: React.ReactNode }) {
  return (
    <div className="select-none font-mono text-[11px] italic text-muted-foreground/30" aria-hidden>
      {children}
    </div>
  )
}

function MemberRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono text-[11px] leading-[1.6] tracking-tight text-foreground/80" role="listitem">
      {children}
    </div>
  )
}
