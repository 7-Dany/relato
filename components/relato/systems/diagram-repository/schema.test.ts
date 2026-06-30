import { describe, expect, test } from "bun:test"

import { normalizeSavedDiagram } from "./schema"

describe("normalizeSavedDiagram", () => {
  test("rejects raw React Flow shaped data without a Relato schema", () => {
    expect(normalizeSavedDiagram({ nodes: [], edges: [] })).toBe(null)
  })

  test("normalizes a v1 saved diagram", () => {
    const diagram = normalizeSavedDiagram({
      schemaVersion: 1,
      id: "diagram-1",
      title: "System",
      nodes: [],
      edges: [],
      createdAt: "2026-05-24T00:00:00.000Z",
      updatedAt: "2026-05-24T00:00:00.000Z",
    })

    expect(diagram?.title).toBe("System")
    expect(diagram?.description).toBe("")
  })
})
