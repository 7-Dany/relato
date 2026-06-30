import type {
  ClassDiagramNode,
  DiagramEdge,
  DiagramEdgeId,
  DiagramEdgeKind,
  DiagramNodeId,
  DiagramPoint,
  NoteDiagramNode,
  SavedDiagram,
} from "./diagram"

export type DiagramSelection =
  | { kind: "node"; id: DiagramNodeId }
  | { kind: "edge"; id: DiagramEdgeId }
  | null

export type DiagramCommand =
  | { type: "rename-diagram"; title: string }
  | {
      type: "add-class-node"
      position: DiagramPoint
      node?: Partial<ClassDiagramNode>
    }
  | {
      type: "add-note-node"
      position: DiagramPoint
      node?: Partial<NoteDiagramNode>
    }
  | {
      type: "update-class-node"
      id: DiagramNodeId
      patch: Partial<ClassDiagramNode>
    }
  | {
      type: "update-note-node"
      id: DiagramNodeId
      patch: Partial<NoteDiagramNode>
    }
  | { type: "move-node"; id: DiagramNodeId; position: DiagramPoint }
  | {
      type: "layout-diagram"
      positions: ReadonlyArray<{ id: DiagramNodeId; position: DiagramPoint }>
    }
  | {
      type: "connect-nodes"
      edge: Omit<DiagramEdge, "id"> & { id?: DiagramEdgeId }
    }
  | { type: "update-edge"; id: DiagramEdgeId; patch: Partial<DiagramEdge> }
  | { type: "delete-selection"; selection: DiagramSelection }
  | {
      type: "delete-multiple"
      nodeIds: DiagramNodeId[]
      edgeIds: DiagramEdgeId[]
    }
  | { type: "select"; selection: DiagramSelection }
  | { type: "set-active-edge-kind"; kind: DiagramEdgeKind }
  | { type: "replace-diagram"; diagram: SavedDiagram }
  | { type: "insert-diagram-template"; diagram: SavedDiagram }
  | { type: "duplicate-node"; id: DiagramNodeId }

export type DiagramCommandResult = {
  diagram: SavedDiagram
  selection: DiagramSelection
  activeEdgeKind: DiagramEdgeKind
  changed: boolean
}
