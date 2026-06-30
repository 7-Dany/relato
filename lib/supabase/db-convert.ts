import type { DiagramId, DiagramNode, DiagramEdge, SavedDiagram } from "@/components/relato/domain"

export interface DbDiagramRecord {
  id: string
  title: string
  description: string
  data: {
    nodes: unknown[]
    edges: unknown[]
    schemaVersion: number
  } | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export function toDbRecord(diagram: {
  id: DiagramId
  title: string
  description: string
  nodes: DiagramNode[]
  edges: DiagramEdge[]
  schemaVersion: number
}): {
  id: string
  title: string
  description: string
  data: { nodes: DiagramNode[]; edges: DiagramEdge[]; schemaVersion: number }
} {
  return {
    id: diagram.id,
    title: diagram.title,
    description: diagram.description,
    data: {
      nodes: diagram.nodes,
      edges: diagram.edges,
      schemaVersion: diagram.schemaVersion ?? 1,
    },
  }
}

export function fromDbRecord(record: DbDiagramRecord): SavedDiagram {
  return {
    schemaVersion: (record.data?.schemaVersion ?? 1) as 1,
    id: record.id as DiagramId,
    title: record.title,
    description: record.description,
    nodes: (record.data?.nodes ?? []) as DiagramNode[],
    edges: (record.data?.edges ?? []) as DiagramEdge[],
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  }
}
