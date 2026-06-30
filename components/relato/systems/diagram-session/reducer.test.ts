import { describe, expect, test } from "bun:test"

import type { DiagramEdgeId, DiagramNodeId, SavedDiagram } from "../../domain"
import {
  applyDiagramCommand,
  nextNodePosition,
  type DiagramSessionState,
} from "./reducer"

function diagram(): SavedDiagram {
  return {
    schemaVersion: 1,
    id: "diagram-1" as SavedDiagram["id"],
    title: "Original",
    description: "",
    nodes: [],
    edges: [],
    createdAt: "2026-05-24T00:00:00.000Z",
    updatedAt: "2026-05-24T00:00:00.000Z",
  }
}

describe("applyDiagramCommand", () => {
  test("renames a diagram without exposing UI state", () => {
    const state: DiagramSessionState = {
      diagram: diagram(),
      selection: null,
      activeEdgeKind: "association",
      dirty: false,
    }

    const result = applyDiagramCommand(state, {
      type: "rename-diagram",
      title: "Architecture",
    })

    expect(result.diagram.title).toBe("Architecture")
    expect(result.changed).toBe(true)
  })

  test("connects nodes through the selected source and target handles", () => {
    const state: DiagramSessionState = {
      diagram: diagram(),
      selection: null,
      activeEdgeKind: "association",
      dirty: false,
    }

    const result = applyDiagramCommand(state, {
      type: "connect-nodes",
      edge: {
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
    })

    expect(result.diagram.edges[0]?.sourceHandle).toBe("right")
    expect(result.diagram.edges[0]?.targetHandle).toBe("target-left")
    expect(result.selection).toEqual({ kind: "edge", id: "edge-1" as DiagramEdgeId })
  })

  test("duplicates note nodes because the context menu offers duplicate for every node", () => {
    const state: DiagramSessionState = {
      diagram: {
        ...diagram(),
        nodes: [
          {
            id: "note-1" as never,
            kind: "note",
            position: { x: 10, y: 20 },
            number: 1,
            title: "Explain",
            body: "Existing note",
            targetNodeId: null,
          },
        ],
      },
      selection: { kind: "node", id: "note-1" as never },
      activeEdgeKind: "association",
      dirty: false,
    }

    const result = applyDiagramCommand(state, {
      type: "duplicate-node",
      id: "note-1" as never,
    })

    expect(result.diagram.nodes.length).toBe(2)
    expect(result.diagram.nodes[1]?.kind).toBe("note")
    expect(
      result.diagram.nodes[1]?.kind === "note"
        ? result.diagram.nodes[1].number
        : null
    ).toBe(2)
    expect(result.diagram.nodes[1]?.position).toEqual({ x: 50, y: 60 })
    expect(result.selection?.kind).toBe("node")
    expect(result.selection?.id).toBe(result.diagram.nodes[1]?.id)
  })

  test("inserts a template into the current diagram without replacing existing work", () => {
    const state: DiagramSessionState = {
      diagram: {
        ...diagram(),
        nodes: [
          {
            id: "existing" as never,
            kind: "class",
            position: { x: 0, y: 0 },
            name: "Existing",
            stereotype: null,
            role: "",
            summary: "",
            files: [],
            reviewNotes: "",
            fields: [],
            methods: [],
            color: null,
          },
        ],
      },
      selection: null,
      activeEdgeKind: "association",
      dirty: false,
    }

    const result = applyDiagramCommand(state, {
      type: "insert-diagram-template",
      diagram: {
        ...diagram(),
        nodes: [
          {
            id: "template-a" as never,
            kind: "class",
            position: { x: 10, y: 20 },
            name: "TemplateA",
            stereotype: null,
            role: "",
            summary: "",
            files: [],
            reviewNotes: "",
            fields: [],
            methods: [],
            color: null,
          },
          {
            id: "template-b" as never,
            kind: "class",
            position: { x: 180, y: 20 },
            name: "TemplateB",
            stereotype: null,
            role: "",
            summary: "",
            files: [],
            reviewNotes: "",
            fields: [],
            methods: [],
            color: null,
          },
        ],
        edges: [
          {
            id: "template-edge" as never,
            source: "template-a" as never,
            target: "template-b" as never,
            sourceHandle: "right",
            targetHandle: "target-left",
            kind: "dependency",
            label: "uses",
            sourceLabel: "",
            targetLabel: "",
            color: null,
            strokeWidth: 2,
            curvature: 0,
          },
        ],
      },
    })

    expect(result.diagram.nodes.length).toBe(3)
    expect(result.diagram.nodes[0]?.id).toBe("existing" as DiagramNodeId)
    expect(result.diagram.edges.length).toBe(1)
    expect(result.diagram.edges[0]?.source === ("template-a" as never)).toBe(
      false
    )
    expect(result.diagram.edges[0]?.target === ("template-b" as never)).toBe(
      false
    )
    expect(result.diagram.edges[0]?.sourceHandle).toBe("right")
    expect(result.diagram.edges[0]?.targetHandle).toBe("target-left")
  })

  test("move-node updates a single node position and marks changed", () => {
    const state: DiagramSessionState = {
      diagram: {
        ...diagram(),
        nodes: [
          {
            id: "a" as never,
            kind: "class",
            position: { x: 100, y: 200 },
            name: "A",
            stereotype: null,
            role: "",
            summary: "",
            files: [],
            reviewNotes: "",
            fields: [],
            methods: [],
            color: null,
          },
        ],
      },
      selection: null,
      activeEdgeKind: "association",
      dirty: false,
    }

    const result = applyDiagramCommand(state, {
      type: "move-node",
      id: "a" as never,
      position: { x: 150, y: 250 },
    })

    expect(result.diagram.nodes[0]?.position).toEqual({ x: 150, y: 250 })
    expect(result.changed).toBe(true)
  })

  test("layout-diagram moves multiple nodes at once", () => {
    const state: DiagramSessionState = {
      diagram: {
        ...diagram(),
        nodes: [
          {
            id: "a" as never,
            kind: "class",
            position: { x: 100, y: 200 },
            name: "A",
            stereotype: null,
            role: "",
            summary: "",
            files: [],
            reviewNotes: "",
            fields: [],
            methods: [],
            color: null,
          },
          {
            id: "b" as never,
            kind: "class",
            position: { x: 300, y: 400 },
            name: "B",
            stereotype: null,
            role: "",
            summary: "",
            files: [],
            reviewNotes: "",
            fields: [],
            methods: [],
            color: null,
          },
          {
            id: "c" as never,
            kind: "class",
            position: { x: 500, y: 600 },
            name: "C",
            stereotype: null,
            role: "",
            summary: "",
            files: [],
            reviewNotes: "",
            fields: [],
            methods: [],
            color: null,
          },
        ],
      },
      selection: null,
      activeEdgeKind: "association",
      dirty: false,
    }

    const result = applyDiagramCommand(state, {
      type: "layout-diagram",
      positions: [
        { id: "a" as never, position: { x: 50, y: 60 } },
        { id: "b" as never, position: { x: 350, y: 460 } },
      ],
    })

    // updated nodes get new positions
    expect(result.diagram.nodes[0]?.position).toEqual({ x: 50, y: 60 })
    expect(result.diagram.nodes[1]?.position).toEqual({ x: 350, y: 460 })
    // unmentioned node stays unchanged
    expect(result.diagram.nodes[2]?.position).toEqual({ x: 500, y: 600 })
    expect(result.changed).toBe(true)
  })

  test("nextNodePosition tiles nodes in a 4-column grid", () => {
    expect(nextNodePosition(0)).toEqual({ x: 80, y: 80 })
    expect(nextNodePosition(1)).toEqual({ x: 200, y: 80 })
    expect(nextNodePosition(2)).toEqual({ x: 320, y: 80 })
    expect(nextNodePosition(3)).toEqual({ x: 440, y: 80 })
    expect(nextNodePosition(4)).toEqual({ x: 80, y: 160 })
    expect(nextNodePosition(5)).toEqual({ x: 200, y: 160 })
  })

  test("nextNodePosition with custom origin offsets from that point", () => {
    const origin = { x: 500, y: 600 }
    expect(nextNodePosition(0, origin)).toEqual({ x: 500, y: 600 })
    expect(nextNodePosition(1, origin)).toEqual({ x: 620, y: 600 })
    expect(nextNodePosition(4, origin)).toEqual({ x: 500, y: 680 })
  })

  test("add-class-node with position creates a node at that position regardless of other nodes", () => {
    const state: DiagramSessionState = {
      diagram: {
        ...diagram(),
        nodes: [
          {
            id: "existing" as never,
            kind: "class",
            position: { x: 0, y: 0 },
            name: "Existing",
            stereotype: null,
            role: "",
            summary: "",
            files: [],
            reviewNotes: "",
            fields: [],
            methods: [],
            color: null,
          },
        ],
      },
      selection: null,
      activeEdgeKind: "association",
      dirty: false,
    }

    const result = applyDiagramCommand(state, {
      type: "add-class-node",
      position: { x: 999, y: 888 },
    })

    const newNode = result.diagram.nodes.find((n) => n.id !== ("existing" as never))
    expect(newNode?.position).toEqual({ x: 999, y: 888 })
  })

  test("delete-multiple removes multiple nodes and their connected edges", () => {
    const state: DiagramSessionState = {
      diagram: {
        ...diagram(),
        nodes: [
          {
            id: "a" as never,
            kind: "class",
            position: { x: 0, y: 0 },
            name: "A",
            stereotype: null,
            role: "",
            summary: "",
            files: [],
            reviewNotes: "",
            fields: [],
            methods: [],
            color: null,
          },
          {
            id: "b" as never,
            kind: "class",
            position: { x: 200, y: 0 },
            name: "B",
            stereotype: null,
            role: "",
            summary: "",
            files: [],
            reviewNotes: "",
            fields: [],
            methods: [],
            color: null,
          },
          {
            id: "c" as never,
            kind: "class",
            position: { x: 400, y: 0 },
            name: "C",
            stereotype: null,
            role: "",
            summary: "",
            files: [],
            reviewNotes: "",
            fields: [],
            methods: [],
            color: null,
          },
        ],
        edges: [
          {
            id: "ab" as never,
            source: "a" as never,
            target: "b" as never,
            kind: "association",
            label: "",
            sourceLabel: "",
            targetLabel: "",
            color: null,
            strokeWidth: 2,
            curvature: 0,
          },
          {
            id: "bc" as never,
            source: "b" as never,
            target: "c" as never,
            kind: "dependency",
            label: "",
            sourceLabel: "",
            targetLabel: "",
            color: null,
            strokeWidth: 2,
            curvature: 0,
          },
        ],
      },
      selection: null,
      activeEdgeKind: "association",
      dirty: false,
    }

    const result = applyDiagramCommand(state, {
      type: "delete-multiple",
      nodeIds: ["a" as never, "c" as never],
      edgeIds: [],
    })

    expect(result.diagram.nodes.length).toBe(1)
    expect(result.diagram.nodes[0]?.id).toBe("b" as DiagramNodeId)
    // Edge "ab" removed (connected to deleted node "a")
    // Edge "bc" removed (connected to deleted node "c")
    expect(result.diagram.edges.length).toBe(0)
    expect(result.changed).toBe(true)
  })

  test("delete-multiple removes selected edges without removing other edges", () => {
    const state: DiagramSessionState = {
      diagram: {
        ...diagram(),
        nodes: [
          {
            id: "a" as never,
            kind: "class",
            position: { x: 0, y: 0 },
            name: "A",
            stereotype: null,
            role: "",
            summary: "",
            files: [],
            reviewNotes: "",
            fields: [],
            methods: [],
            color: null,
          },
          {
            id: "b" as never,
            kind: "class",
            position: { x: 200, y: 0 },
            name: "B",
            stereotype: null,
            role: "",
            summary: "",
            files: [],
            reviewNotes: "",
            fields: [],
            methods: [],
            color: null,
          },
        ],
        edges: [
          {
            id: "ab" as never,
            source: "a" as never,
            target: "b" as never,
            kind: "association",
            label: "",
            sourceLabel: "",
            targetLabel: "",
            color: null,
            strokeWidth: 2,
            curvature: 0,
          },
          {
            id: "extra" as never,
            source: "a" as never,
            target: "b" as never,
            kind: "dependency",
            label: "",
            sourceLabel: "",
            targetLabel: "",
            color: null,
            strokeWidth: 2,
            curvature: 0,
          },
        ],
      },
      selection: null,
      activeEdgeKind: "association",
      dirty: false,
    }

    const result = applyDiagramCommand(state, {
      type: "delete-multiple",
      nodeIds: [],
      edgeIds: ["ab" as never],
    })

    expect(result.diagram.edges.length).toBe(1)
    expect(result.diagram.edges[0]?.id).toBe("extra" as DiagramEdgeId)
    expect(result.changed).toBe(true)
  })

  test("delete-multiple re-numbers remaining notes", () => {
    const state: DiagramSessionState = {
      diagram: {
        ...diagram(),
        nodes: [
          {
            id: "n1" as never,
            kind: "note",
            position: { x: 0, y: 0 },
            number: 1,
            title: "First",
            body: "",
            targetNodeId: null,
          },
          {
            id: "n2" as never,
            kind: "note",
            position: { x: 200, y: 0 },
            number: 2,
            title: "Second",
            body: "",
            targetNodeId: null,
          },
          {
            id: "n3" as never,
            kind: "note",
            position: { x: 400, y: 0 },
            number: 3,
            title: "Third",
            body: "",
            targetNodeId: null,
          },
        ],
      },
      selection: null,
      activeEdgeKind: "association",
      dirty: false,
    }

    const result = applyDiagramCommand(state, {
      type: "delete-multiple",
      nodeIds: ["n2" as never],
      edgeIds: [],
    })

    expect(result.diagram.nodes.length).toBe(2)
    const remaining = result.diagram.nodes as Extract<
      typeof result.diagram.nodes[number],
      { kind: "note" }
    >[]
    expect(remaining[0]?.number).toBe(1)
    expect(remaining[1]?.number).toBe(2)
  })

  test("delete-multiple with empty arrays returns unchanged", () => {
    const state: DiagramSessionState = {
      diagram: diagram(),
      selection: null,
      activeEdgeKind: "association",
      dirty: false,
    }

    const result = applyDiagramCommand(state, {
      type: "delete-multiple",
      nodeIds: [],
      edgeIds: [],
    })

    expect(result.changed).toBe(true)
    expect(result.diagram.nodes.length).toBe(0)
  })

  test("structural commands bump updatedAt", () => {
    const state: DiagramSessionState = {
      diagram: diagram(),
      selection: null,
      activeEdgeKind: "association",
      dirty: false,
    }

    const result = applyDiagramCommand(state, {
      type: "add-class-node",
      position: { x: 100, y: 100 },
    })

    expect(result.diagram.updatedAt > state.diagram.updatedAt).toBe(true)
    expect(result.changed).toBe(true)
  })

  test("cosmetic commands (select) preserve updatedAt", () => {
    const state: DiagramSessionState = {
      diagram: diagram(),
      selection: null,
      activeEdgeKind: "association",
      dirty: false,
    }

    const result = applyDiagramCommand(state, {
      type: "select",
      selection: { kind: "node", id: "any" as never },
    })

    expect(result.diagram.updatedAt).toBe(state.diagram.updatedAt)
    expect(result.changed).toBe(false)
  })

  test("cosmetic commands (update-edge) preserve updatedAt", () => {
    const state: DiagramSessionState = {
      diagram: {
        ...diagram(),
        edges: [
          {
            id: "e1" as never,
            source: "a" as never,
            target: "b" as never,
            kind: "association",
            label: "",
            sourceLabel: "",
            targetLabel: "",
            color: null,
            strokeWidth: 2,
            curvature: 0,
          },
        ],
      },
      selection: null,
      activeEdgeKind: "association",
      dirty: false,
    }
    const originalUpdatedAt = state.diagram.updatedAt

    const result = applyDiagramCommand(state, {
      type: "update-edge",
      id: "e1" as never,
      patch: { strokeWidth: 4 },
    })

    expect(result.diagram.updatedAt).toBe(originalUpdatedAt)
    expect(result.diagram.edges[0]?.strokeWidth).toBe(4)
  })

  test("connect-nodes with composition kind creates a composition edge", () => {
    const state: DiagramSessionState = {
      diagram: {
        ...diagram(),
        nodes: [
          {
            id: "a" as never,
            kind: "class",
            position: { x: 0, y: 0 },
            name: "A",
            stereotype: null,
            role: "",
            summary: "",
            files: [],
            reviewNotes: "",
            fields: [],
            methods: [],
            color: null,
          },
          {
            id: "b" as never,
            kind: "class",
            position: { x: 200, y: 0 },
            name: "B",
            stereotype: null,
            role: "",
            summary: "",
            files: [],
            reviewNotes: "",
            fields: [],
            methods: [],
            color: null,
          },
        ],
      },
      selection: null,
      activeEdgeKind: "association",
      dirty: false,
    }

    const result = applyDiagramCommand(state, {
      type: "connect-nodes",
      edge: {
        id: "e1" as never,
        source: "a" as never,
        target: "b" as never,
        kind: "composition",
        label: "",
        sourceLabel: "",
        targetLabel: "",
        color: null,
        strokeWidth: 2,
        curvature: 0,
      },
    })

    expect(result.diagram.edges[0]?.kind).toBe("composition")
    expect(result.diagram.edges[0]?.id).toBe("e1" as DiagramEdgeId)
    expect(result.changed).toBe(true)
  })

  test("connect-nodes with realization kind creates a realization edge", () => {
    const state: DiagramSessionState = {
      diagram: {
        ...diagram(),
        nodes: [
          {
            id: "a" as never,
            kind: "class",
            position: { x: 0, y: 0 },
            name: "A",
            stereotype: null,
            role: "",
            summary: "",
            files: [],
            reviewNotes: "",
            fields: [],
            methods: [],
            color: null,
          },
          {
            id: "b" as never,
            kind: "class",
            position: { x: 200, y: 0 },
            name: "B",
            stereotype: null,
            role: "",
            summary: "",
            files: [],
            reviewNotes: "",
            fields: [],
            methods: [],
            color: null,
          },
        ],
      },
      selection: null,
      activeEdgeKind: "association",
      dirty: false,
    }

    const result = applyDiagramCommand(state, {
      type: "connect-nodes",
      edge: {
        id: "e1" as never,
        source: "a" as never,
        target: "b" as never,
        kind: "realization",
        label: "",
        sourceLabel: "",
        targetLabel: "",
        color: null,
        strokeWidth: 2,
        curvature: 0,
      },
    })

    expect(result.diagram.edges[0]?.kind).toBe("realization")
    expect(result.diagram.edges[0]?.id).toBe("e1" as DiagramEdgeId)
    expect(result.changed).toBe(true)
  })
})
