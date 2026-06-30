import type { DiagramId, SavedDiagram } from "../../domain"

export const RELATO_SCHEMA_VERSION = 1 as const

export function createDiagramId(value: string): DiagramId {
  return value as DiagramId
}

export function createEmptyDiagram(
  now: string,
  title = "Untitled diagram"
): SavedDiagram {
  return {
    schemaVersion: RELATO_SCHEMA_VERSION,
    id: createDiagramId(`diagram-${crypto.randomUUID()}`),
    title,
    description: "",
    nodes: [],
    edges: [],
    createdAt: now,
    updatedAt: now,
  }
}

export function normalizeSavedDiagram(value: unknown): SavedDiagram | null {
  if (!value || typeof value !== "object") return null

  const candidate = value as Partial<SavedDiagram>
  if (candidate.schemaVersion !== RELATO_SCHEMA_VERSION) return null
  if (!candidate.id || !candidate.title) return null
  if (!Array.isArray(candidate.nodes) || !Array.isArray(candidate.edges)) {
    return null
  }

  return {
    schemaVersion: RELATO_SCHEMA_VERSION,
    id: candidate.id,
    title: candidate.title,
    description: candidate.description ?? "",
    nodes: candidate.nodes,
    edges: candidate.edges,
    createdAt: candidate.createdAt ?? new Date(0).toISOString(),
    updatedAt:
      candidate.updatedAt ?? candidate.createdAt ?? new Date(0).toISOString(),
  } as SavedDiagram
}
