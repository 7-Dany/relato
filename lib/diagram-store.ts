"use client";

import { create } from "zustand";
import type { SelectionState } from "@/components/diagram/types";
import type { DiagramEdgeType } from "@/components/diagram/context";

interface DiagramVolatileState {
  selection: SelectionState;
  activeEdgeType: DiagramEdgeType;
  activePatternId: string | null;
  setSelection: (next: SelectionState) => void;
  setActiveEdgeType: (type: DiagramEdgeType) => void;
  setActivePatternId: (id: string | null) => void;
}

/**
 * Zustand store for diagram volatile state.
 * Replaces the React useState + context pattern for selection, edge type,
 * and pattern id — eliminating unnecessary context re-renders entirely.
 */
export const useDiagramStore = create<DiagramVolatileState>((set) => ({
  selection: { nodeIds: [], edgeIds: [] },
  activeEdgeType: "association",
  activePatternId: null,
  setSelection: (selection) => set({ selection }),
  setActiveEdgeType: (activeEdgeType) => set({ activeEdgeType }),
  setActivePatternId: (activePatternId) => set({ activePatternId }),
}));

// Selectors for granular subscriptions — each consumer reads only what it needs
export const useDiagramSelection = () =>
  useDiagramStore((s) => s.selection);
export const useDiagramActiveEdgeType = () =>
  useDiagramStore((s) => s.activeEdgeType);
export const useDiagramActivePatternId = () =>
  useDiagramStore((s) => s.activePatternId);
