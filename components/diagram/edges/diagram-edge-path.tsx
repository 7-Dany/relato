import { memo } from "react";
import {
  getSmoothStepPath,
  Position,
  EdgeLabelRenderer,
  type EdgeProps,
  type Edge,
} from "@xyflow/react";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────────

export type DiagramEdgeData = {
  label?: string;
  curvature?: number;
  color?: string;
  strokeWidth?: number;
};

export type DiagramEdge = Edge<DiagramEdgeData>;

// ─── Module-scope constants ─────────────────────────────────────────────────

const MARKER_URL_RE = /url\(#([^)]+)\)/;
const EDGE_STYLE_TRANSITION =
  "stroke 150ms cubic-bezier(0.23,1,0.32,1), stroke-width 150ms cubic-bezier(0.23,1,0.32,1)";

// ─── Helpers ────────────────────────────────────────────────────────────────

function resolveMarker(marker: string | undefined): string | undefined {
  if (!marker) return undefined;
  const match = marker.match(MARKER_URL_RE);
  if (!match) return marker;
  return `url(#${match[1]})`;
}

// ─── Shared edge path ──────────────────────────────────────────────────────

interface DiagramEdgePathProps extends EdgeProps<DiagramEdge> {
  strokeDasharray?: string;
  markerEnd?: string;
  markerStart?: string;
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
  const sourceOffset = markerStart ? 10 : 0;
  const targetOffset = markerStart ? 0 : 5;

  let sx = sourceX;
  let sy = sourceY;
  let tx = targetX;
  let ty = targetY;

  switch (sourcePosition) {
    case Position.Top:
      sy -= sourceOffset;
      break;
    case Position.Bottom:
      sy += sourceOffset;
      break;
    case Position.Left:
      sx -= sourceOffset;
      break;
    case Position.Right:
      sx += sourceOffset;
      break;
  }

  switch (targetPosition) {
    case Position.Top:
      ty += targetOffset;
      break;
    case Position.Bottom:
      ty -= targetOffset;
      break;
    case Position.Left:
      tx += targetOffset;
      break;
    case Position.Right:
      tx -= targetOffset;
      break;
  }

  const stroke =
    data?.color ??
    (selected ? "var(--color-primary)" : "var(--color-muted-foreground)");
  const strokeWidth = data?.strokeWidth ?? (selected ? 2 : 1.5);

  // Curvature: use quadratic bezier when curvature is set and non-zero
  const curvature = data?.curvature;
  let edgePath: string;
  let labelX: number;
  let labelY: number;

  if (curvature && curvature !== 0) {
    // Calculate the perpendicular offset for the control point
    const mx = (sx + tx) / 2;
    const my = (sy + ty) / 2;
    const dx = tx - sx;
    const dy = ty - sy;
    const length = Math.sqrt(dx * dx + dy * dy) || 1;
    // Perpendicular unit vector (rotate 90 degrees counter-clockwise)
    const px = -dy / length;
    const py = dx / length;
    const offset = curvature / 10;
    const cx = mx + px * offset;
    const cy = my + py * offset;
    edgePath = `M ${sx},${sy} Q ${cx},${cy} ${tx},${ty}`;
    // Label at the midpoint of the curve (approximately the control point area)
    labelX = cx;
    labelY = cy;
  } else {
    // Fall back to smoothstep path for zero curvature
    const [path, lx, ly] = getSmoothStepPath({
      sourceX: sx,
      sourceY: sy,
      sourcePosition,
      targetX: tx,
      targetY: ty,
      targetPosition,
      borderRadius: 4,
    });
    edgePath = path;
    labelX = lx;
    labelY = ly;
  }

  return (
    <>
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
        markerEnd={resolveMarker(markerEnd)}
        markerStart={resolveMarker(markerStart)}
        style={{
          transition: EDGE_STYLE_TRANSITION,
          color: stroke,
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
              selected && "border-primary/40 text-foreground",
            )}
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export const DiagramEdgePath = memo(DiagramEdgePathComponent);

// ─── Edge type wrappers ────────────────────────────────────────────────────

export const AssociationEdge = memo(function AssociationEdge(
  props: EdgeProps<DiagramEdge>,
) {
  return <DiagramEdgePath {...props} markerEnd="url(#uml-open-arrow)" />;
});

export const DependencyEdge = memo(function DependencyEdge(
  props: EdgeProps<DiagramEdge>,
) {
  return (
    <DiagramEdgePath
      {...props}
      strokeDasharray="6 4"
      markerEnd="url(#uml-open-arrow)"
    />
  );
});

export const InheritanceEdge = memo(function InheritanceEdge(
  props: EdgeProps<DiagramEdge>,
) {
  return <DiagramEdgePath {...props} markerEnd="url(#uml-inheritance)" />;
});

export const AggregationEdge = memo(function AggregationEdge(
  props: EdgeProps<DiagramEdge>,
) {
  return <DiagramEdgePath {...props} markerStart="url(#uml-aggregation)" />;
});

// ─── Type registry ─────────────────────────────────────────────────────────

import type { EdgeTypes } from "@xyflow/react";

export const edgeTypes: EdgeTypes = {
  association: AssociationEdge,
  dependency: DependencyEdge,
  inheritance: InheritanceEdge,
  aggregation: AggregationEdge,
};

export type DiagramEdgeType = keyof typeof edgeTypes;
