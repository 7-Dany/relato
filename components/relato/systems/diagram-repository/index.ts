import type { DiagramId, DiagramSummary, SavedDiagram } from "../../domain"

export { createLocalDiagramRepository } from "./local-storage"
export { createApiDiagramRepository } from "./api"
export { createEmptyDiagram, createDiagramId } from "./schema"

export interface DiagramRepository {
  list(): Promise<DiagramSummary[]>
  load(id: DiagramId): Promise<SavedDiagram | null>
  save(diagram: SavedDiagram): Promise<void>
  delete(id: DiagramId): Promise<void>
}
