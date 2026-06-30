"use client"

import { useEffect } from "react"
import type { Edge, Node } from "@xyflow/react"

import type {
  DiagramCommand,
  DiagramEdgeId,
  DiagramNodeId,
  DiagramPoint,
  DiagramSelection,
} from "../../domain"

export type KeyboardShortcutsOptions = {
  dispatch: (command: DiagramCommand) => void
  selection: DiagramSelection
  getViewportCenter: () => DiagramPoint
  getNodes: () => Node[]
  getEdges: () => Edge[]
  layout: () => Promise<void>
  onUndo: () => void
  onRedo: () => void
}

export function useDiagramKeyboardShortcuts({
  dispatch,
  selection,
  getViewportCenter,
  getNodes,
  getEdges,
  layout,
  onUndo,
  onRedo,
}: KeyboardShortcutsOptions) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return

      const mod = e.metaKey || e.ctrlKey

      switch (e.key) {
        case "z":
          if (mod && e.shiftKey) {
            e.preventDefault()
            onRedo()
          } else if (mod) {
            e.preventDefault()
            onUndo()
          }
          break
        case "y":
          if (mod) {
            e.preventDefault()
            onRedo()
          }
          break
        case "Escape":
          dispatch({ type: "select", selection: null })
          break
        case "Delete":
        case "Backspace": {
          const selectedNodeIds = getNodes()
            .filter((n) => n.selected)
            .map((n) => n.id as DiagramNodeId)
          const selectedEdgeIds = getEdges()
            .filter((e) => e.selected)
            .map((e) => e.id as DiagramEdgeId)
          if (selectedNodeIds.length > 0 || selectedEdgeIds.length > 0) {
            dispatch({
              type: "delete-multiple",
              nodeIds: selectedNodeIds,
              edgeIds: selectedEdgeIds,
            })
          } else if (selection) {
            dispatch({
              type: "delete-selection",
              selection,
            })
          }
          break
        }
        case "n":
          if (!mod) {
            e.preventDefault()
            const origin = getViewportCenter()
            dispatch({
              type: "add-class-node",
              position: origin,
            })
          }
          break
        case "m":
          if (!mod) {
            e.preventDefault()
            const origin = getViewportCenter()
            dispatch({
              type: "add-note-node",
              position: { x: origin.x, y: origin.y + 60 },
            })
          }
          break
        case "l":
          if (!mod) {
            e.preventDefault()
            void layout()
          }
          break
        case "1":
          if (!mod)
            dispatch({ type: "set-active-edge-kind", kind: "association" })
          break
        case "2":
          if (!mod)
            dispatch({ type: "set-active-edge-kind", kind: "dependency" })
          break
        case "3":
          if (!mod)
            dispatch({ type: "set-active-edge-kind", kind: "inheritance" })
          break
        case "4":
          if (!mod)
            dispatch({ type: "set-active-edge-kind", kind: "aggregation" })
          break
        case "5":
          if (!mod)
            dispatch({ type: "set-active-edge-kind", kind: "composition" })
          break
        case "6":
          if (!mod)
            dispatch({ type: "set-active-edge-kind", kind: "realization" })
          break
        case "ArrowUp":
        case "ArrowDown":
        case "ArrowLeft":
        case "ArrowRight": {
          if (selection?.kind !== "node") break
          e.preventDefault()
          const nudge = e.shiftKey ? 1 : 10
          const rfNode = getNodes().find((n) => n.id === selection.id)
          if (!rfNode) break
          const dx =
            e.key === "ArrowLeft"
              ? -nudge
              : e.key === "ArrowRight"
                ? nudge
                : 0
          const dy =
            e.key === "ArrowUp"
              ? -nudge
              : e.key === "ArrowDown"
                ? nudge
                : 0
          dispatch({
            type: "move-node",
            id: selection.id,
            position: {
              x: rfNode.position.x + dx,
              y: rfNode.position.y + dy,
            },
          })
          break
        }
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [
    dispatch,
    layout,
    onUndo,
    onRedo,
    selection,
    getViewportCenter,
    getNodes,
    getEdges,
  ])
}
