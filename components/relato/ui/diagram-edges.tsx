"use client"

import { memo } from "react"
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  getSmoothStepPath,
  Position,
  type EdgeProps,
  type Edge,
} from "@xyflow/react"

import type { DiagramEdge } from "../domain"
import { cn } from "@/lib/utils"

// ─── Per-edge SVG markers ─────────────────────────────────────────────────────
//
// currentColor in SVG <marker> elements does not reliably inherit from the
// referencing element across browsers. Instead of relying on currentColor, each
// edge renders its own <defs><marker> with the stroke/fill color baked directly
// into the marker geometry.

type MarkerType = "open-arrow" | "inheritance" | "aggregation" | "composition"

function MarkerDefs({
  id,
  markerTypes,
  stroke,
}: {
  id: string
  markerTypes: MarkerType[]
  stroke: string
}) {
  return (
    <defs>
      {markerTypes.includes("open-arrow") && (
        <marker
          id={`relato-open-arrow-${id}`}
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polyline
            points="0 0, 9 3.5, 0 7"
            fill="none"
            stroke={stroke}
            strokeWidth="1.5"
          />
        </marker>
      )}
      {markerTypes.includes("inheritance") && (
        <marker
          id={`relato-inheritance-${id}`}
          markerWidth="14"
          markerHeight="10"
          refX="13"
          refY="5"
          orient="auto"
        >
          <polygon
            points="0 0, 13 5, 0 10"
            fill="none"
            stroke={stroke}
            strokeWidth="1.5"
          />
        </marker>
      )}
      {markerTypes.includes("aggregation") && (
        <marker
          id={`relato-aggregation-${id}`}
          markerWidth="14"
          markerHeight="9"
          refX="1"
          refY="4.5"
          orient="auto"
        >
          <polygon
            points="7 0, 13 4.5, 7 9, 1 4.5"
            fill="none"
            stroke={stroke}
            strokeWidth="1.5"
          />
        </marker>
      )}
      {markerTypes.includes("composition") && (
        <marker
          id={`relato-composition-${id}`}
          markerWidth="14"
          markerHeight="9"
          refX="1"
          refY="4.5"
          orient="auto"
        >
          <polygon
            points="7 0, 13 4.5, 7 9, 1 4.5"
            fill={stroke}
            stroke={stroke}
            strokeWidth="1.5"
          />
        </marker>
      )}
    </defs>
  )
}

function markerUrl(id: string, type: MarkerType): string {
  return `url(#relato-${type}-${id})`
}

// ─── Shared edge path ─────────────────────────────────────────────────────────

interface DiagramEdgePathProps extends Omit<EdgeProps<Edge<DiagramEdge>>, "markerEnd" | "markerStart"> {
  strokeDasharray?: string
  markerEnd?: string
  markerStart?: string
}

function DiagramEdgePathComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  data,
  strokeDasharray,
  markerEnd,
  markerStart,
}: DiagramEdgePathProps) {
  // Offset source/target so markers don't overlap node borders
  const srcOffset = markerStart ? 10 : 0
  const tgtOffset = markerStart ? 0 : 5

  let sx = sourceX
  let sy = sourceY
  let tx = targetX
  let ty = targetY

  if (sourcePosition === Position.Top) sy -= srcOffset
  else if (sourcePosition === Position.Bottom) sy += srcOffset
  else if (sourcePosition === Position.Left) sx -= srcOffset
  else if (sourcePosition === Position.Right) sx += srcOffset

  if (targetPosition === Position.Top) ty += tgtOffset
  else if (targetPosition === Position.Bottom) ty -= tgtOffset
  else if (targetPosition === Position.Left) tx += tgtOffset
  else if (targetPosition === Position.Right) tx -= tgtOffset

  const stroke =
    data?.color ??
    (selected ? "var(--color-primary)" : "var(--color-muted-foreground)")
  const strokeWidth = data?.strokeWidth ?? (selected ? 2 : 1.5)

  // Curvature: bezier when non-zero
  const curvature = data?.curvature ?? 0
  let edgePath: string
  let labelX: number
  let labelY: number

  if (curvature !== 0) {
    const mx = (sx + tx) / 2
    const my = (sy + ty) / 2
    const dx = tx - sx
    const dy = ty - sy
    const length = Math.sqrt(dx * dx + dy * dy) || 1
    const px = -dy / length
    const py = dx / length
    const offset = (curvature * Math.min(Math.abs(dx), Math.abs(dy), 120)) / 1
    const cx = mx + px * offset
    const cy = my + py * offset
    edgePath = `M ${sx},${sy} Q ${cx},${cy} ${tx},${ty}`
    labelX = cx
    labelY = cy
  } else {
    const [path, lx, ly] = getSmoothStepPath({
      sourceX: sx,
      sourceY: sy,
      sourcePosition,
      targetX: tx,
      targetY: ty,
      targetPosition,
      borderRadius: 4,
    })
    edgePath = path
    labelX = lx
    labelY = ly
  }

  const dx = tx - sx
  const dy = ty - sy
  const edgeLen = Math.sqrt(dx * dx + dy * dy) || 1

  const srcLx = sx + (dx / edgeLen) * 28
  const srcLy = sy + (dy / edgeLen) * 28
  const tgtLx = tx - (dx / edgeLen) * 28
  const tgtLy = ty - (dy / edgeLen) * 28

  // Collect marker types needed for this edge
  const markerTypes: MarkerType[] = []
    if (markerEnd) markerTypes.push(markerEnd as MarkerType)
    if (markerStart) markerTypes.push(markerStart as MarkerType)

  return (
    <>
      <MarkerDefs id={id} markerTypes={markerTypes} stroke={stroke} />
      {/* Wide transparent hit area for easier selection */}
      <path
        d={edgePath}
        fill="none"
        strokeWidth={16}
        stroke="transparent"
        className="react-flow__edge-interaction"
      />
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDasharray}
        markerEnd={markerEnd ? markerUrl(id, markerEnd as MarkerType) : undefined}
        markerStart={markerStart ? markerUrl(id, markerStart as MarkerType) : undefined}
        style={{
          transition: "stroke 150ms, stroke-width 150ms",
        }}
      />
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            }}
            className={cn(
              "pointer-events-auto absolute rounded-sm border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] leading-tight text-muted-foreground nodrag nopan",
              selected && "border-primary/40 text-foreground"
            )}
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
      {data?.sourceLabel && (
        <EdgeLabelRenderer>
          <div
            style={{
              transform: `translate(-50%, -50%) translate(${srcLx}px,${srcLy}px)`,
            }}
            className="pointer-events-auto absolute rounded-sm border border-border bg-background px-1 font-mono text-[10px] leading-tight text-muted-foreground nodrag nopan"
          >
            {data.sourceLabel}
          </div>
        </EdgeLabelRenderer>
      )}
      {data?.targetLabel && (
        <EdgeLabelRenderer>
          <div
            style={{
              transform: `translate(-50%, -50%) translate(${tgtLx}px,${tgtLy}px)`,
            }}
            className="pointer-events-auto absolute rounded-sm border border-border bg-background px-1 font-mono text-[10px] leading-tight text-muted-foreground nodrag nopan"
          >
            {data.targetLabel}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

export const DiagramEdgePath = memo(DiagramEdgePathComponent)

// ─── UML edge type components ─────────────────────────────────────────────────

export const AssociationEdge = memo(function AssociationEdge(
  props: EdgeProps<Edge<DiagramEdge>>
) {
  return <DiagramEdgePath {...props} />
})

export const DirectedAssociationEdge = memo(function DirectedAssociationEdge(
  props: EdgeProps<Edge<DiagramEdge>>
) {
  return <DiagramEdgePath {...props} markerEnd="open-arrow" />
})

export const DependencyEdge = memo(function DependencyEdge(
  props: EdgeProps<Edge<DiagramEdge>>
) {
  return (
    <DiagramEdgePath
      {...props}
      strokeDasharray="6 4"
      markerEnd="open-arrow"
    />
  )
})

export const InheritanceEdge = memo(function InheritanceEdge(
  props: EdgeProps<Edge<DiagramEdge>>
) {
  return <DiagramEdgePath {...props} markerEnd="inheritance" />
})

export const AggregationEdge = memo(function AggregationEdge(
  props: EdgeProps<Edge<DiagramEdge>>
) {
  return <DiagramEdgePath {...props} markerStart="aggregation" />
})

export const CompositionEdge = memo(function CompositionEdge(
  props: EdgeProps<Edge<DiagramEdge>>
) {
  return <DiagramEdgePath {...props} markerStart="composition" />
})

export const RealizationEdge = memo(function RealizationEdge(
  props: EdgeProps<Edge<DiagramEdge>>
) {
  return (
    <DiagramEdgePath
      {...props}
      strokeDasharray="6 4"
      markerEnd="inheritance"
    />
  )
})

// ─── Anchor edge ──────────────────────────────────────────────────────────────
// Thin dotted line from a note to its target class node. Decorative only.

export const AnchorEdge = memo(function AnchorEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })
  return (
    <BaseEdge
      id={id}
      path={edgePath}
      style={{
        strokeWidth: 1,
        stroke: "var(--color-muted-foreground)",
        opacity: 0.25,
        strokeDasharray: "2 4",
        pointerEvents: "none",
      }}
    />
  )
})

// ─── Edge type registry ───────────────────────────────────────────────────────

import type { EdgeTypes } from "@xyflow/react"

export const RELATO_EDGE_TYPES: EdgeTypes = {
  "uml-association": AssociationEdge,
  "uml-directed-association": DirectedAssociationEdge,
  "uml-dependency": DependencyEdge,
  "uml-inheritance": InheritanceEdge,
  "uml-aggregation": AggregationEdge,
  "uml-composition": CompositionEdge,
  "uml-realization": RealizationEdge,
  "uml-anchor": AnchorEdge,
}
