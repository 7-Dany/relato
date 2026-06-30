"use client"

import { createContext, use } from "react"

import type { DiagramPoint } from "../../domain"

/**
 * Actions that live inside the ReactFlow provider context.
 * Provided by CanvasPane, consumed by CommandToolbar and other siblings.
 */
export interface CanvasActionsContextValue {
  layout: (direction?: "TB" | "LR") => Promise<void>
  exportPng: () => Promise<void>
  exportJson: () => void
  viewportCenter: () => DiagramPoint
}

export const CanvasActionsContext =
  createContext<CanvasActionsContextValue | null>(null)

export function useCanvasActions(): CanvasActionsContextValue {
  const ctx = use(CanvasActionsContext)
  if (!ctx) {
    throw new Error(
      "[Relato] useCanvasActions() must be used inside <CanvasPane>."
    )
  }
  return ctx
}
