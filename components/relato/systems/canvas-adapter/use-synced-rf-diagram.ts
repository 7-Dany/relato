"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  applyEdgeChanges,
  applyNodeChanges,
  type Edge,
  type Node,
  type OnEdgesChange,
  type OnNodesChange,
} from "@xyflow/react"

import type { SavedDiagram } from "../../domain"
import { toReactFlowEdges, toReactFlowNodes } from "./react-flow"

export type SyncedReactFlowDiagram = {
  nodes: Node[]
  edges: Edge[]
  onNodesChange: OnNodesChange
  onEdgesChange: OnEdgesChange
}

/**
 * Keeps React Flow's internal node/edge state in sync with the domain diagram
 * while preserving interactive state (selection, dragging) on existing items.
 *
 * Merge strategy:
 * 1. Preserves `selected` and `dragging` from previous React Flow state
 * 2. Returns previous node reference when the domain data hasn't changed,
 *    preventing unnecessary re-renders of memo'd node components during drag
 */
export function useSyncedReactFlowDiagram(
  diagram: SavedDiagram
): SyncedReactFlowDiagram {
  const [nodes, setNodes] = useState<Node[]>(() => toReactFlowNodes(diagram))
  const [edges, setEdges] = useState<Edge[]>(() => toReactFlowEdges(diagram))
  const prevDiagramRef = useRef(diagram)

  useEffect(() => {
    prevDiagramRef.current = diagram

    setNodes((prev) => {
      const rfNodes = toReactFlowNodes(diagram)
      const prevById = new Map(prev.map((n) => [n.id, n]))
      return rfNodes.map((n) => {
        const existing = prevById.get(n.id)
        if (!existing) return n
        // Preserve interactive state
        const merged = { ...n, selected: existing.selected, dragging: existing.dragging }
        // Return the existing reference if nothing meaningful changed for the node
        // component (data, selected, dragging are the same). This prevents memo'd
        // node components from re-rendering when only position or viewport changed.
        if (existing.selected === merged.selected
          && existing.dragging === merged.dragging
          && existing.data === merged.data) {
          return existing
        }
        return merged
      })
    })
  }, [diagram])

  useEffect(() => {
    setEdges((prev) => {
      const rfEdges = toReactFlowEdges(diagram)
      const prevById = new Map(prev.map((e) => [e.id, e]))
      return rfEdges.map((e) => {
        const existing = prevById.get(e.id)
        if (!existing) return e
        const merged = { ...e, selected: existing.selected }
        if (existing.selected === merged.selected && existing.data === merged.data) {
          return existing
        }
        return merged
      })
    })
  }, [diagram])

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((cur) => applyNodeChanges(changes, cur)),
    []
  )

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((cur) => applyEdgeChanges(changes, cur)),
    []
  )

  return { nodes, edges, onNodesChange, onEdgesChange }
}
