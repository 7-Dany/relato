"use client"

import { memo, useCallback, useEffect, useMemo, useState } from "react"
import type { DiagramEdge } from "../../domain"
import {
  Background,
  ControlButton,
  Controls,
  MiniMap,
  ReactFlow,
  useReactFlow,
  type NodeTypes,
  type Edge,
  type Node,
  type OnConnect,
  type OnSelectionChangeParams,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"

import {
  useELKLayout,
  useSyncedReactFlowDiagram,
} from "../../systems/canvas-adapter"
import type { DiagramEdgeId, DiagramNodeId, DiagramPoint } from "../../domain"
import { RelatoDiagramNode } from "../../ui/diagram-node"
import { RELATO_EDGE_TYPES } from "../../ui/diagram-edges"
import { CanvasActionsContext } from "./canvas-actions-context"
import { CommandToolbar } from "./command-toolbar"
import {
  DiagramContextMenu,
  type ContextMenuState,
} from "./diagram-context-menu"
import type { WorkbenchProps } from "./types"
import { useDiagramKeyboardShortcuts } from "./use-diagram-keyboard-shortcuts"

const nodeTypes: NodeTypes = {
  relatoNode: RelatoDiagramNode,
}

/**
 * CanvasPane:
 *   1. Bridges domain <-> React Flow state via useSyncedReactFlowDiagram
 *   2. Computes ELK layout and dispatches layout-diagram
 *   3. Provides CanvasActionsContext — CommandToolbar is rendered INSIDE
 *      this provider so it can call useCanvasActions() safely
 *   4. Registers global keyboard shortcuts (skipped when focus is in an input)
 */
export const CanvasPane = memo(function CanvasPane(props: WorkbenchProps) {
  const { session, dispatch, onUndo, onRedo } = props
  const { getNodes, getEdges, fitView, screenToFlowPosition } = useReactFlow()
  const { layout: computeLayout } = useELKLayout()

  // Domain -> React Flow sync (merge strategy preserves selection/dragging)
  const { nodes, edges, onNodesChange, onEdgesChange } =
    useSyncedReactFlowDiagram(session.diagram)
  const [showMinimap, setShowMinimap] = useState(true)
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)

  useEffect(() => {
    if (session.diagram.nodes.length === 0) return
    const frame = window.setTimeout(
      () => fitView({ duration: 300, padding: 0.18 }),
      80
    )
    return () => window.clearTimeout(frame)
    // Only fit view on diagram load, not on every node addition
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.diagram.id])

  // ─── React Flow event handlers ────────────────────────────────────────────

  const onNodeContextMenu = useCallback((e: React.MouseEvent, node: Node) => {
    e.preventDefault()
    const data = node.data as { color?: string | null }
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      target: { kind: "node", nodeId: node.id, nodeColor: data.color ?? null },
    })
  }, [])

  const onEdgeContextMenu = useCallback((e: React.MouseEvent, edge: Edge) => {
    e.preventDefault()
    const d = (edge.data ?? {}) as Partial<DiagramEdge>
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      target: {
        kind: "edge",
        edgeId: edge.id,
        edgeKind: d.kind ?? "association",
        edgeColor: d.color ?? null,
        edgeStrokeWidth: d.strokeWidth ?? 2,
      },
    })
  }, [])

  const onConnect: OnConnect = useCallback(
    (connection) => {
      if (!connection.source || !connection.target) return
      dispatch({
        type: "connect-nodes",
        edge: {
          source: connection.source as DiagramNodeId,
          target: connection.target as DiagramNodeId,
          sourceHandle: connection.sourceHandle,
          targetHandle: connection.targetHandle,
          kind: session.activeEdgeKind,
          label: "",
          sourceLabel: "",
          targetLabel: "",
          color: null,
          strokeWidth: 2,
          curvature: 0,
        },
      })
    },
    [dispatch, session.activeEdgeKind]
  )

  const onSelectionChange = useCallback(
    ({ nodes, edges }: OnSelectionChangeParams) => {
      const node = nodes.at(-1)
      if (node) {
        dispatch({
          type: "select",
          selection: { kind: "node", id: node.id as DiagramNodeId },
        })
        return
      }
      const edge = edges.at(-1)
      dispatch({
        type: "select",
        selection: edge ? { kind: "edge", id: edge.id as DiagramEdgeId } : null,
      })
    },
    [dispatch]
  )

  const getViewportCenter = useCallback((): DiagramPoint => {
    const el = document.querySelector<HTMLElement>(".react-flow__renderer")
    if (!el) return { x: 80, y: 80 }
    const rect = el.getBoundingClientRect()
    return screenToFlowPosition({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    })
  }, [screenToFlowPosition])

  // ─── Canvas actions ───────────────────────────────────────────────────────

  const layout = useCallback(
    async (direction: "TB" | "LR" = "TB") => {
      const positions = await computeLayout(getNodes(), getEdges(), direction)
      if (positions.length === 0) return
      dispatch({ type: "layout-diagram", positions })
      setTimeout(() => fitView({ duration: 400, padding: 0.12 }), 80)
    },
    [computeLayout, dispatch, fitView, getEdges, getNodes]
  )

  const exportJson = useCallback(() => {
    const json = JSON.stringify(session.diagram, null, 2)
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `${session.diagram.title || "diagram"}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }, [session.diagram])

  const exportPng = useCallback(async () => {
    const viewport = document.querySelector<HTMLElement>(
      ".react-flow__renderer"
    )
    if (!viewport) return
    try {
      const { toPng } = await import("html-to-image")
      // Resolve the actual painted background color so the export matches
      // whichever theme (light/dark) is active when the export is taken.
      const background = getComputedStyle(
        document.documentElement
      ).getPropertyValue("--background")
      const dataUrl = await toPng(viewport, {
        pixelRatio: 2,
        backgroundColor: background ? `oklch(${background})` : undefined,
      })

      const anchor = document.createElement("a")
      anchor.href = dataUrl
      anchor.download = `${session.diagram.title || "diagram"}.png`
      anchor.click()
    } catch (err) {
      console.error("[Relato] PNG export failed:", err)
    }
  }, [session.diagram.title])

  // ─── Keyboard shortcuts ───────────────────────────────────────────────────

  useDiagramKeyboardShortcuts({
    dispatch,
    selection: session.selection,
    getViewportCenter,
    getNodes,
    getEdges,
    layout,
    onUndo,
    onRedo,
  })

  // ─── Canvas actions context value ─────────────────────────────────────────

  const canvasActions = useMemo(
    () => ({ layout, exportPng, exportJson, viewportCenter: getViewportCenter }),
    [exportJson, exportPng, layout, getViewportCenter]
  )

  const isEmpty = session.diagram.nodes.length === 0

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <CanvasActionsContext.Provider value={canvasActions}>
      <div
        className="relato-canvas relative h-full min-h-0"
        aria-label="Diagram canvas"
      >
        {isEmpty && (
          <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 text-center">
            <span className="font-mono text-5xl text-muted-foreground/30 select-none">
              ∅
            </span>
            <p className="font-mono text-sm text-muted-foreground/60">
              Press{" "}
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                N
              </kbd>{" "}
              to add a class
            </p>
          </div>
        )}

        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={RELATO_EDGE_TYPES}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onSelectionChange={onSelectionChange}
          onNodeDragStop={(_, _node, nodes) => {
            for (const n of nodes) {
              dispatch({
                type: "move-node",
                id: n.id as DiagramNodeId,
                position: n.position,
              })
            }
          }}
          fitView
          proOptions={{ hideAttribution: true }}
          onNodeContextMenu={onNodeContextMenu}
          onEdgeContextMenu={onEdgeContextMenu}
          onPaneClick={() => {
            setContextMenu(null)
            dispatch({ type: "select", selection: null })
          }}
        >
          <Background color="var(--border)" gap={20} size={1} />
          <Controls>
            <ControlButton
              title={showMinimap ? "Hide minimap" : "Show minimap"}
              onClick={() => setShowMinimap((v) => !v)}
              className={showMinimap ? "rf-control-button--active" : ""}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
                <rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
                <rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
                <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </ControlButton>
          </Controls>
          {showMinimap && (
            <MiniMap
              pannable
              zoomable
              maskColor="color-mix(in oklab, var(--background) 74%, transparent)"
              nodeColor="var(--muted-foreground)"
              nodeStrokeColor="var(--border)"
              nodeBorderRadius={4}
            />
          )}
        </ReactFlow>

        <DiagramContextMenu
          state={contextMenu}
          onClose={() => setContextMenu(null)}
          dispatch={dispatch}
        />

        {/* CommandToolbar lives inside the CanvasActionsContext.Provider */}
        <CommandToolbar {...props} />

      </div>
    </CanvasActionsContext.Provider>
  )
})
