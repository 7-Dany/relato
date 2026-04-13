"use client";

import { useRef, useCallback } from "react";
import type { Node, Edge } from "@xyflow/react";

const MAX_HISTORY = 50;

interface HistoryState {
  nodes: Node[];
  edges: Edge[];
}

function cloneNode(node: Node): Node {
  return {
    id: node.id,
    type: node.type,
    position: node.position,
    data: node.data,
    selected: false,
    ...(node.sourcePosition != null && { sourcePosition: node.sourcePosition }),
    ...(node.targetPosition != null && { targetPosition: node.targetPosition }),
    ...(node.dragging != null && { dragging: node.dragging }),
    ...(node.measured != null && { measured: node.measured }),
    ...(node.style != null && { style: node.style }),
    ...(node.className != null && { className: node.className }),
  } as Node;
}

function cloneEdge(edge: Edge): Edge {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: edge.type,
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle,
    data: edge.data,
    label: edge.label,
    selected: edge.selected,
    ...(edge.animated != null && { animated: edge.animated }),
    ...(edge.style != null && { style: edge.style }),
    ...(edge.className != null && { className: edge.className }),
  } as Edge;
}

/**
 * Undo/redo history for the diagram.
 *
 * History structure:
 * - history[0] = initial empty state (pre-pushed)
 * - history[1] = state after first action
 * - index points to current state
 *
 * Pattern: pushHistory saves the CURRENT state BEFORE changes.
 * The initial state is pre-pushed so the first action creates history[1].
 */
export function useDiagramHistory() {
  // Pre-push initial empty state
  const historyRef = useRef<HistoryState[]>([{ nodes: [], edges: [] }]);
  const historyIndexRef = useRef<number>(0);
  const isUndoRedoRef = useRef(false);

  const pushHistory = useCallback((nodes: Node[], edges: Edge[]) => {
    if (isUndoRedoRef.current) return;

    // Truncate future states if we're not at the end
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyRef.current = historyRef.current.slice(
        0,
        historyIndexRef.current + 1,
      );
    }

    historyRef.current.push({
      nodes: nodes.map(cloneNode),
      edges: edges.map(cloneEdge),
    });

    if (historyRef.current.length > MAX_HISTORY) {
      historyRef.current.shift();
    } else {
      historyIndexRef.current++;
    }
  }, []);

  const canUndo = useCallback(() => {
    return historyIndexRef.current > 0;
  }, []);

  const canRedo = useCallback(
    () => historyIndexRef.current < historyRef.current.length - 1,
    [],
  );

  const undo = useCallback((): HistoryState | null => {
    if (!canUndo()) return null;
    historyIndexRef.current--;
    isUndoRedoRef.current = true;
    const state = historyRef.current[historyIndexRef.current];
    return state ? { ...state } : null;
  }, [canUndo]);

  const redo = useCallback((): HistoryState | null => {
    if (!canRedo()) return null;
    historyIndexRef.current++;
    isUndoRedoRef.current = true;
    const state = historyRef.current[historyIndexRef.current];
    return state ? { ...state } : null;
  }, [canRedo]);

  const clearHistory = useCallback(() => {
    historyRef.current = [{ nodes: [], edges: [] }];
    historyIndexRef.current = 0;
  }, []);

  const resetUndoRedoFlag = useCallback(() => {
    isUndoRedoRef.current = false;
  }, []);

  return {
    pushHistory,
    canUndo,
    canRedo,
    undo,
    redo,
    clearHistory,
    resetUndoRedoFlag,
    isUndoRedoRef,
  };
}
