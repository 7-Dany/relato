"use client";

import { useEffect, useRef, useCallback } from "react";
import { useReactFlow } from "@xyflow/react";
import { toast } from "sonner";
import type { SelectionState } from "@/components/diagram/types";
import type { ClassNodeData } from "@/components/diagram/nodes/class-node";
import type { DiagramEdgeType } from "@/components/diagram/context";

/**
 * Keyboard shortcuts for the diagram builder.
 *
 * Uses refs to read the latest values without causing the effect to re-run.
 */
export function useKeyboardShortcuts(
  selection: SelectionState | null,
  setSelection: (next: SelectionState) => void,
  opts?: {
    addNode?: (stereotype: ClassNodeData["stereotype"]) => void;
    onLayout?: () => void;
    onEdgeTypeChange?: (type: DiagramEdgeType) => void;
    onUndo?: () => void;
    onRedo?: () => void;
    onDelete?: () => void; // caller handles deletion with history
  },
) {
  const { deleteElements } = useReactFlow();
  const optsRef = useRef(opts);
  const selectionRef = useRef(selection);
  const setSelectionRef = useRef(setSelection);

  // Update refs via effects to avoid React 19 strict mode warnings
  useEffect(() => {
    optsRef.current = opts;
  });
  useEffect(() => {
    selectionRef.current = selection;
  });
  useEffect(() => {
    setSelectionRef.current = setSelection;
  });

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore if user is typing in an input, textarea, or contenteditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const currentOpts = optsRef.current;
      const currentSelection = selectionRef.current;
      const currentSetSelection = setSelectionRef.current;

      // Delete selected elements
      if (e.key === "Delete" || e.key === "Backspace") {
        if (!currentSelection) return;
        const { nodeIds, edgeIds } = currentSelection;
        if (nodeIds.length > 0 || edgeIds.length > 0) {
          e.preventDefault();
          const count = nodeIds.length + edgeIds.length;
          if (currentOpts?.onDelete) {
            currentOpts.onDelete();
          } else {
            // Fallback: delete directly without history (legacy behavior)
            deleteElements({
              nodes: nodeIds.map((id) => ({ id })),
              edges: edgeIds.map((id) => ({ id })),
            });
          }
          currentSetSelection({ nodeIds: [], edgeIds: [] });
          toast(`${count} element${count > 1 ? "s" : ""} deleted`);
        }
        return;
      }

      // Undo (Ctrl/Cmd+Z)
      if (e.key === "z" && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
        e.preventDefault();
        currentOpts?.onUndo?.();
        return;
      }

      // Redo (Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y)
      if (
        (e.key === "z" && (e.metaKey || e.ctrlKey) && e.shiftKey) ||
        (e.key === "y" && (e.metaKey || e.ctrlKey))
      ) {
        e.preventDefault();
        currentOpts?.onRedo?.();
        return;
      }

      // Deselect all
      if (e.key === "Escape") {
        e.preventDefault();
        currentSetSelection({ nodeIds: [], edgeIds: [] });
        return;
      }

      // Add class (N)
      if (e.key === "n" || e.key === "N") {
        if (!e.shiftKey && currentOpts?.addNode) {
          e.preventDefault();
          currentOpts.addNode(null);
        }
        return;
      }

      // Auto-layout (L)
      if (e.key === "l" || e.key === "L") {
        if (!e.shiftKey && !e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          currentOpts?.onLayout?.();
        }
        return;
      }

      // Edge type shortcuts (1-4)
      if (currentOpts?.onEdgeTypeChange) {
        const edgeTypeMap: Record<string, DiagramEdgeType> = {
          "1": "association",
          "2": "dependency",
          "3": "inheritance",
          "4": "aggregation",
        };
        if (e.key in edgeTypeMap) {
          e.preventDefault();
          currentOpts.onEdgeTypeChange(edgeTypeMap[e.key]);
          return;
        }
      }
    },
    [deleteElements],
  );

  useEffect(() => {
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onKeyDown]);
}
