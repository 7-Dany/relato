"use client"

import { useCallback } from "react"
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  ReactFlowProvider,
  type Node,
  type Edge,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"

import type { DiagramNode, SavedDiagram } from "../../domain"
import { RELATO_EDGE_TYPES } from "../../ui/diagram-edges"
import { RelatoDiagramNode } from "../../ui/diagram-node"
import { ThemeToggle } from "@/components/theme-toggle"

const nodeTypes = {
  relatoNode: RelatoDiagramNode,
}

function ReadOnlyCanvas({
  diagram,
}: {
  diagram: SavedDiagram
}) {
  const { fitView } = useReactFlow()

  const fitViewRef = useCallback(
    (el: HTMLDivElement | null) => {
      if (el) setTimeout(() => fitView({ duration: 200, padding: 0.15 }), 50)
    },
    [fitView]
  )

  const nodes: Node[] = diagram.nodes.map((n) => ({
    id: n.id,
    type: "relatoNode",
    position: n.position,
    data: n,
    draggable: false,
    selectable: false,
    deletable: false,
  }))

  const anchorEdges: Edge[] = diagram.nodes
    .filter((n): n is DiagramNode & { targetNodeId: string } => n.kind === "note" && !!n.targetNodeId)
    .map((n) => ({
      id: `anchor-${n.id}`,
      source: n.id,
      target: n.targetNodeId,
      type: "uml-anchor",
      selectable: false,
      focusable: false,
      data: {},
    }))

  const edges: Edge[] = [
    ...diagram.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle ?? undefined,
      targetHandle: e.targetHandle ?? undefined,
      type: `uml-${e.kind}` as Edge["type"],
      data: e,
      style: {
        stroke: e.color ?? undefined,
        strokeWidth: e.strokeWidth,
      },
      label: e.label || undefined,
      deletable: false,
    })),
    ...anchorEdges,
  ]

  return (
    <div ref={fitViewRef} className="relato-canvas h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={RELATO_EDGE_TYPES}
        fitView
        panOnDrag
        zoomOnScroll
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="var(--border)" gap={20} size={1} />
        <Controls showInteractive={false} />
        <MiniMap
          pannable
          zoomable
          maskColor="color-mix(in oklab, var(--background) 74%, transparent)"
          nodeColor="var(--muted-foreground)"
          nodeStrokeColor="var(--border)"
          nodeBorderRadius={4}
        />
      </ReactFlow>
    </div>
  )
}

export function SharedDiagramView({
  diagram,
}: {
  diagram: SavedDiagram
}) {
  return (
    <ReactFlowProvider>
      <div className="flex h-svh w-full flex-col bg-background text-foreground">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-card px-4 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">
            {diagram.title || "Untitled"}
          </span>
          {diagram.description && (
            <>
              <span className="text-border">·</span>
              <span className="truncate">{diagram.description}</span>
            </>
          )}
          <span className="ml-auto rounded bg-accent px-2 py-0.5 text-xs text-accent-foreground">
            View only
          </span>
          <ThemeToggle />
        </header>
        <div className="min-h-0 flex-1">
          <ReadOnlyCanvas diagram={diagram} />
        </div>
      </div>
    </ReactFlowProvider>
  )
}
