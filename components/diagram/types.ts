/**
 * Selection state supports both single selection (for properties panel focus)
 * and multi-select (Shift+drag, Ctrl+click via React Flow).
 */
export interface SelectionState {
  nodeIds: string[];
  edgeIds: string[];
}

/** Convenience helper — true when anything is selected. */
export function hasSelection(s: SelectionState): boolean {
  return s.nodeIds.length > 0 || s.edgeIds.length > 0;
}

/** Single "primary" selection for the properties panel (last-selected item). */
export type PrimarySelection =
  | { kind: "node"; id: string; nodeType: string }
  | { kind: "edge"; id: string }
  | null;
