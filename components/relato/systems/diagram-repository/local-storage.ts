import type { DiagramId, DiagramSummary, SavedDiagram } from "../../domain"
import type { DiagramRepository } from "."
import { safeReadJson, safeWriteJson } from "./backup"
import { normalizeSavedDiagram } from "./schema"

const INDEX_KEY = "relato:diagrams:v1:index"
const DOCUMENT_KEY_PREFIX = "relato:diagrams:v1:document:"
const BACKUP_SUFFIX = ":backup"

function documentKey(id: DiagramId): string {
  return `${DOCUMENT_KEY_PREFIX}${id}`
}

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

function readIndex(storage: Storage): DiagramId[] {
  const ids = safeReadJson<DiagramId[]>(storage, INDEX_KEY)
  return Array.isArray(ids) ? ids : []
}

function writeIndex(storage: Storage, ids: DiagramId[]): void {
  safeWriteJson(storage, INDEX_KEY, [...new Set(ids)])
}

export function createLocalDiagramRepository(
  storage: Storage
): DiagramRepository {
  return {
    async list() {
      const diagrams = readIndex(storage)
        .map((id) => safeReadJson<unknown>(storage, documentKey(id)))
        .map(normalizeSavedDiagram)
        .filter((diagram): diagram is SavedDiagram => Boolean(diagram))

      return diagrams
        .map(summarize)
        .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
    },

    async load(id) {
      const key = documentKey(id)
      const primary = normalizeSavedDiagram(safeReadJson<unknown>(storage, key))
      if (primary) return primary

      const backup = normalizeSavedDiagram(
        safeReadJson<unknown>(storage, key + BACKUP_SUFFIX)
      )
      if (backup) {
        safeWriteJson(storage, key, backup)
        return backup
      }

      return null
    },

    async save(diagram) {
      const key = documentKey(diagram.id)
      const current = storage.getItem(key)
      if (current) storage.setItem(key + BACKUP_SUFFIX, current)
      safeWriteJson(storage, key, diagram)
      writeIndex(storage, [...readIndex(storage), diagram.id])
    },

    async delete(id) {
      storage.removeItem(documentKey(id))
      storage.removeItem(documentKey(id) + BACKUP_SUFFIX)
      writeIndex(
        storage,
        readIndex(storage).filter((item) => item !== id)
      )
    },
  }
}
