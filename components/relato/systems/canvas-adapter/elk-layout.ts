"use client"

import { useCallback, useRef } from "react"
import type { Edge, Node } from "@xyflow/react"
import ELK from "elkjs/lib/elk.bundled.js"

import type { DiagramNodeId, DiagramPoint, SavedDiagram } from "../../domain"

// ─── Size estimation ──────────────────────────────────────────────────────────

const BASE_W = 220
const H_PAD = 48
const NAME_CHAR = 9.0
const MONO_CHAR = 7.2
const LINE_H = 18
const SEC_PAD_Y = 16
const HEADER_H = 56
const EXTRA_H = 18
const SEC_MIN_H = 32
const FOOTER_H = 34

interface NodeSizeData {
  name?: string
  stereotype?: string | null
  role?: string
  fields?: string[]
  methods?: string[]
  files?: string[]
}

function estimateNodeSize(data: NodeSizeData): { width: number; height: number } {
  const name = data.name ?? ""
  const fields = (data.fields ?? []).filter(Boolean)
  const methods = (data.methods ?? []).filter(Boolean)

  const nameW = name.length * NAME_CHAR + H_PAD
  const stereoW = data.stereotype === "interface" ? 11 * MONO_CHAR + H_PAD : 0
  const fieldW =
    fields.length > 0
      ? Math.max(...fields.map((f) => f.length * MONO_CHAR)) + H_PAD
      : 0
  const methodW =
    methods.length > 0
      ? Math.max(...methods.map((m) => m.length * MONO_CHAR)) + H_PAD
      : 0
  const width = Math.max(BASE_W, nameW, stereoW, fieldW, methodW)

  let headerH = HEADER_H
  if (data.stereotype) headerH += EXTRA_H
  if (data.role) headerH += EXTRA_H

  const fieldsH = Math.max(SEC_MIN_H, fields.length * LINE_H + SEC_PAD_Y) + 1
  const methodsH = Math.max(SEC_MIN_H, methods.length * LINE_H + SEC_PAD_Y)
  const footerH = (data.files ?? []).filter(Boolean).length > 0 ? FOOTER_H : 0

  return { width, height: headerH + fieldsH + methodsH + footerH }
}

// ─── ELK layout options ───────────────────────────────────────────────────────

const DEFAULT_ELK_OPTIONS: Record<string, string> = {
  "elk.algorithm": "layered",
  "elk.direction": "DOWN",
  "elk.layered.spacing.nodeNodeBetweenLayers": "100",
  "elk.spacing.nodeNode": "60",
  "elk.spacing.edgeNode": "30",
  "elk.spacing.edgeEdge": "20",
  "elk.spacing.componentComponent": "80",
  "elk.layered.layering.strategy": "NETWORK_SIMPLEX",
  "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
  "elk.layered.crossingMinimization.greedySwitch.type": "TWO_SIDED",
  "elk.layered.nodePlacement.strategy": "BRANDES_KOEPF",
  "elk.layered.nodePlacement.bk.fixedAlignment": "BALANCED",
  "elk.layered.compaction.postCompaction.strategy": "EDGE_LENGTH",
  "elk.layered.unnecessaryBendpoints": "true",
  "elk.layered.thoroughness": "7",
  "elk.separateConnectedComponents": "true",
  "elk.edgeRouting": "ORTHOGONAL",
  "elk.hierarchyHandling": "INCLUDE_CHILDREN",
}

// ─── Pure ELK computation ─────────────────────────────────────────────────────

async function computeELKPositions(
  elk: InstanceType<typeof ELK>,
  nodes: Node[],
  edges: Edge[],
  direction: "TB" | "LR"
): Promise<Map<string, DiagramPoint>> {
  // Only layout class nodes; notes/anchors are excluded
  const classNodes = nodes.filter(
    (n) => n.type !== "relatoNote" && n.type === "relatoNode" &&
    (n.data as { kind?: string }).kind === "class"
  )

  if (classNodes.length === 0) return new Map()

  // Only route inheritance/aggregation edges through ELK (hierarchy-revealing)
  const hierarchyEdges = edges.filter(
    (e) =>
      (e.type === "uml-inheritance" || e.type === "uml-aggregation") &&
      classNodes.some((n) => n.id === e.source) &&
      classNodes.some((n) => n.id === e.target)
  )

  const elkEdges = hierarchyEdges.map((edge) => {
    const isInheritance = edge.type === "uml-inheritance"
    return {
      id: edge.id,
      // Reverse inheritance/aggregation so parent nodes appear above children
      sources: [isInheritance ? edge.target : edge.source],
      targets: [isInheritance ? edge.source : edge.target],
    }
  })

  const graph = {
    id: "root",
    layoutOptions: {
      ...DEFAULT_ELK_OPTIONS,
      "elk.direction": direction === "LR" ? "RIGHT" : "DOWN",
    },
    children: classNodes.map((n) => {
      const size = estimateNodeSize((n.data as NodeSizeData) ?? {})
      return { id: n.id, width: size.width, height: size.height }
    }),
    edges: elkEdges,
  }

  const layouted = await elk.layout(graph)

  return new Map(
    (layouted.children ?? []).map(
      (n: { id: string; x?: number; y?: number }) => [
        n.id,
        { x: n.x ?? 0, y: n.y ?? 0 },
      ]
    )
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UseELKLayoutResult {
  layout: (
    nodes: Node[],
    edges: Edge[],
    direction?: "TB" | "LR"
  ) => Promise<ReadonlyArray<{ id: DiagramNodeId; position: DiagramPoint }>>
}

/**
 * Computes ELK hierarchical layout for a diagram. Returns positioned entries
 * that callers can dispatch as a `layout-diagram` command.
 *
 * The hook is stable across renders (ELK instance reused, callback memoized).
 */
export function useELKLayout(): UseELKLayoutResult {
  const elkRef = useRef<InstanceType<typeof ELK> | null>(null)

  function getELK() {
    if (!elkRef.current) {
      elkRef.current = new ELK()
    }
    return elkRef.current
  }

  const layout = useCallback(
    async (
      nodes: Node[],
      edges: Edge[],
      direction: "TB" | "LR" = "TB"
    ): Promise<ReadonlyArray<{ id: DiagramNodeId; position: DiagramPoint }>> => {
      const posMap = await computeELKPositions(getELK(), nodes, edges, direction)
      return Array.from(posMap.entries()).map(([id, position]) => ({
        id: id as DiagramNodeId,
        position,
      }))
    },
    []
  )

  return { layout }
}

/**
 * Pre-computes ELK positions for a SavedDiagram before first render.
 * Used by RelatoBuilder to avoid the raw-positions → ELK double-render flash.
 *
 * This is a standalone async function (not a hook) so it can be called from
 * useEffect or top-level async code outside React.
 */
export async function computeDiagramLayout(
  diagram: SavedDiagram,
  direction: "TB" | "LR" = "TB"
): Promise<Map<string, DiagramPoint>> {
  const elk = new ELK()

  const rfNodes: Node[] = diagram.nodes
    .filter((n) => n.kind === "class")
    .map((n) => ({ id: n.id, type: "relatoNode", position: n.position, data: n }))

  const rfEdges: Edge[] = diagram.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    type: `uml-${e.kind}`,
    data: e,
  }))

  return computeELKPositions(elk, rfNodes, rfEdges, direction)
}
