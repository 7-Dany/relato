"use client";

import { createContext, use } from "react";

import type { ClassNodeData } from "./nodes/class-node";

/** Re-export from edges so there's a single source of truth. */
export type { DiagramEdgeType } from "./edges/diagram-edge-path";
export type { ClassNodeData } from "./nodes/class-node";

// ─── Actions context — TRULY stable, callbacks only ──────────────────────

/**
 * Stable actions — never changes after mount. Consumers are immune to all
 * interaction (selection changes, edge-type switches, pattern loads).
 */
export interface DiagramActionsContextValue {
  addNode: (stereotype: ClassNodeData["stereotype"]) => void;
  addExplanationCard: () => void;
  layout: (direction?: "TB" | "LR") => Promise<void>;
  loadPattern: (patternId: string) => void;
  resetDiagram: () => void;
}

export const DiagramActionsContext =
  createContext<DiagramActionsContextValue | null>(null);

export function useDiagramActions(): DiagramActionsContextValue {
  const ctx = use(DiagramActionsContext);
  if (!ctx) {
    throw new Error(
      "[DiagramContext] useDiagramActions() must be inside <DiagramBuilder>.",
    );
  }
  return ctx;
}
