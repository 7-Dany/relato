import type { Edge, Node } from "@xyflow/react"

import type { DiagramEdge, DiagramNode, SavedDiagram } from "../../domain"

// ─── Domain → React Flow ──────────────────────────────────────────────────────

export function toReactFlowNodes(
  diagram: SavedDiagram,
): Node[] {
  return diagram.nodes.map((node) => ({
    id: node.id,
    type: "relatoNode",
    position: node.position,
    data: { ...node },
  }))
}

export function toReactFlowEdges(
  diagram: SavedDiagram,
): Edge[] {
  const anchorEdges: Edge[] = diagram.nodes
    .filter((n) => n.kind === "note" && n.targetNodeId)
    .map((n) => {
      const note = n as Extract<DiagramNode, { kind: "note" }>
      return {
        id: `anchor-${note.id}`,
        source: note.id,
        target: note.targetNodeId!,
        type: "uml-anchor",
        selectable: false,
        focusable: false,
        data: {},
      }
    })

  const domainEdges: Edge[] = diagram.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle,
    type: `uml-${edge.kind}` as Edge["type"],
    data: { ...edge },
  }))

  return [...domainEdges, ...anchorEdges]
}

// ─── React Flow → Domain ──────────────────────────────────────────────────────

export function fromReactFlowNode(node: Node): DiagramNode {
  return node.data as DiagramNode
}

export function fromReactFlowEdge(edge: Edge): DiagramEdge {
  return edge.data as DiagramEdge
}
