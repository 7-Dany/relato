import type {
  ClassDiagramNode,
  DiagramCommand,
  DiagramCommandResult,
  DiagramEdgeId,
  DiagramEdgeKind,
  DiagramNodeId,
  DiagramPoint,
  DiagramSelection,
  NoteDiagramNode,
  SavedDiagram,
} from "../../domain"

export type DiagramSessionState = {
  diagram: SavedDiagram
  selection: DiagramSelection
  activeEdgeKind: DiagramEdgeKind
  dirty: boolean
}

export function applyDiagramCommand(
  state: DiagramSessionState,
  command: DiagramCommand
): DiagramCommandResult {
  switch (command.type) {
    case "rename-diagram": {
      const title = command.title.trim() || "Untitled diagram"
      return changed(state, { ...state.diagram, title })
    }
    case "replace-diagram":
      return {
        diagram: command.diagram,
        selection: null,
        activeEdgeKind: state.activeEdgeKind,
        changed: true,
      }
    case "insert-diagram-template":
      return insertDiagramTemplate(state, command.diagram)
    case "select":
      return {
        diagram: state.diagram,
        selection: command.selection,
        activeEdgeKind: state.activeEdgeKind,
        changed: false,
      }
    case "set-active-edge-kind":
      return {
        diagram: state.diagram,
        selection: state.selection,
        activeEdgeKind: command.kind,
        changed: false,
      }
    case "add-class-node": {
      const node = createClassNode(command.position, command.node)
      return changed(
        state,
        { ...state.diagram, nodes: [...state.diagram.nodes, node] },
        { kind: "node", id: node.id }
      )
    }
    case "add-note-node": {
      const noteNumber =
        state.diagram.nodes.filter((node) => node.kind === "note").length + 1
      const node = createNoteNode(command.position, noteNumber, command.node)
      return changed(
        state,
        { ...state.diagram, nodes: [...state.diagram.nodes, node] },
        { kind: "node", id: node.id }
      )
    }
    case "update-class-node":
      return changedCosmetic(state, {
        ...state.diagram,
        nodes: state.diagram.nodes.map((node) =>
          node.id === command.id && node.kind === "class"
            ? { ...node, ...command.patch, id: node.id, kind: node.kind }
            : node
        ),
      })
    case "update-note-node":
      return changedCosmetic(state, {
        ...state.diagram,
        nodes: state.diagram.nodes.map((node) =>
          node.id === command.id && node.kind === "note"
            ? { ...node, ...command.patch, id: node.id, kind: node.kind }
            : node
        ),
      })
    case "move-node":
      return changedCosmetic(state, {
        ...state.diagram,
        nodes: state.diagram.nodes.map((node) =>
          node.id === command.id
            ? { ...node, position: command.position }
            : node
        ),
      })
    case "layout-diagram": {
      const posMap = new Map(command.positions.map((p) => [p.id, p.position]))
      return changed(state, {
        ...state.diagram,
        nodes: state.diagram.nodes.map((node) => {
          const newPos = posMap.get(node.id)
          return newPos ? { ...node, position: newPos } : node
        }),
      })
    }
    case "connect-nodes": {
      const edge = {
        ...command.edge,
        id: command.edge.id ?? createEdgeId(),
      }
      return changed(
        state,
        { ...state.diagram, edges: [...state.diagram.edges, edge] },
        { kind: "edge", id: edge.id }
      )
    }
    case "update-edge":
      return changedCosmetic(state, {
        ...state.diagram,
        edges: state.diagram.edges.map((edge) =>
          edge.id === command.id
            ? { ...edge, ...command.patch, id: edge.id }
            : edge
        ),
      })
    case "delete-selection":
      if (!command.selection) return unchanged(state)
      if (command.selection.kind === "edge") {
        return changed(
          state,
          {
            ...state.diagram,
            edges: state.diagram.edges.filter(
              (edge) => edge.id !== command.selection?.id
            ),
          },
          null
        )
      }
      return changed(
        state,
        {
          ...state.diagram,
          nodes: state.diagram.nodes
            .filter((node) => node.id !== command.selection?.id)
            .map((node, _, arr) => {
              // Re-number notes after deletion
              if (node.kind !== "note") return node
              const notesBefore = arr
                .filter((n) => n.kind === "note")
                .indexOf(node)
              return { ...node, number: notesBefore + 1 }
            }),
          edges: state.diagram.edges.filter(
            (edge) =>
              edge.source !== command.selection?.id &&
              edge.target !== command.selection?.id
          ),
        },
        null
      )
    case "delete-multiple": {
      const nodeSet = new Set(command.nodeIds)
      const edgeSet = new Set(command.edgeIds)
      return changed(
        state,
        {
          ...state.diagram,
          nodes: state.diagram.nodes
            .filter((node) => !nodeSet.has(node.id))
            .map((node, _, arr) => {
              if (node.kind !== "note") return node
              const notesBefore = arr
                .filter((n) => n.kind === "note")
                .indexOf(node)
              return { ...node, number: notesBefore + 1 }
            }),
          edges: state.diagram.edges.filter(
            (edge) =>
              !edgeSet.has(edge.id) &&
              !nodeSet.has(edge.source) &&
              !nodeSet.has(edge.target)
          ),
        },
        null
      )
    }
    case "duplicate-node": {
      const original = state.diagram.nodes.find((n) => n.id === command.id)
      if (!original) return unchanged(state)

      if (original.kind === "note") {
        const clone: NoteDiagramNode = {
          ...original,
          id: createNodeId(),
          number:
            state.diagram.nodes.filter((node) => node.kind === "note").length +
            1,
          position: {
            x: original.position.x + 40,
            y: original.position.y + 40,
          },
        }
        return changed(
          state,
          { ...state.diagram, nodes: [...state.diagram.nodes, clone] },
          { kind: "node", id: clone.id }
        )
      }

      const clone: ClassDiagramNode = {
        ...original,
        id: createNodeId(),
        position: {
          x: original.position.x + 40,
          y: original.position.y + 40,
        },
      }
      return changed(
        state,
        { ...state.diagram, nodes: [...state.diagram.nodes, clone] },
        { kind: "node", id: clone.id }
      )
    }
    default:
      return unchanged(state)
  }
}

// ─── Factories ────────────────────────────────────────────────────────────────

function createNodeId(): DiagramNodeId {
  return `node-${crypto.randomUUID()}` as DiagramNodeId
}

function createEdgeId(): DiagramEdgeId {
  return `edge-${crypto.randomUUID()}` as DiagramEdgeId
}

function createClassNode(
  position: ClassDiagramNode["position"],
  patch: Partial<ClassDiagramNode> = {}
): ClassDiagramNode {
  return {
    position,
    name: "ClassName",
    stereotype: null,
    role: "",
    summary: "",
    files: [],
    reviewNotes: "",
    fields: [],
    methods: [],
    color: null,
    ...patch,
    id: patch.id ?? createNodeId(),
    kind: "class",
  }
}

function createNoteNode(
  position: NoteDiagramNode["position"],
  number: number,
  patch: Partial<NoteDiagramNode> = {}
): NoteDiagramNode {
  return {
    position,
    number,
    title: "Note",
    body: "",
    targetNodeId: null,
    ...patch,
    id: patch.id ?? createNodeId(),
    kind: "note",
  }
}

function insertDiagramTemplate(
  state: DiagramSessionState,
  template: SavedDiagram
): DiagramCommandResult {
  const idMap = new Map<DiagramNodeId, DiagramNodeId>()
  const offset = nextTemplateOffset(state.diagram.nodes.length)
  let noteNumber =
    state.diagram.nodes.filter((item) => item.kind === "note").length + 1

  for (const node of template.nodes) {
    idMap.set(node.id, createNodeId())
  }

  const nodes = template.nodes.map((node) => {
    const id = createNodeId()
    const mappedId = idMap.get(node.id) ?? id

    if (node.kind === "note") {
      return {
        ...node,
        id: mappedId,
        number: noteNumber++,
        targetNodeId: node.targetNodeId
          ? (idMap.get(node.targetNodeId) ?? null)
          : null,
        position: {
          x: node.position.x + offset.x,
          y: node.position.y + offset.y,
        },
      } satisfies NoteDiagramNode
    }

    return {
      ...node,
      id: mappedId,
      position: {
        x: node.position.x + offset.x,
        y: node.position.y + offset.y,
      },
    } satisfies ClassDiagramNode
  })

  const edges = template.edges.flatMap((edge) => {
    const source = idMap.get(edge.source)
    const target = idMap.get(edge.target)
    if (!source || !target) return []
    return {
      ...edge,
      id: createEdgeId(),
      source,
      target,
    }
  })

  return changed(
    state,
    {
      ...state.diagram,
      nodes: [...state.diagram.nodes, ...nodes],
      edges: [...state.diagram.edges, ...edges],
    },
    nodes[0] ? { kind: "node", id: nodes[0].id } : state.selection
  )
}

export function nextNodePosition(
  existingNodeCount: number,
  origin: DiagramPoint = { x: 80, y: 80 }
): DiagramPoint {
  return {
    x: origin.x + (existingNodeCount % 4) * 120,
    y: origin.y + Math.floor(existingNodeCount / 4) * 80,
  }
}

function nextTemplateOffset(
  existingNodeCount: number
): ClassDiagramNode["position"] {
  return nextNodePosition(existingNodeCount)
}

// ─── Result helpers ───────────────────────────────────────────────────────────

type ChangeKind = "structural" | "cosmetic"

function changed(
  state: DiagramSessionState,
  diagram: SavedDiagram,
  selection: DiagramSelection = state.selection,
  kind: ChangeKind = "structural"
): DiagramCommandResult {
  return {
    diagram:
      kind === "cosmetic"
        ? diagram
        : { ...diagram, updatedAt: new Date().toISOString() },
    selection,
    activeEdgeKind: state.activeEdgeKind,
    changed: true,
  }
}

function changedCosmetic(
  state: DiagramSessionState,
  diagram: SavedDiagram,
  selection: DiagramSelection = state.selection
): DiagramCommandResult {
  return changed(state, diagram, selection, "cosmetic")
}

function unchanged(state: DiagramSessionState): DiagramCommandResult {
  return {
    diagram: state.diagram,
    selection: state.selection,
    activeEdgeKind: state.activeEdgeKind,
    changed: false,
  }
}
