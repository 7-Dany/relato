"use client"

import { useCallback, useEffect, useReducer, useRef } from "react"

import type { DiagramCommand, DiagramEdgeKind, SavedDiagram } from "../../domain"
import { pushDiagramHistory, undoDiagramHistory, redoDiagramHistory } from "./history"
import type { DiagramHistory } from "./history"
import { applyDiagramCommand } from "./reducer"
import type { DiagramSessionState } from "./reducer"

export type UseDiagramSessionResult = {
  session: DiagramSessionState
  canUndo: boolean
  canRedo: boolean
  /** Dispatch a command. Calls `onSave` when the diagram changes. */
  dispatch: (command: DiagramCommand) => void
  undo: () => void
  redo: () => void
  /**
   * Replace the current diagram and reset history.
   * Use when opening an existing diagram or creating a new one.
   */
  loadDiagram: (diagram: SavedDiagram) => void
}

type InternalState = {
  history: DiagramHistory
  selection: DiagramSelection
  activeEdgeKind: DiagramEdgeKind
  dirty: boolean
}

import type { DiagramSelection } from "../../domain"

type Action =
  | { type: "command"; command: DiagramCommand }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "load-diagram"; diagram: SavedDiagram }

function sessionReducer(state: InternalState, action: Action): InternalState {
  switch (action.type) {
    case "command": {
      const sessionState: DiagramSessionState = {
        diagram: state.history.present,
        selection: state.selection,
        activeEdgeKind: state.activeEdgeKind,
        dirty: state.dirty,
      }
      const result = applyDiagramCommand(sessionState, action.command)

      if (!result.changed) {
        return {
          ...state,
          selection: result.selection,
          activeEdgeKind: result.activeEdgeKind,
        }
      }

      return {
        history: pushDiagramHistory(
          { ...state.history, present: state.history.present },
          result.diagram
        ),
        selection: result.selection ?? state.selection,
        activeEdgeKind: result.activeEdgeKind,
        dirty: true,
      }
    }
    case "undo": {
      const next = undoDiagramHistory(state.history)
      if (next.present === state.history.present) return state
      return {
        history: next,
        selection: null,
        activeEdgeKind: state.activeEdgeKind,
        dirty: true,
      }
    }
    case "redo": {
      const next = redoDiagramHistory(state.history)
      if (next.present === state.history.present) return state
      return {
        history: next,
        selection: null,
        activeEdgeKind: state.activeEdgeKind,
        dirty: true,
      }
    }
    case "load-diagram":
      return {
        history: { past: [], present: action.diagram, future: [] },
        selection: null,
        activeEdgeKind: state.activeEdgeKind,
        dirty: false,
      }
  }
}

/**
 * Owns the session state machine and undo/redo history in one place.
 *
 * The invariant `session.diagram === history.present` is now an implementation
 * detail of this hook — callers never see the split state.
 *
 * @param initialDiagram - The diagram to start with.
 * @param onSave         - Called with the new diagram whenever a change is
 *                         committed. Must be a stable reference (wrap in
 *                         useCallback at the call site).
 */
export function useDiagramSession(
  initialDiagram: SavedDiagram,
  onSave: (diagram: SavedDiagram) => void
): UseDiagramSessionResult {
  const [state, dispatch] = useReducer(sessionReducer, {
    history: { past: [], present: initialDiagram, future: [] },
    selection: null,
    activeEdgeKind: "association" as DiagramEdgeKind,
    dirty: false,
  })

  const skipOnSaveRef = useRef(false)
  const prevPresentRef = useRef(state.history.present)

  useEffect(() => {
    const prev = prevPresentRef.current
    prevPresentRef.current = state.history.present
    if (skipOnSaveRef.current) {
      skipOnSaveRef.current = false
      return
    }
    if (prev !== state.history.present) {
      onSave(state.history.present)
    }
  })

  const dispatchCommand = useCallback((command: DiagramCommand) => {
    dispatch({ type: "command", command })
  }, [])

  const undo = useCallback(() => {
    dispatch({ type: "undo" })
  }, [])

  const redo = useCallback(() => {
    dispatch({ type: "redo" })
  }, [])

  const loadDiagram = useCallback((diagram: SavedDiagram) => {
    skipOnSaveRef.current = true
    dispatch({ type: "load-diagram", diagram })
  }, [])

  return {
    session: {
      diagram: state.history.present,
      selection: state.selection,
      activeEdgeKind: state.activeEdgeKind,
      dirty: state.dirty,
    },
    canUndo: state.history.past.length > 0,
    canRedo: state.history.future.length > 0,
    dispatch: dispatchCommand,
    undo,
    redo,
    loadDiagram,
  }
}
