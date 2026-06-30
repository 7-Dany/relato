import { describe, expect, test } from "bun:test"
import {
  createElement,
  isValidElement,
  type ElementType,
  type ReactElement,
  type ReactNode,
} from "react"
import { Handle } from "@xyflow/react"

import type { ClassDiagramNode } from "../domain"
import { RelatoDiagramNode } from "./diagram-node"

type ElementWithChildren = ReactElement<{ children?: ReactNode }>
type RenderableComponent = (props: Record<string, unknown>) => ReactNode

function classNode(patch: Partial<ClassDiagramNode> = {}): ClassDiagramNode {
  return {
    id: "node-a" as never,
    kind: "class",
    position: { x: 0, y: 0 },
    name: "ClassA",
    stereotype: null,
    role: "",
    summary: "",
    files: [],
    reviewNotes: "",
    fields: [],
    methods: [],
    color: null,
    ...patch,
  }
}

function collectElementProps(
  node: ReactNode,
  predicate: (props: Record<string, unknown>) => boolean,
  matches: Array<Record<string, unknown>> = []
) {
  if (Array.isArray(node)) {
    for (const child of node) collectElementProps(child, predicate, matches)
    return matches
  }

  if (!isValidElement(node)) return matches

  const element = node as ElementWithChildren
  const props = element.props as Record<string, unknown>
  if (predicate(props)) matches.push(props)

  const render = renderableComponent(element.type)
  if (render) {
    collectElementProps(
      render(element.props as Record<string, unknown>),
      predicate,
      matches
    )
    return matches
  }

  collectElementProps(element.props.children, predicate, matches)
  return matches
}

function collectHandleProps(
  node: ReactNode,
  handles: Array<Record<string, unknown>> = []
) {
  if (Array.isArray(node)) {
    for (const child of node) collectHandleProps(child, handles)
    return handles
  }

  if (!isValidElement(node)) return handles

  const element = node as ElementWithChildren
  if (element.type === Handle) {
    handles.push(element.props as Record<string, unknown>)
    return handles
  }

  const render = renderableComponent(element.type)
  if (render) {
    collectHandleProps(render(element.props as Record<string, unknown>), handles)
    return handles
  }

  collectHandleProps(element.props.children, handles)
  return handles
}

function renderableComponent(type: unknown): RenderableComponent | null {
  if (typeof type === "function") return type as RenderableComponent
  if (!type || typeof type !== "object" || !("type" in type)) return null

  const memoType = (type as { type: unknown }).type
  return typeof memoType === "function"
    ? (memoType as RenderableComponent)
    : null
}

describe("RelatoDiagramNode", () => {
  test("keeps the class title centered when long members widen the node", () => {
    const RelatoNodeForTest = RelatoDiagramNode as unknown as ElementType
    const titleProps = collectElementProps(
      createElement(RelatoNodeForTest, {
        id: "node-a",
        data: classNode({
          name: "Piece",
          stereotype: "interface",
          methods: ["+ getNextMove(Position, Board) Position[]"],
        }),
        selected: false,
      }),
      (props) => props.title === "Piece"
    )

    expect(titleProps.length).toBe(1)
    expect(String(titleProps[0]?.className).includes("mx-auto")).toBe(true)
  })

  test("prevents overlapping target handles from starting outgoing connections", () => {
    const RelatoNodeForTest = RelatoDiagramNode as unknown as ElementType
    const handles = collectHandleProps(
      createElement(RelatoNodeForTest, {
        id: "node-a",
        data: classNode(),
        selected: false,
      })
    )
    const sourceHandles = handles.filter((handle) => handle.type === "source")
    const targetHandles = handles.filter((handle) => handle.type === "target")

    expect(sourceHandles.map((handle) => handle.id).sort()).toEqual([
      "bottom",
      "left",
      "right",
      "top",
    ])
    expect(targetHandles.map((handle) => handle.id).sort()).toEqual([
      "target-bottom",
      "target-left",
      "target-right",
      "target-top",
    ])
    expect(
      targetHandles.every((handle) => handle.isConnectableStart === false)
    ).toBe(true)
    expect(
      sourceHandles.every((handle) => handle.isConnectableEnd === false)
    ).toBe(true)
  })

  test("makes source handles at least as large as target handles to avoid event dead zone", () => {
    const RelatoNodeForTest = RelatoDiagramNode as unknown as ElementType
    const handles = collectHandleProps(
      createElement(RelatoNodeForTest, {
        id: "node-a",
        data: classNode(),
        selected: false,
      })
    )
    const sourceHandles = handles.filter((handle) => handle.type === "source")
    const targetHandles = handles.filter((handle) => handle.type === "target")

    const sourceClassName = String(sourceHandles[0]?.className ?? "")
    const targetClassName = String(targetHandles[0]?.className ?? "")

    // both must have the same size-3.5 class so source fully covers target
    expect(sourceClassName.includes("size-3.5!")).toBe(true)
    expect(targetClassName.includes("size-3.5!")).toBe(true)
  })
})
