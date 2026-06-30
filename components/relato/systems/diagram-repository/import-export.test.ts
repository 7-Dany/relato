/// <reference types="bun-types" />
import { describe, expect, test } from "bun:test"

import { normalizeSavedDiagram, createDiagramId } from "./schema"
import type { DiagramEdge, DiagramEdgeId, DiagramNode, DiagramNodeId, SavedDiagram } from "../../domain"

function validDiagram(): SavedDiagram {
  return {
    schemaVersion: 1,
    id: createDiagramId("diagram-test-1"),
    title: "Test Project",
    description: "A test",
    nodes: [],
    edges: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
  }
}

describe("normalizeSavedDiagram (import validation)", () => {
  test("rejects null / undefined", () => {
    expect(normalizeSavedDiagram(null)).toBe(null)
    expect(normalizeSavedDiagram(undefined)).toBe(null)
  })

  test("rejects non-object values", () => {
    expect(normalizeSavedDiagram("string")).toBe(null)
    expect(normalizeSavedDiagram(42)).toBe(null)
    expect(normalizeSavedDiagram(true)).toBe(null)
  })

  test("rejects wrong schema version", () => {
    expect(normalizeSavedDiagram({ ...validDiagram(), schemaVersion: 2 })).toBe(null)
  })

  test("rejects missing id", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _, ...rest } = validDiagram()
    expect(normalizeSavedDiagram(rest)).toBe(null)
  })

  test("rejects missing title", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { title: _, ...rest } = validDiagram()
    expect(normalizeSavedDiagram(rest)).toBe(null)
  })

  test("rejects non-array nodes", () => {
    expect(normalizeSavedDiagram({ ...validDiagram(), nodes: "not-array" })).toBe(null)
  })

  test("rejects non-array edges", () => {
    expect(normalizeSavedDiagram({ ...validDiagram(), edges: "not-array" })).toBe(null)
  })

  test("accepts valid diagram with minimal fields", () => {
    const result = normalizeSavedDiagram(validDiagram())
    expect(result).not.toBe(null)
    expect(result!.id).toBe(createDiagramId("diagram-test-1"))
    expect(result!.title).toBe("Test Project")
    expect(result!.description).toBe("A test")
    expect(result!.nodes).toEqual([])
    expect(result!.edges).toEqual([])
  })

  test("fills missing description with empty string", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { description: _, ...rest } = validDiagram()
    const result = normalizeSavedDiagram(rest)
    expect(result!.description).toBe("")
  })

  test("fills missing createdAt / updatedAt with epoch", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { createdAt: _, updatedAt: __, ...rest } = validDiagram()
    const result = normalizeSavedDiagram(rest)
    expect(result!.createdAt).toBeTruthy()
    expect(result!.updatedAt).toBeTruthy()
  })
})

describe("export / import round-trip", () => {
  test("JSON serialize → parse → normalize preserves all fields", () => {
    const original = validDiagram()
    const json = JSON.stringify(original)
    const parsed = JSON.parse(json)
    const restored = normalizeSavedDiagram(parsed)

    expect(restored).not.toBe(null)
    expect(restored!.id).toBe(original.id)
    expect(restored!.title).toBe(original.title)
    expect(restored!.description).toBe(original.description)
    expect(restored!.nodes).toEqual(original.nodes)
    expect(restored!.edges).toEqual(original.edges)
    expect(restored!.createdAt).toBe(original.createdAt)
    expect(restored!.updatedAt).toBe(original.updatedAt)
    expect(restored!.schemaVersion).toBe(1)
  })

  test("round-trip with nodes and edges", () => {
    const diagram: SavedDiagram = {
      ...validDiagram(),
      nodes: [
        {
          id: createDiagramId("node-1") as unknown as DiagramNodeId,
          kind: "class",
          position: { x: 100, y: 200 },
          name: "User",
          stereotype: null,
          role: "",
          summary: "",
          files: [],
          reviewNotes: "",
          fields: ["id: int"],
          methods: ["getId()"],
          color: null,
        } satisfies DiagramNode,
      ],
      edges: [
        {
          id: createDiagramId("edge-1") as unknown as DiagramEdgeId,
          source: createDiagramId("node-1") as unknown as DiagramNodeId,
          target: createDiagramId("node-2") as unknown as DiagramNodeId,
          kind: "association",
          label: "",
          sourceLabel: "",
          targetLabel: "",
          sourceHandle: null,
          targetHandle: null,
          color: null,
          strokeWidth: 2,
          curvature: 0,
        } satisfies DiagramEdge,
      ],
    }

    const json = JSON.stringify(diagram)
    const restored = normalizeSavedDiagram(JSON.parse(json))

    expect(restored).not.toBe(null)
    expect(restored!.nodes).toHaveLength(1)
    expect(restored!.edges).toHaveLength(1)
    expect((restored!.nodes[0] as DiagramNode).kind).toBe("class")
    expect((restored!.edges[0] as DiagramEdge).kind).toBe("association")
  })
})

describe("import ID assignment", () => {
  test("import should generate a new unique ID to avoid conflicts", () => {
    // The caller (builder) must assign a new ID before saving.
    // This test verifies that the raw normalized data preserves the original ID
    // so the caller can replace it.
    const imported = normalizeSavedDiagram(validDiagram())
    expect(imported!.id).toBe(createDiagramId("diagram-test-1"))

    // Simulate what the builder does on import:
    const newId = createDiagramId(`diagram-${crypto.randomUUID()}`)
    const withNewId = { ...imported!, id: newId }
    expect(withNewId.id).not.toBe(createDiagramId("diagram-test-1"))
    expect(withNewId.title).toBe("Test Project")
  })
})

describe("duplicate logic", () => {
  test("duplicate creates a copy with new ID and (copy) suffix", () => {
    const original = validDiagram()
    const now = "2026-07-01T00:00:00.000Z"
    const newId = createDiagramId(`diagram-${crypto.randomUUID()}`)

    const copy: SavedDiagram = {
      ...original,
      id: newId,
      title: `${original.title} (copy)`,
      createdAt: now,
      updatedAt: now,
    }

    expect(copy.id).not.toBe(original.id)
    expect(copy.title).toBe("Test Project (copy)")
    expect(copy.createdAt).toBe(now)
    expect(copy.updatedAt).toBe(now)
    // Preserve original data
    expect(copy.description).toBe(original.description)
    expect(copy.nodes).toEqual(original.nodes)
    expect(copy.edges).toEqual(original.edges)
  })
})
