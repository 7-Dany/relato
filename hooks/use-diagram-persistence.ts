"use client";

import { useRef, useCallback } from "react";
import type { Node, Edge } from "@xyflow/react";

const SCHEMA_VERSION = "v2";
const STORAGE_KEY = `relato:diagram:${SCHEMA_VERSION}`;
const DEBOUNCE_MS = 1500;

// ─── Standalone sync reader ──────────────────────────────────────────────────
// Called outside React (useState lazy initializer) so the first render already
// has saved data — eliminates the empty-state flash on refresh.

export function readSavedDiagram(): SavedDiagram | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SavedDiagram;
      if (parsed.schemaVersion === SCHEMA_VERSION) return parsed;
    }
    // Migrate from v1
    const v1Raw = localStorage.getItem("relato:diagram");
    if (v1Raw) {
      const v1 = JSON.parse(v1Raw);
      if (v1?.nodes && v1?.edges) {
        const migrated: SavedDiagram = {
          schemaVersion: SCHEMA_VERSION,
          nodes: serializeNodes(v1.nodes),
          edges: serializeEdges(v1.edges),
          nodeIdCounter: v1.nodeIdCounter ?? v1.nodeIdRef ?? 0,
          activePatternId: v1.activePatternId ?? null,
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        localStorage.removeItem("relato:diagram");
        return migrated;
      }
    }
  } catch {
    // Corrupted data or private browsing — non-fatal
  }
  return null;
}

interface SerializedNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: unknown;
}

interface SerializedEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  data?: unknown;
}

export interface SavedDiagram {
  schemaVersion: typeof SCHEMA_VERSION;
  nodes: SerializedNode[];
  edges: SerializedEdge[];
  nodeIdCounter: number;
  activePatternId: string | null;
  savedAt: string;
}

function serializeNodes(nodes: Node[]): SerializedNode[] {
  return nodes.map(({ id, type, position, data }) => ({
    id,
    type: type ?? "classNode",
    position,
    data,
  }));
}

function serializeEdges(edges: Edge[]): SerializedEdge[] {
  return edges.map(
    ({ id, source, target, type, sourceHandle, targetHandle, data }) => ({
      id,
      source,
      target,
      type: type ?? "association",
      ...(sourceHandle != null && { sourceHandle }),
      ...(targetHandle != null && { targetHandle }),
      ...(data != null && { data }),
    }),
  );
}

/**
 * Auto-saves diagram state to localStorage with debounce and minimal schema.
 * Strips React Flow internal metadata and versions the storage key.
 *
 * @returns `restoreDiagram` function to call on mount, and `saveDiagram` / `clearDiagram`.
 */
export function useDiagramPersistence() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const restoreDiagram = useCallback((): SavedDiagram | null => {
    try {
      // Try current schema version
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SavedDiagram;
        if (parsed.schemaVersion === SCHEMA_VERSION) return parsed;
      }
      // Migrate from v1 (legacy key without version)
      const v1Raw = localStorage.getItem("relato:diagram");
      if (v1Raw) {
        const v1 = JSON.parse(v1Raw);
        if (v1?.nodes && v1?.edges) {
          const migrated: SavedDiagram = {
            schemaVersion: SCHEMA_VERSION,
            nodes: serializeNodes(v1.nodes),
            edges: serializeEdges(v1.edges),
            nodeIdCounter: v1.nodeIdCounter ?? v1.nodeIdRef ?? 0,
            activePatternId: v1.activePatternId ?? null,
            savedAt: new Date().toISOString(),
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
          localStorage.removeItem("relato:diagram");
          return migrated;
        }
      }
    } catch {
      // Corrupted data or private browsing — non-fatal
    }
    return null;
  }, []);

  const saveDiagram = useCallback(
    (
      nodes: Node[],
      edges: Edge[],
      nodeIdCounter: number,
      activePatternId: string | null,
    ) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        try {
          const data: SavedDiagram = {
            schemaVersion: SCHEMA_VERSION,
            nodes: serializeNodes(nodes),
            edges: serializeEdges(edges),
            nodeIdCounter,
            activePatternId,
            savedAt: new Date().toISOString(),
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
          // Quota exceeded or private browsing — handle entirely inside
          // the callback so the error is never uncaught.
          if (
            e instanceof DOMException &&
            (e.code === 22 ||
              e.name === "QuotaExceededError" ||
              e.name === "NS_ERROR_DOM_QUOTA_REACHED")
          ) {
            console.warn(
              "[useDiagramPersistence] localStorage quota exceeded — diagram not saved.",
            );
          }
        }
      }, DEBOUNCE_MS);
    },
    [],
  );

  const clearDiagram = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  return { restoreDiagram, saveDiagram, clearDiagram };
}
