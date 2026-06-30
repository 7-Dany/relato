/// <reference types="bun-types" />
import { Window } from "happy-dom"

// Set up a minimal DOM environment for @testing-library/react
const happyWindow = new Window()
happyWindow.document.body.innerHTML = '<div id="root"></div>'
// @ts-expect-error — reassign global document for happy-dom test env
globalThis.document = happyWindow.document
// @ts-expect-error — happy-dom Window type differs from native Window
globalThis.window = happyWindow

import { describe, expect, test } from "bun:test"
import { renderHook, waitFor } from "@testing-library/react"

import type { DiagramSummary, SavedDiagram } from "../../domain"
import type { DiagramRepository } from "../diagram-repository"
import { useDiagramPersistence } from "./use-diagram-persistence"

function createMockRepository(): DiagramRepository {
  const store = new Map<string, unknown>()

  return {
    async list(): Promise<DiagramSummary[]> {
      return Array.from(store.values()).map((d) => {
        const diag = d as SavedDiagram
        return {
          id: diag.id,
          title: diag.title,
          description: diag.description,
          nodeCount: diag.nodes.length,
          edgeCount: diag.edges.length,
          updatedAt: diag.updatedAt,
        }
      })
    },
    async load(id) {
      return (store.get(id) as SavedDiagram) ?? null
    },
    async save(diagram) {
      store.set(diagram.id, diagram)
    },
    async delete(id) {
      store.delete(id)
    },
  }
}

describe("useDiagramPersistence", () => {
  test("loads diagrams on mount and sets saveStatus to saved", async () => {
    const repo = createMockRepository()
    await repo.save({
      schemaVersion: 1,
      id: "diagram-test",
      title: "Test",
      description: "",
      nodes: [],
      edges: [],
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    } as unknown as SavedDiagram)

    const { result } = renderHook(() => useDiagramPersistence(repo))

    await waitFor(() => {
      expect(result.current.saveStatus).toBe("saved")
    })

    expect(result.current.diagrams.length).toBe(1)
    expect(result.current.diagrams[0]?.title).toBe("Test")
  })

  test("persist saves a diagram and refreshes the list", async () => {
    const repo = createMockRepository()
    const { result } = renderHook(() => useDiagramPersistence(repo))

    await waitFor(() => {
      expect(result.current.saveStatus).toBe("saved")
    })

    const diagram: SavedDiagram = {
      schemaVersion: 1,
      id: "diagram-1",
      title: "New Diagram",
      description: "",
      nodes: [],
      edges: [],
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    } as unknown as SavedDiagram

    await result.current.persist(diagram)

    await waitFor(() => {
      expect(result.current.diagrams.length).toBe(1)
    })
    expect(result.current.diagrams[0]?.title).toBe("New Diagram")
  })

  test("deleteDiagram removes a diagram and updates the list", async () => {
    const repo = createMockRepository()
    await repo.save({
      schemaVersion: 1,
      id: "diagram-1",
      title: "To Delete",
      description: "",
      nodes: [],
      edges: [],
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    } as unknown as SavedDiagram)

    const { result } = renderHook(() => useDiagramPersistence(repo))

    await waitFor(() => {
      expect(result.current.diagrams.length).toBe(1)
    })

    await result.current.deleteDiagram("diagram-1" as never)

    await waitFor(() => {
      expect(result.current.diagrams.length).toBe(0)
    })
  })

  test("deleteDiagram returns an error result and keeps the diagram when the repository throws", async () => {
    const repo = createMockRepository()
    await repo.save({
      schemaVersion: 1,
      id: "diagram-blocked",
      title: "Blocked",
      description: "",
      nodes: [],
      edges: [],
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    } as unknown as SavedDiagram)
    repo.delete = async () => {
      throw new Error("RLS policy violation")
    }

    const { result } = renderHook(() => useDiagramPersistence(repo))

    await waitFor(() => {
      expect(result.current.diagrams.length).toBe(1)
    })

    const outcome = await result.current.deleteDiagram("diagram-blocked" as never)

    expect(outcome.ok).toBe(false)
    if (!outcome.ok) {
      expect(outcome.error).toBe("RLS policy violation")
    }
    expect(result.current.diagrams.length).toBe(1)
  })

  test("createEmpty returns a diagram without side effects", () => {
    const repo = createMockRepository()
    const { result } = renderHook(() => useDiagramPersistence(repo))

    const diagram = result.current.createEmpty()

    expect(diagram.title).toBe("Architecture diagram")
    expect(diagram.nodes).toEqual([])
    expect(diagram.edges).toEqual([])
    expect(diagram.schemaVersion).toBe(1)
  })

  test("openDiagram loads a diagram from the repository", async () => {
    const repo = createMockRepository()
    await repo.save({
      schemaVersion: 1,
      id: "diagram-load",
      title: "Load Test",
      description: "",
      nodes: [],
      edges: [],
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    } as unknown as SavedDiagram)

    const { result } = renderHook(() => useDiagramPersistence(repo))

    const loaded = await result.current.openDiagram("diagram-load" as never)

    expect(loaded).not.toBeNull()
    expect(loaded?.title).toBe("Load Test")
  })

  test("returns null for non-existent diagram", async () => {
    const repo = createMockRepository()
    const { result } = renderHook(() => useDiagramPersistence(repo))

    const loaded = await result.current.openDiagram("nonexistent" as never)

    expect(loaded).toBeNull()
  })

  test("duplicateDiagram creates a copy with (copy) suffix", async () => {
    const repo = createMockRepository()
    await repo.save({
      schemaVersion: 1,
      id: "diagram-dup",
      title: "Original",
      description: "description",
      nodes: [],
      edges: [],
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    } as unknown as SavedDiagram)

    const { result } = renderHook(() => useDiagramPersistence(repo))

    await waitFor(() => {
      expect(result.current.diagrams.length).toBe(1)
    })

    await result.current.duplicateDiagram("diagram-dup" as never)

    await waitFor(() => {
      expect(result.current.diagrams.length).toBe(2)
    })
    const copy = result.current.diagrams.find((d) => d.title === "Original (copy)")
    expect(copy).toBeDefined()
  })

  test("does not throw when repository is null", async () => {
    const { result } = renderHook(() => useDiagramPersistence(null))

    expect(result.current.saveStatus).toBe("loading")
    expect(result.current.diagrams).toEqual([])

    await result.current.persist({
      schemaVersion: 1,
      id: "x",
      title: "nope",
      description: "",
      nodes: [],
      edges: [],
      createdAt: "",
      updatedAt: "",
    } as unknown as SavedDiagram)

    expect(result.current.saveStatus).toBe("loading")
  })
})
