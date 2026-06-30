"use client"

import { useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type RelationshipMeta = {
  kind: string
  name: string
  description: string
  whenToUse: string
  example: string
  lineStyle: "solid" | "dashed"
  marker: string
}

const RELATIONSHIPS: RelationshipMeta[] = [
  {
    kind: "association",
    name: "Association",
    description:
      "A structural link between two independent classes. Neither side owns the other. No arrow — just a connection line.",
    whenToUse:
      "Use when two classes are structurally connected but neither one owns the other.",
    example:
      "Teacher — Course\nBoth exist independently; a teacher can teach many courses, courses can exist without a teacher.",
    lineStyle: "solid",
    marker: "none",
  },
  {
    kind: "directed-association",
    name: "Directed Association",
    description:
      "A navigable one-way link. The source class holds a persistent reference to the target, but not vice versa. Shown with an open arrowhead.",
    whenToUse:
      "Use when a class has a persistent one-way reference to another.",
    example:
      "OrderController → OrderService\nController holds a reference to the service and calls its methods, but the service never references the controller back.",
    lineStyle: "solid",
    marker: "open-arrow",
  },
  {
    kind: "dependency",
    name: "Dependency",
    description:
      "A weaker, temporary relationship. One class uses another only during a single operation — as a method parameter, local variable, or return type. Dashed open arrow.",
    whenToUse:
      "Use when a class only needs another temporarily, not as a persistent field.",
    example:
      "ReportService → PdfExporter\nexport(data): void\nThe service receives a PdfExporter argument in one method; it doesn't store it as a field.",
    lineStyle: "dashed",
    marker: "open-arrow",
  },
  {
    kind: "inheritance",
    name: "Inheritance (Generalization)",
    description:
      "A child class inherits structure and behavior from a parent class (is-a relationship). Shown with a solid line and hollow triangle pointing at the parent.",
    whenToUse:
      "Use when a specialized class extends a more general base class.",
    example:
      "Car extends Vehicle\nCar inherits properties (speed, color) and methods (drive()) from Vehicle and adds its own (openRoof()).",
    lineStyle: "solid",
    marker: "hollow-triangle",
  },
  {
    kind: "realization",
    name: "Realization (Implementation)",
    description:
      "A concrete class fulfills a contract defined by an interface or abstract class. Dashed line with hollow triangle pointing at the interface.",
    whenToUse:
      "Use when a class implements an interface or abstract type.",
    example:
      "class PaymentProcessor implements IPayment {\n  pay(amount: Money): Result { ... }\n}\nThe class provides the actual behavior behind the interface contract.",
    lineStyle: "dashed",
    marker: "hollow-triangle",
  },
  {
    kind: "aggregation",
    name: "Aggregation",
    description:
      "A weak whole-part relationship. The whole contains parts but the parts can exist independently. Hollow diamond at the whole (source) end.",
    whenToUse:
      "Use when the child can outlive the parent.",
    example:
      "Department —> Employee\nDepartment holds a list of employees, but employees can move to another department or exist without one.",
    lineStyle: "solid",
    marker: "hollow-diamond",
  },
  {
    kind: "composition",
    name: "Composition",
    description:
      "A strong whole-part relationship. The whole owns the parts and the parts cannot exist without the whole. Filled diamond at the whole (source) end.",
    whenToUse:
      "Use when the child dies with the parent.",
    example:
      "Order ●—> OrderItem\nAn order contains order items. If the order is deleted, the items are deleted too. Items never exist without an order.",
    lineStyle: "solid",
    marker: "filled-diamond",
  },
]

export function RelationshipReferenceSheet({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [selected, setSelected] = useState<RelationshipMeta>(RELATIONSHIPS[0])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[380px] sm:max-w-[380px]"
        showCloseButton={false}
      >
        <SheetHeader className="border-b border-border px-4 py-3">
          <SheetTitle className="text-sm font-semibold">
            Relationship Reference
          </SheetTitle>
        </SheetHeader>

        <div className="px-4 pt-3">
          <Select
            value={selected.kind}
            onValueChange={(v) => {
              const r = RELATIONSHIPS.find((x) => x.kind === v)
              if (r) setSelected(r)
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RELATIONSHIPS.map((r) => (
                <SelectItem key={r.kind} value={r.kind}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          <div className="mb-3 flex items-center justify-center rounded-lg border border-border bg-muted/40 py-5">
            <EdgePreview
              line={selected.lineStyle}
              marker={selected.marker}
              width={200}
            />
          </div>

          <div className="mb-3 flex items-center gap-2">
            <span className="rounded bg-accent px-2 py-0.5 font-mono text-[10px] uppercase text-accent-foreground">
              {selected.lineStyle}
            </span>
            {selected.marker !== "none" && (
              <span className="rounded bg-accent px-2 py-0.5 font-mono text-[10px] uppercase text-accent-foreground">
                {selected.marker}
              </span>
            )}
          </div>

          <p className="mb-3 text-[13px] leading-relaxed text-muted-foreground">
            {selected.description}
          </p>

          <div className="mb-3 rounded-lg border border-border bg-muted/40 px-3 py-2">
            <span className="text-[11px] font-medium text-foreground/80">
              When to use
            </span>
            <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">
              {selected.whenToUse}
            </p>
          </div>

          <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
            <span className="text-[11px] font-medium text-foreground/80">
              Example
            </span>
            <pre className="mt-1 whitespace-pre-wrap font-mono text-[12px] leading-relaxed text-muted-foreground">
              {selected.example}
            </pre>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function EdgePreview({
  line,
  marker,
  width,
}: {
  line: "solid" | "dashed"
  marker: string
  width: number
}) {
  const dash = line === "dashed" ? "6 5" : "none"
  const h = Math.max(28, Math.round(width * 0.28))
  let markerEnd = ""
  let markerStart = ""

  switch (marker) {
    case "open-arrow":
      markerEnd = "url(#rref-open-arrow)"
      break
    case "hollow-triangle":
      markerEnd = "url(#rref-hollow-tri)"
      break
    case "hollow-diamond":
      markerStart = "url(#rref-hollow-dia)"
      break
    case "filled-diamond":
      markerStart = "url(#rref-filled-dia)"
      break
  }

  const pad = markerStart ? 20 : 4
  const x1 = pad
  const x2 = width - (markerEnd ? 20 : 4)
  const stroke = "var(--muted-foreground)"

  return (
    <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} aria-hidden>
      <defs>
        <marker id="rref-open-arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <polyline points="0 0, 7 3, 0 6" fill="none" stroke={stroke} strokeWidth="1.5" />
        </marker>
        <marker id="rref-hollow-tri" markerWidth="14" markerHeight="10" refX="13" refY="5" orient="auto">
          <polygon points="0 0, 13 5, 0 10" fill="transparent" stroke={stroke} strokeWidth="1.5" />
        </marker>
        <marker id="rref-hollow-dia" markerWidth="14" markerHeight="9" refX="1" refY="4.5" orient="auto">
          <polygon points="7 0, 13 4.5, 7 9, 1 4.5" fill="transparent" stroke={stroke} strokeWidth="1.5" />
        </marker>
        <marker id="rref-filled-dia" markerWidth="14" markerHeight="9" refX="1" refY="4.5" orient="auto">
          <polygon points="7 0, 13 4.5, 7 9, 1 4.5" fill={stroke} stroke={stroke} strokeWidth="1.5" />
        </marker>
      </defs>
      <line
        x1={x1}
        y1={h / 2}
        x2={x2}
        y2={h / 2}
        stroke={stroke}
        strokeWidth="2.5"
        strokeDasharray={dash}
        markerEnd={markerEnd || undefined}
        markerStart={markerStart || undefined}
      />
    </svg>
  )
}
