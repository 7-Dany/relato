"use client";

import { memo } from "react";
import { BaseEdge, getBezierPath, type EdgeProps } from "@xyflow/react";

/**
 * Decorative anchor line from an explanation card to its target diagram node.
 * Extremely subtle — thin, low opacity, dotted. Clearly decorative, not a
 * UML relationship edge.
 */
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
  });

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
  );
});

export const anchorEdgeType = "anchor";
