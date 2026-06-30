"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import type {
  ClassDiagramNode,
  ClassStereotype,
  DiagramEdge,
  DiagramEdgeKind,
  DiagramNodeId,
  NoteDiagramNode,
} from "../../domain"
import { selectedDiagramItem } from "../../systems/diagram-session"
import { RELATO_ACCENT_COLORS } from "../../ui/colors"
import type { WorkbenchProps } from "./types"

// ─── Color swatches ────────────────────────────────────────────────────────────

// Imported from ui/colors — shared with diagram-context-menu
const COLOR_SWATCHES = RELATO_ACCENT_COLORS

const EDGE_KINDS: DiagramEdgeKind[] = [
  "association",
  "directed-association",
  "dependency",
  "inheritance",
  "aggregation",
  "composition",
  "realization",
]

// ─── Root panel ────────────────────────────────────────────────────────────────

export function InspectorPanel({ session, dispatch }: WorkbenchProps) {
  const selected = selectedDiagramItem(session.diagram, session.selection)
  const classNodes = session.diagram.nodes.filter(
    (n): n is ClassDiagramNode => n.kind === "class"
  )

  function handleDelete() {
    if (!session.selection) return
    dispatch({ type: "delete-selection", selection: session.selection })
  }

  return (
    <aside
      className="flex h-full w-[300px] shrink-0 flex-col border-l border-border bg-card"
      aria-label="Inspector"
    >
      {/* ── Panel header ───────────────────────────────────── */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-border px-4">
        <span className="text-sm font-semibold text-foreground">
          {!selected
            ? "Properties"
            : "source" in selected
              ? "Edge"
              : selected.kind === "note"
                ? "Note"
                : selected.stereotype === "interface"
                  ? "Interface"
                  : selected.stereotype === "abstract"
                    ? "Abstract class"
                    : "Class"}
        </span>
        {selected && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={handleDelete}
            aria-label="Delete selected"
            className="text-muted-foreground hover:bg-accent hover:text-destructive"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden
            >
              <path
                d="M2 4h12M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1M6 7v5M10 7v5M3 4l1 9a1 1 0 001 1h6a1 1 0 001-1l1-9"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Button>
        )}
      </div>

      {/* ── Scrollable body ─────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {!selected && (
          <Section
            label={session.diagram.title}
            description="Select a class, note, or relationship to edit its details."
          />
        )}

        {/* Edge selected */}
        {selected && "source" in selected && (
          <EdgeInspector
            edge={selected}
            onChange={(patch) =>
              dispatch({ type: "update-edge", id: selected.id, patch })
            }
          />
        )}

        {/* Class node selected */}
        {selected && "position" in selected && selected.kind === "class" && (
          <ClassInspector
            node={selected}
            onChange={(patch) =>
              dispatch({ type: "update-class-node", id: selected.id, patch })
            }
          />
        )}

        {/* Note node selected */}
        {selected && "position" in selected && selected.kind === "note" && (
          <NoteInspector
            node={selected}
            classNodes={classNodes}
            onChange={(patch) =>
              dispatch({ type: "update-note-node", id: selected.id, patch })
            }
          />
        )}
      </div>
    </aside>
  )
}

// ─── Class inspector ───────────────────────────────────────────────────────────

function ClassInspector({
  node,
  onChange,
}: {
  node: ClassDiagramNode
  onChange: (patch: Partial<ClassDiagramNode>) => void
}) {
  const {
    name,
    stereotype,
    role,
    summary,
    fields,
    methods,
    files,
    reviewNotes,
    color,
  } = node

  return (
    <>
      {/* Color swatches */}
      <Section label="Color">
        <ColorSwatches value={color} onChange={(value) => onChange({ color: value })} />
      </Section>

      <Divider />

      {/* Name */}
      <Section label="Name">
        <ThemedInput
          value={name}
          onChange={(v) => onChange({ name: v })}
          placeholder="ClassName"
        />
      </Section>

      {/* Type toggle */}
      <Section label="Type">
        <div className="flex rounded-lg border border-border bg-muted/40 p-0.5">
          {(
            [
              { value: null, label: "Class" },
              { value: "interface" as ClassStereotype, label: "«interface»" },
              { value: "abstract" as ClassStereotype, label: "Abstract" },
            ] as { value: ClassStereotype; label: string }[]
          ).map(({ value, label }) => (
            <button
              key={label}
              type="button"
              onClick={() => onChange({ stereotype: value })}
              className={cn(
                "flex-1 rounded-md py-1 text-[11px] font-medium transition-colors",
                stereotype === value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </Section>

      <Divider />

      {/* Role */}
      <Section label="Role" description="Short label used in the node header">
        <ThemedInput
          value={role}
          onChange={(v) => onChange({ role: v })}
          placeholder="State owner"
        />
      </Section>

      {/* Fields */}
      <Section label="Fields" description="One field per line">
        <ThemedTextarea
          value={fields.join("\n")}
          onChange={(v) => onChange({ fields: v.split("\n") })}
          placeholder="- field: Type"
          rows={4}
          mono
        />
      </Section>

      {/* Methods */}
      <Section label="Methods" description="One method per line">
        <ThemedTextarea
          value={methods.join("\n")}
          onChange={(v) => onChange({ methods: v.split("\n") })}
          placeholder="+ method(): ReturnType"
          rows={4}
          mono
        />
      </Section>

      <Divider />

      {/* Summary */}
      <Section label="Summary" description="What responsibility this box owns">
        <ThemedTextarea
          value={summary}
          onChange={(v) => onChange({ summary: v })}
          placeholder="Captures and restores state snapshots."
          rows={3}
        />
      </Section>

      {/* Source files */}
      <Section label="Source Files" description="One path per line">
        <ThemedTextarea
          value={files.join("\n")}
          onChange={(v) => onChange({ files: v.split("\n") })}
          placeholder="src/domain/editor/originator.ts"
          rows={2}
          mono
        />
      </Section>

      {/* Review notes */}
      <Section
        label="Review Notes"
        description="Open questions, risks, or follow-up work"
      >
        <ThemedTextarea
          value={reviewNotes}
          onChange={(v) => onChange({ reviewNotes: v })}
          placeholder="Undo stack grows without a retention policy."
          rows={3}
        />
      </Section>
    </>
  )
}

// ─── Note inspector ────────────────────────────────────────────────────────────

function NoteInspector({
  node,
  classNodes,
  onChange,
}: {
  node: NoteDiagramNode
  classNodes: ClassDiagramNode[]
  onChange: (patch: Partial<NoteDiagramNode>) => void
}) {
  return (
    <>
      <Section label="Title">
        <ThemedInput
          value={node.title}
          onChange={(v) => onChange({ title: v })}
          placeholder="Note title"
        />
      </Section>

      <Section label="Body" description="Wrap code in `backticks`">
        <ThemedTextarea
          value={node.body}
          onChange={(v) => onChange({ body: v })}
          placeholder="Explain this part of the diagram…"
          rows={5}
        />
      </Section>

      <Divider />

      {/* Connects to — the core note→class linking feature */}
      <Section
        label="Connects to"
        description="Draws an anchor line to a class node"
      >
        <ThemedSelect
          value={node.targetNodeId ?? "__none__"}
          onChange={(v) =>
            onChange({
              targetNodeId: v === "__none__" ? null : (v as DiagramNodeId),
            })
          }
          options={[
            { value: "__none__", label: "None (free floating)" },
            ...classNodes.map((n) => ({
              value: n.id,
              label: n.name || "ClassName",
            })),
          ]}
        />
      </Section>
    </>
  )
}

// ─── Edge inspector ────────────────────────────────────────────────────────────

function EdgeInspector({
  edge,
  onChange,
}: {
  edge: DiagramEdge
  onChange: (patch: Partial<DiagramEdge>) => void
}) {
  return (
    <>
      {/* Kind */}
      <Section label="Relationship">
        <ThemedSelect
          value={edge.kind}
          onChange={(v) => onChange({ kind: v as DiagramEdgeKind })}
          options={EDGE_KINDS.map((k) => ({ value: k, label: capitalize(k) }))}
        />
      </Section>

      {/* Label */}
      <Section label="Label" description="Short verb shown on the line">
        <ThemedInput
          value={edge.label}
          onChange={(v) => onChange({ label: v })}
          placeholder="implements / has / creates"
        />
      </Section>

      <Divider />

      {/* Source multiplicity */}
      <Section
        label="From multiplicity"
        description="E.g. 1, 0..*, 1..2 — shown near the source"
      >
        <ThemedInput
          value={edge.sourceLabel}
          onChange={(v) => onChange({ sourceLabel: v })}
          placeholder="1"
        />
      </Section>

      {/* Target multiplicity */}
      <Section
        label="To multiplicity"
        description="E.g. 1, 0..*, 1..2 — shown near the target"
      >
        <ThemedInput
          value={edge.targetLabel}
          onChange={(v) => onChange({ targetLabel: v })}
          placeholder="1..*"
        />
      </Section>

      <Divider />

      {/* Color swatches */}
      <Section label="Color">
        <ColorSwatches value={edge.color} onChange={(value) => onChange({ color: value })} />
      </Section>

      <Divider />

      {/* Stroke width */}
      <Section label={`Stroke width — ${edge.strokeWidth}px`}>
        <ThemedSlider
          min={1}
          max={6}
          step={0.5}
          value={edge.strokeWidth}
          onChange={(v) => onChange({ strokeWidth: v })}
        />
      </Section>

      {/* Curvature */}
      <Section label={`Curvature — ${edge.curvature.toFixed(2)}`}>
        <ThemedSlider
          min={-1}
          max={1}
          step={0.05}
          value={edge.curvature}
          onChange={(v) => onChange({ curvature: v })}
        />
      </Section>
    </>
  )
}

// ─── Layout primitives ─────────────────────────────────────────────────────────

function Section({
  label,
  description,
  children,
}: {
  label?: string
  description?: string
  children?: React.ReactNode
}) {
  return (
    <div className="px-4 py-3">
      {label && (
        <p className="mb-1.5 text-[11px] font-semibold text-muted-foreground">
          {label}
        </p>
      )}
      {description && (
        <p className="mb-2 text-[11px] leading-snug text-muted-foreground/70">
          {description}
        </p>
      )}
      {children}
    </div>
  )
}

function Divider() {
  return <div className="mx-4 border-t border-border" />
}

// ─── Color swatches — shared by class & edge inspectors ───────────────────────

function ColorSwatches({
  value,
  onChange,
}: {
  value: string | null
  onChange: (value: string | null) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {COLOR_SWATCHES.map(({ label, value: swatch }) => (
        <button
          key={label}
          type="button"
          onClick={() => onChange(swatch)}
          aria-label={label}
          title={label}
          className={cn(
            "size-[22px] rounded-full border-[2px] transition-all hover:scale-110",
            value === swatch
              ? "scale-110 border-foreground/60"
              : "border-transparent hover:border-border"
          )}
          style={
            swatch
              ? { background: swatch }
              : {
                  background: "var(--muted)",
                  borderStyle: "dashed",
                  borderColor:
                    value === null ? "var(--foreground)" : "var(--border)",
                }
          }
        />
      ))}
    </div>
  )
}

// ─── Themed form controls — shadcn primitives, no color overrides ─────────────

function ThemedInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <Input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-9 rounded-md"
    />
  )
}

function ThemedTextarea({
  value,
  onChange,
  placeholder,
  rows = 3,
  mono = false,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
  mono?: boolean
}) {
  return (
    <Textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={cn("min-h-0 rounded-md px-2.5 py-2 text-sm", mono && "font-mono text-xs")}
    />
  )
}

function ThemedSelect({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <Select
      value={value}
      onValueChange={(next) => {
        if (next) onChange(next)
      }}
    >
      <SelectTrigger className="h-9 w-full rounded-md">
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="start" className="rounded-lg">
        {options.map((opt) => (
          <SelectItem
            key={opt.value}
            value={opt.value}
            className="rounded-md text-sm"
          >
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function ThemedSlider({
  min,
  max,
  step,
  value,
  onChange,
}: {
  min: number
  max: number
  step: number
  value: number
  onChange: (v: number) => void
}) {
  const [localValue, setLocalValue] = useState<number | null>(null)
  const displayValue = localValue ?? value

  return (
    <Slider
      min={min}
      max={max}
      step={step}
      value={[displayValue]}
      onValueChange={(next) => {
        setLocalValue(Array.isArray(next) ? next[0] : next)
      }}
      onValueCommitted={(next) => {
        const committed = Array.isArray(next) ? next[0] : next
        setLocalValue(null)
        onChange(committed ?? value)
      }}
    />
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
