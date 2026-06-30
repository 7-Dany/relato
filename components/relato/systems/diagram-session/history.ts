import type { SavedDiagram } from "../../domain"

export type DiagramHistory = {
  past: SavedDiagram[]
  present: SavedDiagram
  future: SavedDiagram[]
}

export function pushDiagramHistory(
  history: DiagramHistory,
  next: SavedDiagram
): DiagramHistory {
  return {
    past: [...history.past, history.present].slice(-50),
    present: next,
    future: [],
  }
}

export function undoDiagramHistory(history: DiagramHistory): DiagramHistory {
  const previous = history.past.at(-1)
  if (!previous) return history

  return {
    past: history.past.slice(0, -1),
    present: previous,
    future: [history.present, ...history.future],
  }
}

export function redoDiagramHistory(history: DiagramHistory): DiagramHistory {
  const next = history.future[0]
  if (!next) return history

  return {
    past: [...history.past, history.present],
    present: next,
    future: history.future.slice(1),
  }
}
