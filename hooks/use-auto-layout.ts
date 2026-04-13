"use client";

import { useCallback, useRef, useLayoutEffect } from "react";
import { flushSync } from "react-dom";
import { type Node, type Edge, type XYPosition } from "@xyflow/react";
import ELK from "elkjs/lib/elk.bundled.js";

// ─── Size Estimation ────────────────────────────────────────────────────────

const BASE_W = 220;
const H_PAD = 48;
const NAME_CHAR = 9.0;
const MONO_CHAR = 7.2;
const LINE_H = 18;
const SEC_PAD_Y = 16;
const HEADER_H = 56;
const EXTRA_H = 18;
const SEC_MIN_H = 32;
const FOOTER_H = 34;

interface NodeData {
  name?: string;
  stereotype?: "interface" | "abstract" | null;
  role?: string;
  fields?: string[];
  methods?: string[];
  files?: string[];
}

function estimateNodeSize(data: NodeData): { width: number; height: number } {
  const name = data.name ?? "";
  const fields = (data.fields ?? []).filter(Boolean);
  const methods = (data.methods ?? []).filter(Boolean);

  const nameW = name.length * NAME_CHAR + H_PAD;
  const stereoW = data.stereotype === "interface" ? 11 * MONO_CHAR + H_PAD : 0;
  const fieldW =
    fields.length > 0
      ? Math.max(...fields.map((f) => f.length * MONO_CHAR)) + H_PAD
      : 0;
  const methodW =
    methods.length > 0
      ? Math.max(...methods.map((m) => m.length * MONO_CHAR)) + H_PAD
      : 0;
  const width = Math.max(BASE_W, nameW, stereoW, fieldW, methodW);

  let headerH = HEADER_H;
  if (data.stereotype) headerH += EXTRA_H;
  if (data.role) headerH += EXTRA_H;

  const fieldsH = Math.max(SEC_MIN_H, fields.length * LINE_H + SEC_PAD_Y) + 1;
  const methodsH = Math.max(SEC_MIN_H, methods.length * LINE_H + SEC_PAD_Y);
  const footerH = (data.files ?? []).length > 0 ? FOOTER_H : 0;

  const height = headerH + fieldsH + methodsH + footerH;

  return { width, height };
}

// ─── ELK Layout Options ──────────────────────────────────────────────────────

const DEFAULT_LAYOUT_OPTIONS: Record<string, string> = {
  "elk.algorithm": "layered",
  "elk.direction": "DOWN",
  "elk.layered.spacing.nodeNodeBetweenLayers": "100",
  "elk.spacing.nodeNode": "60",
  "elk.spacing.edgeNode": "30",
  "elk.spacing.edgeEdge": "20",
  "elk.spacing.componentComponent": "80",
  "elk.layered.layering.strategy": "NETWORK_SIMPLEX",
  "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
  "elk.layered.crossingMinimization.greedySwitch.type": "TWO_SIDED",
  "elk.layered.nodePlacement.strategy": "BRANDES_KOEPF",
  "elk.layered.nodePlacement.bk.fixedAlignment": "BALANCED",
  "elk.layered.compaction.postCompaction.strategy": "EDGE_LENGTH",
  "elk.layered.unnecessaryBendpoints": "true",
  "elk.layered.thoroughness": "7",
  "elk.separateConnectedComponents": "true",
  "elk.edgeRouting": "ORTHOGONAL",
  "elk.hierarchyHandling": "INCLUDE_CHILDREN",
};

// ─── Core ELK computation (no React state) ───────────────────────────────────

/**
 * Runs ELK on the given nodes/edges and returns a position map.
 * Pure async function — does not touch React state.
 */
async function computeELKLayout<N extends Node>(
  elk: InstanceType<typeof ELK>,
  nodes: N[],
  edges: Edge[],
  direction: "TB" | "LR",
): Promise<Map<string, XYPosition>> {
  const classNodes = nodes.filter(
    (n) => n.type !== "explanation" && n.type !== "explanationNode",
  );

  if (classNodes.length === 0) return new Map();

  const anchorEdgeIds = new Set(
    edges.filter((e) => e.id.startsWith("anchor-")).map((e) => e.id),
  );
  const classEdges = edges.filter(
    (e) =>
      !anchorEdgeIds.has(e.id) &&
      classNodes.some((n) => n.id === e.source) &&
      classNodes.some((n) => n.id === e.target),
  );

  const elkEdges = classEdges
    .filter(
      (edge) => edge.type === "inheritance" || edge.type === "aggregation",
    )
    .map((edge) => {
      const isInheritance = edge.type === "inheritance";
      return {
        id: edge.id,
        sources: [isInheritance ? edge.target : edge.source],
        targets: [isInheritance ? edge.source : edge.target],
      };
    });

  const graph = {
    id: "root",
    layoutOptions: {
      ...DEFAULT_LAYOUT_OPTIONS,
      "elk.direction": direction === "LR" ? "RIGHT" : "DOWN",
    },
    children: classNodes.map((n) => {
      const size = estimateNodeSize((n.data as NodeData) ?? {});
      return { id: n.id, width: size.width, height: size.height };
    }),
    edges: elkEdges,
  };

  const layouted = await elk.layout(graph);

  return new Map<string, XYPosition>(
    (layouted.children ?? []).map(
      (n: { id: string; x?: number; y?: number }) => [
        n.id,
        { x: n.x ?? 0, y: n.y ?? 0 },
      ],
    ),
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export interface UseAutoLayoutResult {
  /**
   * Re-layout the current canvas nodes in-place.
   * Reads from internal refs so the callback is stable across renders.
   * Returns a Promise that resolves once positions have been committed.
   */
  layout: (direction?: "TB" | "LR") => Promise<void>;

  /**
   * Compute ELK positions for an arbitrary set of nodes/edges without
   * rendering them first. Returns the nodes with updated positions so the
   * caller can commit a single `setNodes` call — eliminating the
   * "raw positions flash → ELK reposition" double-render.
   */
  computeLayout: <N extends Node>(
    nodes: N[],
    edges: Edge[],
    direction?: "TB" | "LR",
  ) => Promise<N[]>;
}

/**
 * Provides automatic hierarchical layout for the diagram canvas.
 *
 * Two entry points:
 * - `layout(direction)` — re-layout what's already on the canvas (toolbar button, keyboard shortcut)
 * - `computeLayout(nodes, edges, direction)` — pre-compute positions before first render (loadPattern)
 */
export function useAutoLayout<N extends Node>(
  nodes: N[],
  setNodes: React.Dispatch<React.SetStateAction<N[]>>,
  edges: Edge[],
): UseAutoLayoutResult {
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);

  useLayoutEffect(() => {
    nodesRef.current = nodes;
    edgesRef.current = edges;
  }, [nodes, edges]);

  // ELK instance — shared, created lazily on first use
  const elkRef = useRef<InstanceType<typeof ELK> | null>(null);
  function getELK() {
    if (!elkRef.current) {
      elkRef.current = new ELK();
    }
    return elkRef.current;
  }

  const layoutPendingRef = useRef(false);

  /**
   * Pure computation — takes nodes/edges directly, returns positioned nodes.
   * No React state side-effects.
   */
  const computeLayout = useCallback(
    async <M extends Node>(
      inputNodes: M[],
      inputEdges: Edge[],
      direction: "TB" | "LR" = "TB",
    ): Promise<M[]> => {
      const posMap = await computeELKLayout(
        getELK(),
        inputNodes,
        inputEdges,
        direction,
      );
      if (posMap.size === 0) return inputNodes;
      return inputNodes.map((n) => {
        const pos = posMap.get(n.id);
        if (!pos) return n;
        return { ...n, position: pos };
      });
    },
    [],
  );

  /**
   * In-place layout — reads current canvas nodes/edges from refs, applies
   * ELK positions via setNodes. Use for the toolbar button / keyboard shortcut.
   */
  const layout = useCallback(
    (direction: "TB" | "LR" = "TB"): Promise<void> => {
      if (layoutPendingRef.current) return Promise.resolve();
      layoutPendingRef.current = true;

      const currentNodes = nodesRef.current;
      const currentEdges = edgesRef.current;

      return computeELKLayout(getELK(), currentNodes, currentEdges, direction)
        .then((posMap) => {
          if (posMap.size === 0) return;

          // flushSync commits positions synchronously so React Flow's internal
          // store is populated before the rAF resolves. Without this, fitView
          // fires against stale geometry and clips or misses nodes.
          flushSync(() => {
            setNodes((nds) =>
              nds.map((n) => {
                const pos = posMap.get(n.id);
                if (!pos) return n;
                return { ...n, position: pos };
              }),
            );
          });

          // One rAF lets React Flow measure the committed DOM before the
          // caller runs fitView.
          return new Promise<void>((resolve) =>
            requestAnimationFrame(() => resolve()),
          );
        })
        .catch((err) => {
          console.error("[useAutoLayout] ELK layout failed:", err);
        })
        .finally(() => {
          layoutPendingRef.current = false;
        });
    },
    [setNodes, computeLayout],
  );

  return { layout, computeLayout };
}
