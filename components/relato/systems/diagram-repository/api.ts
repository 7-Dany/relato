import type { DiagramSummary, SavedDiagram } from "../../domain"
import type { DiagramRepository } from "."

function summarize(diagram: SavedDiagram): DiagramSummary {
  return {
    id: diagram.id,
    title: diagram.title,
    description: diagram.description,
    nodeCount: diagram.nodes.length,
    edgeCount: diagram.edges.length,
    updatedAt: diagram.updatedAt,
  }
}

async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `API ${res.status}`)
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

export function createApiDiagramRepository(): DiagramRepository {
  return {
    async list() {
      try {
        const diagrams = await apiFetch<SavedDiagram[]>("/api/relato/diagrams")
        return diagrams.map(summarize)
      } catch {
        return []
      }
    },

    async load(id) {
      try {
        return await apiFetch<SavedDiagram>(`/api/relato/diagrams/${id}`)
      } catch {
        return null
      }
    },

    async save(diagram) {
      try {
        await apiFetch(`/api/relato/diagrams/${diagram.id}`, {
          method: "PUT",
          body: JSON.stringify(diagram),
        })
      } catch {
        // Silent — db may not be set up yet
      }
    },

    async delete(id) {
      // Intentionally not swallowed: a failed delete (e.g. blocked by an
      // RLS policy) must not look identical to a successful one, or the
      // project just silently reappears after the list refreshes.
      await apiFetch(`/api/relato/diagrams/${id}`, { method: "DELETE" })
    },
  }
}
