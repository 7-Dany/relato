import { describe, expect, test } from "bun:test"

import { RELATO_PATTERN_BY_ID } from "./patterns"
import type { DiagramNodeId } from "../../domain"

describe("RELATO_PATTERNS", () => {
  test("keeps the full Observer blueprint from the original Relato workflow", () => {
    const observer = RELATO_PATTERN_BY_ID.get("observer")
    const diagram = observer?.createDiagram("2026-05-24T00:00:00.000Z")

    const ids = diagram?.nodes.map((node) => node.id) ?? []
    expect(ids).toEqual([
      "node-publisher" as DiagramNodeId,
      "node-engine" as DiagramNodeId,
      "node-observer" as DiagramNodeId,
      "node-subscriber" as DiagramNodeId,
      "node-strategy" as DiagramNodeId,
      "node-sms" as DiagramNodeId,
      "node-sse" as DiagramNodeId,
      "node-email" as DiagramNodeId,
      "node-client-manager" as DiagramNodeId,
    ])
    expect(diagram?.edges.length).toBe(8)
    expect(
      diagram?.edges.every((edge) => edge.sourceHandle && edge.targetHandle)
    ).toBe(true)
  })

  test("includes the original Singleton blueprint", () => {
    const singleton = RELATO_PATTERN_BY_ID.get("singleton")
    const diagram = singleton?.createDiagram("2026-05-24T00:00:00.000Z")

    expect(diagram?.nodes[0]?.kind).toBe("class")
    expect(
      diagram?.nodes[0]?.kind === "class" ? diagram.nodes[0].name : null
    ).toBe("Singleton")
    expect(diagram?.edges[0]?.source).toBe(diagram?.edges[0]?.target)
  })
})
