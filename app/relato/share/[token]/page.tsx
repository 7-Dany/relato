import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { SharedDiagramView } from "@/components/relato/app/share/shared-diagram-view"
import type { DiagramId, DiagramNode, DiagramEdge } from "@/components/relato/domain"

export default async function SharedDiagramPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const supabase = await createClient()

  if (!supabase) {
    notFound()
  }

  const { data: share, error } = await supabase
    .from("diagram_shares")
    .select("*, diagrams(*)")
    .eq("token", token)
    .single()

  if (error || !share || !share.diagrams) {
    notFound()
  }

  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    notFound()
  }

  const diagram = share.diagrams as {
    id: string
    title: string
    description: string
    data: {
      nodes: unknown[]
      edges: unknown[]
      schemaVersion: number
    }
    created_at: string
    updated_at: string
  }

  const savedDiagram = {
    schemaVersion: 1 as const,
    id: diagram.id as DiagramId,
    title: diagram.title,
    description: diagram.description,
    nodes: (diagram.data?.nodes ?? []) as DiagramNode[],
    edges: (diagram.data?.edges ?? []) as DiagramEdge[],
    createdAt: diagram.created_at,
    updatedAt: diagram.updated_at,
  }

  return (
    <SharedDiagramView diagram={savedDiagram} />
  )
}
