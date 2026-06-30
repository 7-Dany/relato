import type { DiagramCommand, DiagramId, DiagramSummary } from "../../domain"
import type { DiagramSessionState } from "../../systems/diagram-session"

export type WorkbenchProps = {
  session: DiagramSessionState
  saveStatus: "loading" | "saved" | "saving" | "error"
  canUndo: boolean
  canRedo: boolean
  dispatch: (command: DiagramCommand) => void
  onUndo: () => void
  onRedo: () => void
  onClearDiagram: () => void
  diagrams: DiagramSummary[]
  onCreateDiagram: () => void
  onOpenDiagram: (id: DiagramId) => void
  onDeleteDiagram: (id: DiagramId) => void
  onShowProjects: () => void
}
