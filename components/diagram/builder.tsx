"use client";

import "@xyflow/react/dist/style.css";

import Link from "next/link";
import {
  Activity,
  useTransition,
  useDeferredValue,
  useLayoutEffect,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Position,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  useOnSelectionChange,
  type OnConnect,
  type Node,
  type Edge,
  type NodeTypes,
} from "@xyflow/react";
import { useTheme } from "next-themes";
import { flushSync } from "react-dom";

import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useAutoLayout } from "@/hooks/use-auto-layout";
import {
  useDiagramPersistence,
  readSavedDiagram,
} from "@/hooks/use-diagram-persistence";
import { useDiagramHistory } from "@/hooks/use-diagram-history";
import { PATTERN_BY_ID, type PatternDefinition } from "@/lib/patterns";
import {
  useDiagramStore,
  useDiagramSelection,
  useDiagramActiveEdgeType,
  useDiagramActivePatternId,
} from "@/lib/diagram-store";
import {
  DiagramActionsContext,
  type DiagramActionsContextValue,
  type DiagramEdgeType,
} from "./context";
import {
  ClassNode,
  type ClassNodeType,
  type ClassNodeData,
} from "./nodes/class-node";
import {
  ExplanationNode,
  type ExplanationNodeType,
} from "./nodes/explanation-node";
import { edgeTypes } from "./edges/diagram-edge-path";
import { AnchorEdge, anchorEdgeType } from "./edges/anchor-edge";
import { LeftSidebar } from "./panels/left-sidebar";
import { PropertiesPanel } from "./panels/properties-panel";
import { BottomToolbar } from "./toolbars/bottom-toolbar";
import {
  DiagramContextMenu,
  type ContextMenuState,
} from "./canvas/context-menus";
import { EmptyCanvas } from "./canvas/empty-state";
import type { PrimarySelection } from "./types";
import type { SavedDiagram } from "@/hooks/use-diagram-persistence";
import { toast } from "sonner";

// Merge diagram edges with anchor edge
const allEdgeTypes = {
  ...edgeTypes,
  [anchorEdgeType]: AnchorEdge,
};

// Union type for all diagram nodes
type DiagramNode = ClassNodeType | ExplanationNodeType;

// ─── Helpers ───────────────────────────────────────────────────────────────

const nodeTypes: NodeTypes = {
  classNode: ClassNode,
  explanation: ExplanationNode,
};

/** Type guard: check if a saved node is a valid ClassNodeType */
function isClassNode(n: SavedDiagram["nodes"][number]): n is ClassNodeType {
  return (
    n.type === "classNode" &&
    typeof n.id === "string" &&
    typeof n.position === "object" &&
    n.position !== null &&
    typeof n.position.x === "number" &&
    typeof n.position.y === "number" &&
    typeof (n.data as Record<string, unknown> | null)?.name === "string"
  );
}

/** Type guard: check if a saved node is a valid ExplanationNodeType */
function isExplanationNode(
  n: SavedDiagram["nodes"][number],
): n is ExplanationNodeType {
  return (
    n.type === "explanation" &&
    typeof n.id === "string" &&
    typeof n.position === "object" &&
    n.position !== null &&
    typeof n.position.x === "number" &&
    typeof n.position.y === "number" &&
    typeof (n.data as Record<string, unknown> | null)?.number === "number"
  );
}

/** Deserialize SavedDiagram nodes into typed DiagramNode[]. Invalid entries are dropped. */
function deserializeNodes(saved: SavedDiagram | null): DiagramNode[] {
  if (!saved) return [];
  return saved.nodes.filter(
    (n): n is DiagramNode => isClassNode(n) || isExplanationNode(n),
  );
}

/** Deserialize saved edges into Edge[]. Drops entries missing required fields. */
function deserializeEdges(saved: SavedDiagram | null): Edge[] {
  if (!saved) return [];
  return saved.edges
    .filter(
      (e): e is (typeof saved.edges)[number] =>
        typeof e.id === "string" &&
        typeof e.source === "string" &&
        typeof e.target === "string",
    )
    .map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      type: e.type || undefined,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
      data:
        e.data != null && typeof e.data === "object"
          ? (e.data as Record<string, unknown> | undefined)
          : undefined,
    }));
}

/** Filter nodes to only class nodes */
function getClassNodes(nodes: DiagramNode[]) {
  return nodes.filter((n) => n.type === "classNode") as ClassNodeType[];
}

function materializePattern(pattern: PatternDefinition) {
  const classNodes = pattern.nodes.map((n) => ({
    ...n,
    type: "classNode" as const,
  }));

  return {
    nodes: classNodes,
    edges: pattern.edges,
  };
}

/** Clear selection from all nodes/edges. */
function clearSelection(nodes: ClassNodeType[], edges: Edge[]) {
  return {
    nodes: nodes.map((n) => ({ ...n, selected: false })),
    edges: edges.map((e) => ({ ...e, selected: false })),
  };
}

/**
 * Fix edge routing after ELK layout.
 *
 * ELK reverses inheritance/aggregation edges so parents sit above children.
 * React Flow still renders the original edge direction (child → parent) and
 * defaults to exiting from the source’s BOTTOM handle — which produces a
 * downward loop when the target is above the source.
 *
 * Setting sourcePosition=Top / targetPosition=Bottom makes the edge exit
 * from the child’s top and enter the parent’s bottom, giving a clean
 * straight-up arrow with no looping.
 */
function applyEdgeRouting(
  edges: Edge[],
  nodes: { id: string; position: { x: number; y: number } }[],
): Edge[] {
  const posMap = new Map(nodes.map((n) => [n.id, n.position]));
  return edges.map((edge) => {
    if (edge.type !== "inheritance" && edge.type !== "aggregation") return edge;
    const src = posMap.get(edge.source);
    const tgt = posMap.get(edge.target);
    if (!src || !tgt) return edge;
    // target above source → edge must travel upward
    if (tgt.y < src.y) {
      return {
        ...edge,
        sourcePosition: Position.Top,
        targetPosition: Position.Bottom,
      };
    }
    // target below source → normal downward routing
    return {
      ...edge,
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    };
  });
}

// ─── Diagram Canvas ────────────────────────────────────────────────────────

function DiagramCanvas({
  initialPatternId,
}: {
  initialPatternId?: string | null;
}) {
  const { resolvedTheme } = useTheme();
  const reactFlow = useReactFlow();

  const nodeIdRef = useRef(0);

  // Read saved diagram synchronously before first render so the empty state
  // never flashes. useState lazy initializer runs once on mount, before paint.
  const [initialSaved] = useState(() => readSavedDiagram());

  // True while an initial pattern is being pre-computed (ELK is async).
  // Suppresses the empty state so it never flashes before nodes appear.
  const hasInitialPattern =
    !!initialPatternId ||
    (typeof window !== "undefined" &&
      !!new URLSearchParams(window.location.search).get("reference"));
  const [isInitializing, setIsInitializing] = useState(
    !initialSaved && hasInitialPattern,
  );

  const {
    pushHistory,
    canUndo: _canUndo,
    canRedo: _canRedo,
    undo,
    redo,
    clearHistory,
    resetUndoRedoFlag,
  } = useDiagramHistory();

  const [nodes, setNodes, onNodesChangeRaw] = useNodesState<
    ClassNodeType | ExplanationNodeType
  >(deserializeNodes(initialSaved));
  const [edges, setEdges, onEdgesChangeRaw] = useEdgesState<Edge>(
    deserializeEdges(initialSaved),
  );

  // Seed nodeIdRef from saved counter so new nodes get non-conflicting ids
  if (initialSaved?.nodeIdCounter && nodeIdRef.current === 0) {
    nodeIdRef.current = initialSaved.nodeIdCounter;
  }

  // Generation counter to prevent race conditions in async loadPattern
  const loadGenerationRef = useRef(0);

  // useTransition hook for loading indicators during heavy state changes
  const [_isTransitioning, startTransition] = useTransition();

  // Pass raw handlers directly — history is pushed at explicit action points
  // (addNode, addExplanationCard, resetDiagram, deletions), not on every drag/move.
  const onNodesChange = onNodesChangeRaw;
  const onEdgesChange = onEdgesChangeRaw;

  // Zustand store for volatile state — replaces useState + context (Fix 3.1)
  const selection = useDiagramSelection();
  const activeEdgeType = useDiagramActiveEdgeType();
  const activePatternId = useDiagramActivePatternId();
  const { setSelection, setActiveEdgeType, setActivePatternId } =
    useDiagramStore();

  const activeEdgeTypeRef = useRef(activeEdgeType);

  // Sync ref via useLayoutEffect — safe in concurrent mode
  useLayoutEffect(() => {
    activeEdgeTypeRef.current = activeEdgeType;
  }, [activeEdgeType]);

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const { layout: autoLayout, computeLayout } = useAutoLayout(
    nodes,
    setNodes,
    edges,
  );
  const { saveDiagram, clearDiagram } = useDiagramPersistence();
  // ── Restore saved diagram or load pattern from URL ───────────────────

  const onSelectionChange = useCallback(
    ({
      nodes: selNodes,
      edges: selEdges,
    }: {
      nodes: Node[];
      edges: Edge[];
    }) => {
      setSelection({
        nodeIds: selNodes.map((n) => n.id),
        edgeIds: selEdges.map((e) => e.id),
      });
    },
    [setSelection],
  );

  useOnSelectionChange({
    onChange: onSelectionChange,
  });

  // Primary selection for properties panel (last selected item)
  const primarySelection = useMemo<PrimarySelection>(() => {
    if (selection.nodeIds.length > 0) {
      const nodeId = selection.nodeIds[selection.nodeIds.length - 1];
      const node = nodes.find((n) => n.id === nodeId);
      return {
        kind: "node" as const,
        id: nodeId,
        nodeType: node?.type ?? "",
      };
    }
    if (selection.edgeIds.length > 0) {
      return {
        kind: "edge" as const,
        id: selection.edgeIds[selection.edgeIds.length - 1],
      };
    }
    return null;
  }, [selection, nodes]);

  const _selectedNode = useMemo(() => {
    if (
      primarySelection?.kind !== "node" ||
      primarySelection.nodeType !== "classNode"
    )
      return undefined;
    return nodes.find(
      (n) => n.id === primarySelection.id && n.type === "classNode",
    ) as ClassNodeType | undefined;
  }, [primarySelection, nodes]);

  const selectedExplanation = useMemo(() => {
    if (
      primarySelection?.kind !== "node" ||
      primarySelection.nodeType !== "explanation"
    )
      return undefined;
    return nodes.find(
      (n) => n.id === primarySelection.id && n.type === "explanation",
    ) as ExplanationNodeType | undefined;
  }, [primarySelection, nodes]);

  const selectedEdge = useMemo(() => {
    if (primarySelection?.kind !== "edge") return undefined;
    return edges.find((e) => e.id === primarySelection.id);
  }, [primarySelection, edges]);

  const activePattern = useMemo(
    () =>
      activePatternId ? (PATTERN_BY_ID.get(activePatternId) ?? null) : null,
    [activePatternId],
  );

  // Ref to keep explanation id stable during selection transitions
  // (PropertiesPanel callbacks survive deselection — ref prevents silent no-op)
  const selectedExplanationIdRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (selectedExplanation?.id) {
      selectedExplanationIdRef.current = selectedExplanation.id;
    }
  }, [selectedExplanation?.id]);

  // Memoized class node list for PropertiesPanel dropdown.
  // Position changes trigger recomputation but useDeferredValue keeps it responsive.
  const classNodesList = useMemo(() => {
    const next = getClassNodes(nodes).map((n) => ({
      id: n.id,
      name: n.data.name,
    }));
    return next;
  }, [nodes]);

  // Defer the list to keep dropdown responsive during rapid node changes
  const deferredClassNodesList = useDeferredValue(classNodesList);

  // ── Actions ────────────────────────────────────────────────────────────

  const focusDiagram = useCallback(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        reactFlow.fitView({
          padding: 0.15,
          duration: prefersReduced ? 0 : 320,
        });
      });
    });
  }, [reactFlow]);

  // Auto-fit once on mount when restoring a saved diagram.
  // Nodes are seeded synchronously so React Flow has them on the first render;
  // the double-rAF gives React Flow time to measure node dimensions first.
  useEffect(() => {
    if (initialSaved && initialSaved.nodes.length > 0) {
      focusDiagram();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — runs exactly once after mount

  const layout = useCallback(
    async (direction: "TB" | "LR" = "TB") => {
      await autoLayout(direction);
      // autoLayout commits via flushSync so getNodes() already has the new positions
      const layoutedNodes = reactFlow.getNodes() as DiagramNode[];
      const newEdges = applyEdgeRouting(reactFlow.getEdges(), layoutedNodes);
      setEdges(newEdges);
      pushHistory(layoutedNodes, newEdges);
      focusDiagram();
    },
    [autoLayout, focusDiagram, reactFlow, setEdges, pushHistory],
  );

  const addNode = useCallback(
    (stereotype: ClassNodeData["stereotype"]) => {
      const id = String(++nodeIdRef.current);
      const index = nodeIdRef.current - 1;
      const newNode: ClassNodeType = {
        id,
        type: "classNode",
        position: {
          x: 120 + (index % 3) * 280,
          y: 120 + Math.floor(index / 3) * 190,
        },
        data: {
          name: "NewClass",
          stereotype,
          role: "",
          summary: "",
          files: [],
          reviewNotes: "",
          fields: [],
          methods: [],
          color: null,
        },
      };
      // Compute post-mutation state before calling React — no side effects in updaters
      const currentNodes = reactFlow.getNodes() as DiagramNode[];
      const currentEdges = reactFlow.getEdges();
      const newNodes: DiagramNode[] = [
        ...currentNodes.map((n) => ({ ...n, selected: false })),
        newNode,
      ];
      const newEdges = currentEdges.map((e) => ({ ...e, selected: false }));
      setNodes(newNodes);
      setEdges(newEdges);
      pushHistory(newNodes, newEdges);
      setSelection({ nodeIds: [], edgeIds: [] });
      setContextMenu(null);
      // Fit view after node is added
      requestAnimationFrame(() => {
        const prefersReduced = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        reactFlow.fitView({
          padding: 0.24,
          duration: prefersReduced ? 0 : 300,
        });
      });
      // Save immediately for explicit mutations (deferred until commit)
      requestAnimationFrame(() => {
        try {
          saveDiagram(
            reactFlow.getNodes() as DiagramNode[],
            reactFlow.getEdges(),
            nodeIdRef.current,
            activePatternId,
          );
        } catch {
          toast.error("Diagram could not be saved — browser storage is full.");
        }
      });
    },
    [
      setNodes,
      setEdges,
      reactFlow,
      pushHistory,
      saveDiagram,
      activePatternId,
      setSelection,
    ],
  );

  const addExplanationCard = useCallback(() => {
    const center = reactFlow.screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });

    // Compute post-mutation state before calling React — no side effects in updaters
    const currentNodes = reactFlow.getNodes() as DiagramNode[];
    const currentEdges = reactFlow.getEdges();
    const existingCards = currentNodes.filter(
      (n) => n.type === "explanation",
    ) as ExplanationNodeType[];
    const id = `expl-${++nodeIdRef.current}`;
    const newNode: ExplanationNodeType = {
      id,
      type: "explanation",
      position: { x: center.x + 50, y: center.y + 50 },
      data: {
        number: existingCards.length + 1,
        title: "New Card",
        body: "",
        targetNodeId: null,
      },
    };
    const newNodes: DiagramNode[] = [
      ...currentNodes.map((n) => ({ ...n, selected: false })),
      newNode,
    ];
    setNodes(newNodes);
    pushHistory(newNodes, currentEdges);
    setSelection({ nodeIds: [], edgeIds: [] });
    setContextMenu(null);
  }, [setNodes, reactFlow, pushHistory, setSelection]);

  const resetDiagram = useCallback(() => {
    nodeIdRef.current = 0;
    clearDiagram();
    clearHistory();
    startTransition(() => {
      setNodes([]);
      setEdges([]);
      setSelection({ nodeIds: [], edgeIds: [] });
      setContextMenu(null);
      setActivePatternId(null);
    });
  }, [
    setEdges,
    setNodes,
    clearDiagram,
    clearHistory,
    setActivePatternId,
    setSelection,
  ]);

  const loadPattern = useCallback(
    (patternId: string) => {
      const pattern = PATTERN_BY_ID.get(patternId);
      if (!pattern) {
        toast.error(`Pattern "${patternId}" not found.`);
        return;
      }

      const next = materializePattern(pattern);
      nodeIdRef.current =
        next.nodes.reduce((max, n) => Math.max(max, Number(n.id)), 0) || 0;

      clearHistory();

      // Bump generation counter so stale callbacks from prior invocations
      // can be detected and discarded (race-condition guard).
      const generation = ++loadGenerationRef.current;

      // Pre-compute ELK positions before touching React state so there is
      // only ever one render — with the final laid-out positions. This
      // eliminates the "raw positions flash → ELK reposition" double-render
      // that caused fitView to animate toward the wrong shape.
      computeLayout(next.nodes, next.edges, "TB")
        .then((layoutedNodes) => {
          // If a newer loadPattern call started while we were computing,
          // discard these stale results.
          if (generation !== loadGenerationRef.current) return;

          // flushSync forces React to commit synchronously so React Flow's
          // internal store is populated before focusDiagram's fitView fires.
          // Without this, fitView runs against an empty store and the nodes
          // sit at ELK's (0, 0) origin with no auto-fit.
          flushSync(() => {
            setNodes(layoutedNodes);
            setEdges(applyEdgeRouting(next.edges, layoutedNodes));
          });

          setIsInitializing(false);

          // Volatile UI state can be deferred — doesn't affect layout.
          startTransition(() => {
            setSelection({ nodeIds: [], edgeIds: [] });
            setContextMenu(null);
            setActivePatternId(patternId);
          });

          // fitView after React Flow has painted the new positions
          focusDiagram();
        })
        .catch((err) => {
          if (generation !== loadGenerationRef.current) return;
          console.error("[loadPattern] layout failed:", err);
          setIsInitializing(false);
          // Fallback: render raw positions and let the user trigger layout manually
          setNodes(next.nodes);
          setEdges(next.edges);
          startTransition(() => {
            setSelection({ nodeIds: [], edgeIds: [] });
            setContextMenu(null);
            setActivePatternId(patternId);
          });
        });
    },
    [
      setEdges,
      setNodes,
      setActivePatternId,
      setSelection,
      clearHistory,
      computeLayout,
      focusDiagram,
    ],
  );

  const onConnect: OnConnect = useCallback(
    (connection) => {
      // Block connections involving explanation cards — they connect via properties panel only
      const currentNodes = reactFlow.getNodes();
      const sourceIsExplanation = currentNodes.some(
        (n) => n.id === connection.source && n.type === "explanation",
      );
      const targetIsExplanation = currentNodes.some(
        (n) => n.id === connection.target && n.type === "explanation",
      );
      if (sourceIsExplanation || targetIsExplanation) {
        toast("Explanation cards connect via the Properties panel", {
          duration: 2500,
        });
        return;
      }

      // Compute new edges outside the updater — no side effects in updaters
      const newEdges = addEdge(
        { ...connection, type: activeEdgeTypeRef.current },
        reactFlow.getEdges(),
      );
      setEdges(newEdges);
      pushHistory(reactFlow.getNodes() as DiagramNode[], newEdges);
    },
    [setEdges, reactFlow, pushHistory],
  );

  const onNodeClick = useCallback((_e: React.MouseEvent, _node: Node) => {
    setContextMenu(null);
  }, []);

  const onEdgeClick = useCallback((_e: React.MouseEvent, _edge: Edge) => {
    setContextMenu(null);
  }, []);

  const onPaneClick = useCallback(() => {
    setNodes((nds) => {
      const hasSelected = nds.some((n) => n.selected);
      return hasSelected ? nds.map((n) => ({ ...n, selected: false })) : nds;
    });
    setEdges((eds) => {
      const hasSelected = eds.some((e) => e.selected);
      return hasSelected ? eds.map((e) => ({ ...e, selected: false })) : eds;
    });
    setSelection({ nodeIds: [], edgeIds: [] });
    setContextMenu(null);
  }, [setNodes, setEdges, setSelection]);

  const onEdgeContextMenu = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      event.preventDefault();
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        type: "edge",
        edge,
      });
    },
    [],
  );

  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        type: "node",
        node,
      });
    },
    [],
  );

  // Primary save trigger — save when drag ends (not on every drag frame)
  const onNodeDragStop = useCallback(() => {
    setContextMenu(null);
    const currentNodes = reactFlow.getNodes() as DiagramNode[];
    const currentEdges = reactFlow.getEdges();
    // Push the NEW state after drag
    pushHistory(currentNodes, currentEdges);
    saveDiagram(currentNodes, currentEdges, nodeIdRef.current, activePatternId);
  }, [reactFlow, saveDiagram, activePatternId, pushHistory]);

  // ── Context values — Actions (stable, Zustand handles volatile) ───

  const actionsValue: DiagramActionsContextValue = useMemo(
    () => ({
      addNode,
      addExplanationCard,
      layout,
      loadPattern,
      resetDiagram,
    }),
    [addNode, addExplanationCard, layout, loadPattern, resetDiagram],
  );

  // Memoized defaultEdgeOptions — prevents new object on every render (Issue 32)
  const defaultEdgeOptions = useMemo(
    () => ({ type: activeEdgeType }),
    [activeEdgeType],
  );

  useKeyboardShortcuts(selection, setSelection, {
    addNode,
    onLayout: () => layout("TB"),
    onEdgeTypeChange: setActiveEdgeType,
    onUndo: () => {
      const prev = undo();
      if (prev) {
        resetUndoRedoFlag();
        setNodes(prev.nodes as (ClassNodeType | ExplanationNodeType)[]);
        setEdges(prev.edges);
      }
    },
    onRedo: () => {
      const next = redo();
      if (next) {
        resetUndoRedoFlag();
        setNodes(next.nodes as (ClassNodeType | ExplanationNodeType)[]);
        setEdges(next.edges);
      }
    },
    onDelete: () => {
      const { nodeIds, edgeIds } = selection;
      const nodeIdSet = new Set(nodeIds);
      const edgeIdSet = new Set(edgeIds);

      // Compute post-mutation state upfront — no side effects in updaters
      let explanationCounter = 0;
      const newNodes = (nodes as DiagramNode[])
        .filter((n) => !nodeIdSet.has(n.id))
        .map((n) => {
          if (n.type === "explanation" && n.data) {
            explanationCounter++;
            return {
              ...n,
              data: {
                ...n.data,
                number: explanationCounter,
                targetNodeId:
                  n.data.targetNodeId && nodeIdSet.has(n.data.targetNodeId)
                    ? null
                    : n.data.targetNodeId,
              },
            };
          }
          return n;
        });
      const newEdges = edges.filter(
        (e) =>
          !edgeIdSet.has(e.id) &&
          !nodeIdSet.has(e.source) &&
          !nodeIdSet.has(e.target),
      );

      reactFlow.deleteElements({
        nodes: nodeIds.map((id) => ({ id })),
        edges: edgeIds.map((id) => ({ id })),
      });
      setNodes(newNodes);
      setEdges(newEdges);
      pushHistory(newNodes as DiagramNode[], newEdges);
    },
  });

  // ── Stable onSelectNode callback — uses reactFlow.getNodes/Edges ──

  const onSelectNode = useCallback(
    (id: string) => {
      const currentNodes = reactFlow.getNodes() as DiagramNode[];
      const currentEdges = reactFlow.getEdges();
      const classNds = currentNodes.filter(
        (n) => n.type === "classNode",
      ) as ClassNodeType[];
      const cleared = clearSelection(classNds, currentEdges);
      setEdges(cleared.edges);
      setNodes(
        currentNodes.map((n) =>
          n.id === id ? { ...n, selected: true } : { ...n, selected: false },
        ),
      );
      setSelection({ nodeIds: [id], edgeIds: [] });
    },
    [reactFlow, setNodes, setEdges, setSelection],
  );

  // ── Restore saved diagram or load pattern from URL ───────────────────
  // Saved diagram is already seeded into useNodesState/useEdgesState via the
  // initialSaved lazy-initializer above — no async effect needed for that path.
  // This effect only handles the ?reference= URL param (fresh session, no save).

  useEffect(() => {
    if (initialSaved) {
      // Already loaded synchronously — just restore volatile Zustand state.
      if (initialSaved.activePatternId) {
        setActivePatternId(initialSaved.activePatternId);
      }
      return;
    }
    // No saved diagram: check for a pattern requested via URL / prop
    const requestedPatternId =
      initialPatternId ??
      new URLSearchParams(window.location.search).get("reference");
    if (requestedPatternId && PATTERN_BY_ID.has(requestedPatternId)) {
      loadPattern(requestedPatternId);
    }
  }, [initialSaved, initialPatternId, loadPattern, setActivePatternId]);

  // ── Render ───────────────────────────────────────────────────────────

  return (
    <DiagramActionsContext value={actionsValue}>
      <div className="relative flex h-screen flex-row bg-background">
        {/* Mobile fallback */}
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background p-8 text-center lg:hidden">
          <h2 className="font-heading text-2xl font-semibold">
            Relato needs more space
          </h2>
          <p className="max-w-xs text-sm text-muted-foreground">
            The diagram builder requires a wider screen. Please use a device
            with at least 1024px width or rotate to landscape.
          </p>
          <Link
            href="/"
            className="inline-flex h-9 items-center justify-center rounded-4xl border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            ← Back to Home
          </Link>
        </div>

        {/* Left sidebar */}
        <LeftSidebar
          activePattern={activePattern}
          selection={selection}
          onSelectNode={onSelectNode}
          onLoadPattern={loadPattern}
          onReset={resetDiagram}
        />

        {/* Canvas area */}
        <main className="relative flex min-w-0 flex-1">
          {/* Home link — top-left corner of canvas */}
          <Link
            href="/"
            className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-md border border-border bg-background/90 px-2.5 py-1.5 text-sm font-semibold text-foreground shadow-sm backdrop-blur transition-colors hover:bg-muted"
            aria-label="Back to home page"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden
            >
              <rect
                x="1"
                y="1"
                width="5"
                height="5"
                rx="1"
                className="fill-primary"
              />
              <rect
                x="10"
                y="1"
                width="5"
                height="5"
                rx="1"
                className="fill-primary/60"
              />
              <rect
                x="1"
                y="10"
                width="5"
                height="5"
                rx="1"
                className="fill-primary/60"
              />
              <rect
                x="10"
                y="10"
                width="5"
                height="5"
                rx="1"
                className="fill-primary/30"
              />
            </svg>
            Relato
          </Link>
          <ReactFlow
            aria-label="Architecture diagram"
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={allEdgeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            onNodeContextMenu={onNodeContextMenu}
            onEdgeContextMenu={onEdgeContextMenu}
            onNodeDragStop={onNodeDragStop}
            onPaneClick={onPaneClick}
            colorMode={resolvedTheme === "dark" ? "dark" : "light"}
            defaultEdgeOptions={defaultEdgeOptions}
            elevateEdgesOnSelect
            nodesFocusable
            edgesFocusable
            selectNodesOnDrag={false}
            multiSelectionKeyCode={["Meta", "Control"]}
            selectionKeyCode="Shift"
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={24}
              size={1.2}
              className="opacity-55"
            />
            <Controls showInteractive={false} />
            <MiniMap
              nodeColor={resolvedTheme === "dark" ? "#3f3f46" : "#e7e5e4"}
              maskColor={
                resolvedTheme === "dark"
                  ? "rgba(0,0,0,0.36)"
                  : "rgba(255,255,255,0.72)"
              }
              className="rounded-lg! border-border! bg-background/90! shadow-sm!"
            />
          </ReactFlow>

          {/* Empty state */}
          {nodes.length === 0 && !isInitializing && <EmptyCanvas />}

          {/* Context menu */}
          {contextMenu && (
            <DiagramContextMenu
              state={contextMenu}
              onClose={() => setContextMenu(null)}
              onDuplicateNode={() => {
                if (contextMenu?.type !== "node") return;
                const original = nodes.find(
                  (n) => n.id === contextMenu.node?.id,
                );
                // Only duplicate class nodes, not explanation cards
                if (!original || original.type !== "classNode") return;

                const id = String(++nodeIdRef.current);
                const duplicate: ClassNodeType = {
                  id,
                  type: "classNode",
                  position: {
                    x: original.position.x + 40,
                    y: original.position.y + 40,
                  },
                  data: { ...original.data },
                  selected: true,
                };
                // Preserve all node types (class + explanation) when deselecting
                const newNodes: DiagramNode[] = [
                  ...(nodes.map((n) => ({ ...n, selected: false })) as DiagramNode[]),
                  duplicate,
                ];
                const newEdges = edges.map((e) => ({ ...e, selected: false }));
                setNodes(newNodes);
                setEdges(newEdges);
                pushHistory(newNodes, newEdges);
                setSelection({ nodeIds: [id], edgeIds: [] });
                setContextMenu(null);
              }}
              onUpdateNode={(nodeId, patch) => {
                const newNodes = (reactFlow.getNodes() as DiagramNode[]).map(
                  (n) =>
                    n.id === nodeId
                      ? ({ ...n, data: { ...n.data, ...patch } } as DiagramNode)
                      : n,
                );
                const currentEdges = reactFlow.getEdges();
                setNodes(newNodes);
                pushHistory(newNodes, currentEdges);
              }}
              onUpdateEdge={(patch) => {
                const edgeId = contextMenu.edge?.id;
                if (!edgeId) return;
                const currentNodes = reactFlow.getNodes() as DiagramNode[];
                const newEdges = reactFlow.getEdges().map((e) =>
                  e.id === edgeId
                    ? { ...e, ...patch, data: { ...e.data, ...patch.data } }
                    : e,
                );
                setEdges(newEdges);
                pushHistory(currentNodes, newEdges);
              }}
              onDeleteNode={() => {
                if (contextMenu?.type === "node" && contextMenu.node) {
                  const idsToDelete =
                    selection.nodeIds.length > 0
                      ? selection.nodeIds
                      : [contextMenu.node.id];
                  const deletedCount = idsToDelete.length;
                  const deletedIdSet = new Set(idsToDelete);

                  // Compute post-mutation state upfront — no side effects in updaters
                  let explanationCounter = 0;
                  const newNodes = nodes
                    .filter((n) => !deletedIdSet.has(n.id))
                    .map((n) => {
                      if (n.type === "explanation" && n.data) {
                        explanationCounter++;
                        return {
                          ...n,
                          data: {
                            ...n.data,
                            number: explanationCounter,
                            targetNodeId:
                              n.data.targetNodeId &&
                              deletedIdSet.has(n.data.targetNodeId)
                                ? null
                                : n.data.targetNodeId,
                          },
                        };
                      }
                      return n;
                    }) as DiagramNode[];
                  const newEdges = edges.filter(
                    (e) =>
                      !deletedIdSet.has(e.source) &&
                      !deletedIdSet.has(e.target),
                  );

                  setNodes(newNodes);
                  setEdges(newEdges);
                  pushHistory(newNodes, newEdges);
                  setSelection({ nodeIds: [], edgeIds: [] });
                  toast(
                    `${deletedCount} node${deletedCount > 1 ? "s" : ""} deleted`,
                  );
                }
                setContextMenu(null);
              }}
              onDeleteEdge={() => {
                if (contextMenu?.type === "edge" && contextMenu.edge) {
                  const idsToDelete =
                    selection.edgeIds.length > 0
                      ? selection.edgeIds
                      : [contextMenu.edge.id];
                  const idsToDeleteSet = new Set(idsToDelete);
                  const currentNodes = nodes as DiagramNode[];
                  const newEdges = edges.filter(
                    (e) => !idsToDeleteSet.has(e.id),
                  );
                  setEdges(newEdges);
                  pushHistory(currentNodes, newEdges);
                  setSelection({ nodeIds: [], edgeIds: [] });
                }
                setContextMenu(null);
              }}
            />
          )}
        </main>

        {/* Right properties panel — Activity preserves state across selection changes */}
        <Activity mode={primarySelection ? "visible" : "hidden"}>
          <div className="hidden w-85 shrink-0 border-l border-border bg-background lg:block">
            <PropertiesPanel
              nodeId={
                primarySelection?.kind === "node" ? primarySelection.id : null
              }
              nodeType={
                primarySelection?.kind === "node"
                  ? primarySelection.nodeType
                  : null
              }
              classNodes={deferredClassNodesList}
              edgeType={(selectedEdge?.type as DiagramEdgeType) ?? null}
              edgeId={
                primarySelection?.kind === "edge" ? primarySelection.id : null
              }
              edgeData={
                (selectedEdge?.data as {
                  label?: string;
                  curvature?: number;
                  color?: string;
                  strokeWidth?: number;
                }) ?? null
              }
              onUpdateExplanation={(patch) => {
                const eid = selectedExplanationIdRef.current;
                if (!eid) return;
                const newNodes = (reactFlow.getNodes() as DiagramNode[]).map(
                  (n) =>
                    n.id === eid
                      ? ({ ...n, data: { ...n.data, ...patch } } as DiagramNode)
                      : n,
                );
                const currentEdges = reactFlow.getEdges();
                setNodes(newNodes);
                pushHistory(newNodes, currentEdges);
              }}
              onSetExplanationTarget={(targetNodeId) => {
                const eid = selectedExplanationIdRef.current;
                if (!eid) return;

                const oldAnchorId = `anchor-${eid}`;

                // Compute both new states before any React update
                const newNodes = (reactFlow.getNodes() as DiagramNode[]).map(
                  (n) =>
                    n.id === eid
                      ? ({ ...n, data: { ...n.data, targetNodeId } } as DiagramNode)
                      : n,
                );
                const withoutOld = reactFlow
                  .getEdges()
                  .filter((e) => e.id !== oldAnchorId);
                const newEdges: Edge[] = targetNodeId
                  ? [
                      ...withoutOld,
                      {
                        id: oldAnchorId,
                        source: eid,
                        target: targetNodeId,
                        sourceHandle: "anchor",
                        type: anchorEdgeType,
                        selectable: false,
                        focusable: false,
                      },
                    ]
                  : withoutOld;

                setNodes(newNodes);
                setEdges(newEdges);
                pushHistory(newNodes, newEdges);
              }}
            />
          </div>
        </Activity>

        {/* Bottom toolbar */}
        <BottomToolbar />
      </div>
    </DiagramActionsContext>
  );
}

// ─── Public API ─────────────────────────────────────────────────────────────

export function DiagramBuilder({
  initialPatternId,
}: {
  initialPatternId?: string | null;
}) {
  return (
    <ReactFlowProvider>
      <DiagramCanvas initialPatternId={initialPatternId} />
    </ReactFlowProvider>
  );
}
