import type { DiagramSelection, SavedDiagram } from "../../domain"

export function selectedDiagramItem(
  diagram: SavedDiagram,
  selection: DiagramSelection
) {
  if (!selection) return null
  if (selection.kind === "node") {
    return diagram.nodes.find((node) => node.id === selection.id) ?? null
  }
  return diagram.edges.find((edge) => edge.id === selection.id) ?? null
}
