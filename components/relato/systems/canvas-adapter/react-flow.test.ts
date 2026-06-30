import { describe, expect, test } from "bun:test"

import type { SavedDiagram } from "../../domain"
import { toReactFlowEdges, toReactFlowNodes } from "./react-flow"

describe("React Flow adapter", () => {
  test("keeps React Flow mapping outside persisted diagrams", () => {
    const diagram: SavedDiagram = {
      schemaVersion: 1,
      id: "diagram-1" as SavedDiagram["id"],
      title: "System",
      description: "",
      nodes: [],
      edges: [],
      createdAt: "2026-05-24T00:00:00.000Z",
      updatedAt: "2026-05-24T00:00:00.000Z",
    }

    expect(toReactFlowNodes(diagram)).toEqual([])
    expect(toReactFlowEdges(diagram)).toEqual([])
  })

  test("preserves selected source and target handles for four-direction connections", () => {
    const diagram: SavedDiagram = {
      schemaVersion: 1,
      id: "diagram-1" as SavedDiagram["id"],
      title: "System",
      description: "",
      nodes: [],
      edges: [
        {
          id: "edge-1" as never,
          source: "node-a" as never,
          target: "node-b" as never,
          sourceHandle: "right",
          targetHandle: "target-left",
          kind: "association",
          label: "",
          sourceLabel: "",
          targetLabel: "",
          color: null,
          strokeWidth: 2,
          curvature: 0,
        },
      ],
      createdAt: "2026-05-24T00:00:00.000Z",
      updatedAt: "2026-05-24T00:00:00.000Z",
    }

    expect(toReactFlowEdges(diagram)[0]).toEqual({
      id: "edge-1",
      source: "node-a",
      target: "node-b",
      sourceHandle: "right",
      targetHandle: "target-left",
      type: "uml-association",
      data: { ...diagram.edges[0] },
    })
  })
})
