export type DiagramId = string & { readonly __brand: "DiagramId" }

export type DiagramNodeId = string & { readonly __brand: "DiagramNodeId" }

export type DiagramEdgeId = string & { readonly __brand: "DiagramEdgeId" }

export type DiagramEdgeKind =
  | "association"
  | "directed-association"
  | "dependency"
  | "inheritance"
  | "aggregation"
  | "composition"
  | "realization"

export type ClassStereotype = "interface" | "abstract" | null

export type DiagramPoint = {
  x: number
  y: number
}

export type ClassDiagramNode = {
  id: DiagramNodeId
  kind: "class"
  position: DiagramPoint
  name: string
  stereotype: ClassStereotype
  role: string
  summary: string
  files: string[]
  reviewNotes: string
  fields: string[]
  methods: string[]
  color: string | null
}

export type NoteDiagramNode = {
  id: DiagramNodeId
  kind: "note"
  position: DiagramPoint
  number: number
  title: string
  body: string
  targetNodeId: DiagramNodeId | null
}

export type DiagramNode = ClassDiagramNode | NoteDiagramNode

export type DiagramEdge = {
  id: DiagramEdgeId
  source: DiagramNodeId
  target: DiagramNodeId
  sourceHandle?: string | null
  targetHandle?: string | null
  kind: DiagramEdgeKind
  label: string
  sourceLabel: string
  targetLabel: string
  color: string | null
  strokeWidth: number
  curvature: number
}

export type SavedDiagram = {
  schemaVersion: 1
  id: DiagramId
  title: string
  description: string
  nodes: DiagramNode[]
  edges: DiagramEdge[]
  createdAt: string
  updatedAt: string
}

export type DiagramSummary = {
  id: DiagramId
  title: string
  description: string
  nodeCount: number
  edgeCount: number
  updatedAt: string
}
