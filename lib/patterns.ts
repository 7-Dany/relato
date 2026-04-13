/**
 * GoF Design Pattern Library — hand-crafted layouts.
 *
 * Each pattern is a pre-positioned diagram that renders perfectly without
 * needing dagre auto-layout. Positions are chosen to match the GoF book's
 * visual hierarchy: source → relationship → target, top-to-bottom, with
 * clear visual separation between groups.
 *
 * Coordinates are in React Flow's canvas space (origin = center-ish,
 * positive = down/right).
 */

import type { ClassNodeData } from "../components/diagram/nodes/class-node";
import type { DiagramEdgeType } from "../components/diagram/edges";

export interface PatternNode {
  id: string;
  position: { x: number; y: number };
  data: ClassNodeData;
}

export interface PatternEdge {
  id: string;
  source: string;
  target: string;
  type: DiagramEdgeType;
}

export interface PatternCallout {
  id: string;
  number: number;
  title: string;
  body: string;
  /** Placement for static reference overlay */
  placement: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  /** ID of the diagram node this callout explains (for anchor line) */
  targetNodeId?: string;
}

export interface PatternDefinition {
  id: string;
  name: string;
  description: string;
  nodes: PatternNode[];
  edges: PatternEdge[];
  intro?: string;
  callouts?: PatternCallout[];
  /** Viewport settings for perfect framing on load */
  viewport?: { x: number; y: number; zoom: number };
}

// ─── Memento Pattern ─────────────────────────────────────────────────────────
//
//   Originator ←───┐
//       ↓          │ (aggregation)
//   Memento   ─────┘
//       ↑
//   Caretaker ──(dependency)──┐
//                             │
//   (Caretaker creates Originator,
//    Originator creates Memento)

export const PATTERNS: readonly PatternDefinition[] = [
  {
    id: "memento",
    name: "Memento",
    description:
      "Capture and externalize an object's internal state without violating encapsulation, so the object can be restored to this state later.",
    intro:
      "Use this blueprint when you need a compact undo/history story without exposing every implementation detail of the state owner.",
    nodes: [
      {
        id: "1",
        position: { x: 0, y: -120 },
        data: {
          name: "Originator",
          role: "State owner",
          stereotype: null,
          summary:
            "Produces snapshots of its internal state and knows how to restore them later.",
          files: ["src/patterns/memento/originator.ts"],
          fields: ["- state: string"],
          methods: ["+ save(): Memento", "+ restore(m: Memento): void"],
        },
      },
      {
        id: "2",
        position: { x: 0, y: 120 },
        data: {
          name: "Memento",
          role: "Snapshot",
          stereotype: null,
          summary:
            "Immutable value object that captures the state without exposing mutation helpers.",
          files: ["src/patterns/memento/memento.ts"],
          fields: ["- state: string"],
          methods: ["- Memento(state: string)", "- getState(): string"],
        },
      },
      {
        id: "3",
        position: { x: 280, y: -120 },
        data: {
          name: "Caretaker",
          role: "History manager",
          stereotype: null,
          summary:
            "Controls when to store state and when to roll the originator back.",
          files: ["src/patterns/memento/caretaker.ts"],
          fields: ["- originator: Originator", "- history: Memento[]"],
          methods: ["+ doSomething(): void", "+ undo(): void"],
        },
      },
    ],
    edges: [
      { id: "e1-2", source: "1", target: "2", type: "dependency" },
      { id: "e3-2", source: "3", target: "2", type: "aggregation" },
    ],
    callouts: [
      {
        id: "memento-1",
        number: 1,
        title: "State stays owned",
        body: "Keep the state-changing logic inside the originator. The diagram should show who creates history and who is allowed to restore it.",
        placement: "top-left",
        targetNodeId: "1",
      },
      {
        id: "memento-2",
        number: 2,
        title: "Snapshots stay simple",
        body: "The snapshot object should read like a value carrier, not another service. In readable maps, this box is intentionally quiet.",
        placement: "top-right",
        targetNodeId: "2",
      },
      {
        id: "memento-3",
        number: 3,
        title: "History belongs outside",
        body: "The caretaker owns timing and retention. That separation is what makes the flow easy to review from top-down or bottom-up.",
        placement: "bottom-right",
        targetNodeId: "3",
      },
      {
        id: "memento-4",
        number: 4,
        title: "Link every box to code",
        body: "A useful chart does not stop at the pattern. Attach the real file path and the review note so a developer can jump from concept to implementation.",
        placement: "bottom-left",
        targetNodeId: "1",
      },
    ],
    viewport: { x: 0, y: 0, zoom: 0.8 },
  },

  // ─── Observer / Publisher-Subscriber Pattern ───────────────────────────────
  //
  //        Publisher ──(aggregation)──▶ Subscriber ◁──(inheritance)── Concrete Subscribers
  //            ▲
  //            │ (dependency)
  //        Client
  {
    id: "observer",
    name: "Observer",
    description:
      "Define a one-to-many dependency between objects so that when one object changes state, all its dependents are notified and updated automatically.",
    nodes: [
      {
        id: "1",
        position: { x: 0, y: -140 },
        data: {
          name: "Publisher",
          stereotype: null,
          fields: ["- subscribers: Subscriber[]", "- mainState: State"],
          methods: [
            "+ subscribe(s: Subscriber)",
            "+ unsubscribe(s: Subscriber)",
            "+ notifySubscribers()",
            "+ mainBusinessLogic()",
          ],
        },
      },
      {
        id: "2",
        position: { x: 300, y: -140 },
        data: {
          name: "Subscriber",
          stereotype: "interface",
          fields: [],
          methods: ["+ update(context)"],
        },
      },
      {
        id: "3",
        position: { x: 300, y: 40 },
        data: {
          name: "Concrete Subscribers",
          stereotype: null,
          fields: ["- subscriberState"],
          methods: ["+ update(context)", "+ getState()"],
        },
      },
      {
        id: "4",
        position: { x: -300, y: 40 },
        data: {
          name: "Client",
          stereotype: null,
          fields: [],
          methods: ["+ main()", "+ registerSubscribers()"],
        },
      },
    ],
    edges: [
      { id: "e1-2", source: "1", target: "2", type: "aggregation" },
      { id: "e3-2", source: "3", target: "2", type: "inheritance" },
      { id: "e4-1", source: "4", target: "1", type: "dependency" },
      { id: "e4-3", source: "4", target: "3", type: "dependency" },
    ],
    viewport: { x: 0, y: -20, zoom: 0.75 },
  },

  // ─── Strategy Pattern ──────────────────────────────────────────────────────
  //
  //   Context ──(aggregation)──▶ Strategy ◁──(inheritance)── Concrete Strategy A
  //                                                       └── Concrete Strategy B
  {
    id: "strategy",
    name: "Strategy",
    description:
      "Define a family of algorithms, encapsulate each one, and make them interchangeable. Strategy lets the algorithm vary independently from clients that use it.",
    nodes: [
      {
        id: "1",
        position: { x: 0, y: -140 },
        data: {
          name: "Context",
          stereotype: null,
          fields: ["- strategy: Strategy"],
          methods: ["+ setStrategy(s: Strategy)", "+ executeStrategy()"],
        },
      },
      {
        id: "2",
        position: { x: 0, y: 80 },
        data: {
          name: "Strategy",
          stereotype: "interface",
          fields: [],
          methods: ["+ algorithmInterface()"],
        },
      },
      {
        id: "3",
        position: { x: -160, y: 280 },
        data: {
          name: "Concrete Strategy A",
          stereotype: null,
          fields: [],
          methods: ["+ algorithmInterface()"],
        },
      },
      {
        id: "4",
        position: { x: 160, y: 280 },
        data: {
          name: "Concrete Strategy B",
          stereotype: null,
          fields: [],
          methods: ["+ algorithmInterface()"],
        },
      },
    ],
    edges: [
      { id: "e1-2", source: "1", target: "2", type: "aggregation" },
      { id: "e3-2", source: "3", target: "2", type: "inheritance" },
      { id: "e4-2", source: "4", target: "2", type: "inheritance" },
    ],
    viewport: { x: 0, y: 40, zoom: 0.7 },
  },

  // ─── Factory Method Pattern ────────────────────────────────────────────────
  //
  //   Creator ◁──(inheritance)── Concrete Creator
  //      │
  //      └── factoryMethod() ──▶ Product ◁──(inheritance)── Concrete Product
  {
    id: "factory-method",
    name: "Factory Method",
    description:
      "Define an interface for creating an object, but let subclasses decide which class to instantiate. Factory Method lets a class defer instantiation to subclasses.",
    nodes: [
      {
        id: "1",
        position: { x: -200, y: -140 },
        data: {
          name: "Creator",
          stereotype: "abstract",
          fields: [],
          methods: ["+ someOperation()", "# factoryMethod(): Product"],
        },
      },
      {
        id: "2",
        position: { x: -200, y: 60 },
        data: {
          name: "Concrete Creator",
          stereotype: null,
          fields: [],
          methods: ["# factoryMethod(): Concrete Product"],
        },
      },
      {
        id: "3",
        position: { x: 200, y: -140 },
        data: {
          name: "Product",
          stereotype: "interface",
          fields: [],
          methods: ["+ operation()"],
        },
      },
      {
        id: "4",
        position: { x: 200, y: 60 },
        data: {
          name: "Concrete Product",
          stereotype: null,
          fields: [],
          methods: ["+ operation()"],
        },
      },
    ],
    edges: [
      { id: "e2-1", source: "2", target: "1", type: "inheritance" },
      { id: "e4-3", source: "4", target: "3", type: "inheritance" },
      { id: "e1-3", source: "1", target: "3", type: "dependency" },
      { id: "e2-4", source: "2", target: "4", type: "dependency" },
    ],
    viewport: { x: 0, y: -20, zoom: 0.75 },
  },

  // ─── Singleton Pattern ─────────────────────────────────────────────────────
  //
  //   Singleton (self-referential static instance)
  {
    id: "singleton",
    name: "Singleton",
    description:
      "Ensure a class only has one instance, and provide a global point of access to it.",
    nodes: [
      {
        id: "1",
        position: { x: 0, y: 0 },
        data: {
          name: "Singleton",
          stereotype: null,
          fields: ["- instance: Singleton", "- data: string"],
          methods: [
            "- Singleton()",
            "+ getInstance(): Singleton",
            "+ someBusinessLogic()",
          ],
        },
      },
    ],
    edges: [
      {
        id: "e1-1",
        source: "1",
        target: "1",
        type: "dependency",
      },
    ],
    viewport: { x: 0, y: 0, zoom: 1.0 },
  },

  // ─── Adapter Pattern ───────────────────────────────────────────────────────
  //
  //   Client ──(dependency)──▶ Target
  //                           Adapter ◁──(inheritance)── Adaptee
  {
    id: "adapter",
    name: "Adapter",
    description:
      "Convert the interface of a class into another interface clients expect. Adapter lets classes work together that couldn't otherwise because of incompatible interfaces.",
    nodes: [
      {
        id: "1",
        position: { x: -280, y: -100 },
        data: {
          name: "Client",
          stereotype: null,
          fields: [],
          methods: ["+ clientCode(target: Target)"],
        },
      },
      {
        id: "2",
        position: { x: 0, y: -100 },
        data: {
          name: "Target",
          stereotype: "interface",
          fields: [],
          methods: ["+ request(): string"],
        },
      },
      {
        id: "3",
        position: { x: 0, y: 80 },
        data: {
          name: "Adapter",
          stereotype: null,
          fields: ["- adaptee: Adaptee"],
          methods: ["+ request(): string"],
        },
      },
      {
        id: "4",
        position: { x: 280, y: 80 },
        data: {
          name: "Adaptee",
          stereotype: null,
          fields: [],
          methods: ["+ specificRequest(): string"],
        },
      },
    ],
    edges: [
      { id: "e1-2", source: "1", target: "2", type: "dependency" },
      { id: "e3-2", source: "3", target: "2", type: "inheritance" },
      { id: "e3-4", source: "3", target: "4", type: "aggregation" },
    ],
    viewport: { x: 0, y: 0, zoom: 0.7 },
  },
] as const;

/** O(1) lookup by pattern ID */
export const PATTERN_BY_ID = new Map(PATTERNS.map((p) => [p.id, p]));
