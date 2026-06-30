import { describe, expect, test } from "bun:test"

import type { SavedDiagram } from "../../domain"
import {
  pushDiagramHistory,
  undoDiagramHistory,
  redoDiagramHistory,
  type DiagramHistory,
} from "./history"

function diagram(overrides?: Partial<SavedDiagram>): SavedDiagram {
  return {
    schemaVersion: 1,
    id: "diagram-1" as SavedDiagram["id"],
    title: "Test",
    description: "",
    nodes: [],
    edges: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  }
}

function makeHistory(pastCount: number): DiagramHistory {
  const past: SavedDiagram[] = []
  for (let i = 0; i < pastCount; i++) {
    past.push(diagram({ title: `past-${i}` }))
  }
  return {
    past,
    present: diagram({ title: "present" }),
    future: [],
  }
}

describe("DiagramHistory", () => {
  test("push appends current present to past and uses next as new present", () => {
    const h = makeHistory(0)
    const next = pushDiagramHistory(h, diagram({ title: "next" }))

    expect(next.past.length).toBe(1)
    expect(next.past[0]?.title).toBe("present")
    expect(next.present.title).toBe("next")
    expect(next.future.length).toBe(0)
  })

  test("undo moves previous present back into past", () => {
    const h = makeHistory(2)
    const result = undoDiagramHistory(h)

    expect(result.past.length).toBe(1)
    expect(result.present.title).toBe("past-1")
    expect(result.future.length).toBe(1)
    expect(result.future[0]?.title).toBe("present")
  })

  test("undo returns same history when past is empty", () => {
    const h = makeHistory(0)
    const result = undoDiagramHistory(h)

    expect(result).toBe(h)
  })

  test("redo moves first future entry into present", () => {
    const h: DiagramHistory = {
      past: [],
      present: diagram({ title: "past-state" }),
      future: [diagram({ title: "future-state" })],
    }
    const result = redoDiagramHistory(h)

    expect(result.past.length).toBe(1)
    expect(result.past[0]?.title).toBe("past-state")
    expect(result.present.title).toBe("future-state")
    expect(result.future.length).toBe(0)
  })

  test("redo returns same history when future is empty", () => {
    const h = makeHistory(0)
    const result = redoDiagramHistory(h)

    expect(result).toBe(h)
  })

  test("undo then redo round-trips back to original state", () => {
    const h = makeHistory(0)
    const pushed = pushDiagramHistory(h, diagram({ title: "v2" }))
    const undone = undoDiagramHistory(pushed)
    const redone = redoDiagramHistory(undone)

    expect(undone.present.title).toBe("present")
    expect(redone.present.title).toBe("v2")
  })

  test("push after undo clears future stack", () => {
    const h: DiagramHistory = {
      past: [diagram({ title: "v1" })],
      present: diagram({ title: "v2" }),
      future: [diagram({ title: "v3" })],
    }
    const result = pushDiagramHistory(h, diagram({ title: "v4" }))

    expect(result.future.length).toBe(0)
    expect(result.present.title).toBe("v4")
  })

  test("past is capped at 50 entries", () => {
    const h = makeHistory(50)
    const result = pushDiagramHistory(h, diagram({ title: "overflow" }))

    expect(result.past.length).toBe(50)
    expect(result.past[0]?.title).toBe("past-1")
  })
})
