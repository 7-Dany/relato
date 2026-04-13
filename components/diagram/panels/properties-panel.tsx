"use client";

import { useCallback, memo } from "react";
import { useReactFlow, useNodesData } from "@xyflow/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ChevronDown,
  Delete02Icon,
  Tick01Icon,
  CubeIcon,
  LinkIcon,
  MousePointerClick,
  ArrowRight01Icon,
  UnfoldMoreIcon,
  DiamondIcon,
} from "@hugeicons/core-free-icons";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field";
import {
  Empty,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import { cn } from "@/lib/utils";
import {
  EDGE_TYPE_META,
  EDGE_TYPE_BY_VALUE,
  EDGE_COLORS,
  STEREOTYPE_OPTIONS,
} from "../constants";
import type { ClassNodeData } from "../nodes/class-node";
import type { ExplanationNodeData } from "../nodes/explanation-node";
import type { DiagramEdgeType } from "../context";

const EDGE_ICON_MAP: Record<string, typeof ArrowRight01Icon> = {
  association: ArrowRight01Icon,
  dependency: LinkIcon,
  inheritance: UnfoldMoreIcon,
  aggregation: DiamondIcon,
};

// ─── Props ────────────────────────────────────────────────────────────────

interface PropertiesPanelProps {
  /** ID of the node when a node is selected. */
  nodeId: string | null;
  /** Type of selected node: "classNode" | "explanation" | null */
  nodeType: string | null;
  /** All class nodes available as anchor targets. */
  classNodes: { id: string; name: string }[];
  /** Primary selected edge type, or null if none/node selected. */
  edgeType: DiagramEdgeType | null;
  /** ID of the edge when an edge is selected. */
  edgeId: string | null;
  edgeData: {
    label?: string;
    curvature?: number;
    color?: string;
    strokeWidth?: number;
  } | null;
  /** Callback to update explanation card data. */
  onUpdateExplanation?: (patch: Partial<ExplanationNodeData>) => void;
  /** Callback to set explanation card target node (creates/removes anchor edge). */
  onSetExplanationTarget?: (targetNodeId: string | null) => void;
}

// ─── Component ─────────────────────────────────────────────────────────────

export const PropertiesPanel = memo(function PropertiesPanel({
  nodeId,
  nodeType,
  classNodes,
  edgeType,
  edgeId,
  edgeData,
  onUpdateExplanation,
  onSetExplanationTarget,
}: PropertiesPanelProps) {
  const { updateNodeData, deleteElements, setEdges } = useReactFlow();

  // Self-fetch node data via useNodesData — only re-renders when THIS node's
  // .data changes, not on position changes (Issue 6 + Fix 2.3)
  const nodeDataResult = useNodesData(nodeId ?? "__none__");
  const nodeData = (nodeDataResult?.data ?? null) as ClassNodeData | null;

  const isClassNode = nodeType === "classNode";
  const isExplanation = nodeType === "explanation";
  const isExplanationSelected = isExplanation && nodeId !== null;
  const isEdge = edgeType !== null;

  const updateNode = useCallback(
    (patch: Partial<ClassNodeData>) => {
      if (!nodeId) return;
      updateNodeData(nodeId, patch);
    },
    [nodeId, updateNodeData],
  );

  const updateEdge = useCallback(
    (patch: { type?: DiagramEdgeType; data?: Record<string, unknown> }) => {
      if (!edgeId) return;
      setEdges((eds) =>
        eds.map((e) =>
          e.id === edgeId
            ? { ...e, ...patch, data: { ...e.data, ...patch.data } }
            : e,
        ),
      );
    },
    [edgeId, setEdges],
  );

  const handleDelete = useCallback(() => {
    if (nodeId) {
      deleteElements({ nodes: [{ id: nodeId }] });
    } else if (edgeId) {
      deleteElements({ edges: [{ id: edgeId }] });
    }
  }, [nodeId, edgeId, deleteElements]);

  return (
    <div
      className="flex h-full min-h-0 flex-col bg-background"
      role="complementary"
      aria-label="Properties panel"
    >
      {/* Header */}
      <div className="flex h-11 shrink-0 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2">
          <HugeiconsIcon
            icon={
              isClassNode
                ? CubeIcon
                : isExplanation
                  ? CubeIcon
                  : isEdge
                    ? LinkIcon
                    : MousePointerClick
            }
            className="size-4 text-muted-foreground"
            strokeWidth={2}
          />
          <h2 className="text-sm font-medium">
            {isClassNode
              ? nodeData?.stereotype === "interface"
                ? "Interface"
                : "Class"
              : isExplanationSelected
                ? "Explanation Card"
                : isEdge
                  ? "Edge"
                  : "Nothing selected"}
          </h2>
        </div>
        {(isClassNode || isExplanationSelected || isEdge) && (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleDelete}
            className="size-7 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
          </Button>
        )}
      </div>

      {/* Empty state */}
      {!isClassNode && !isExplanationSelected && !isEdge && (
        <Empty className="border-0 p-6">
          <EmptyMedia variant="icon">
            <HugeiconsIcon
              icon={MousePointerClick}
              className="text-muted-foreground/50"
              strokeWidth={1.5}
            />
          </EmptyMedia>
          <EmptyTitle>Nothing selected</EmptyTitle>
          <EmptyDescription>
            Select a node or edge to edit its properties.
          </EmptyDescription>
        </Empty>
      )}

      {/* ─── Class node properties ─────────────────────────────────── */}
      {isClassNode && nodeData && (
        <div className="flex-1 overflow-y-auto">
          <FieldGroup className="p-4">
            <Field>
              <FieldLabel>Color</FieldLabel>
              <div className="flex gap-1">
                {EDGE_COLORS.map(({ label, value }) => (
                  <button
                    key={label}
                    onClick={() => updateNode({ color: value })}
                    className={cn(
                      "size-7 shrink-0 rounded-md border transition-colors",
                      value === (nodeData.color ?? null)
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-transparent hover:border-border",
                    )}
                    aria-label={`${label}${value === (nodeData.color ?? null) ? " (selected)" : ""}`}
                    style={{
                      backgroundColor: value ?? "var(--color-muted-foreground)",
                    }}
                  >
                    <span className="block size-full rounded-md" />
                  </button>
                ))}
              </div>
            </Field>

            <Field>
              <FieldLabel>Name</FieldLabel>
              <Input
                value={nodeData.name}
                onChange={(e) => updateNode({ name: e.target.value })}
                placeholder="ClassName"
              />
            </Field>

            <Field>
              <FieldLabel>Type</FieldLabel>
              <ToggleGroup
                variant="outline"
                size="sm"
                spacing={0}
                className="w-full"
                value={[nodeData.stereotype ?? "none"]}
                onValueChange={(values: string[]) => {
                  if (!values.length) return;
                  const next = values[values.length - 1];
                  updateNode({
                    stereotype:
                      next === "none"
                        ? null
                        : (next as ClassNodeData["stereotype"]),
                  });
                }}
              >
                {STEREOTYPE_OPTIONS.map(({ value, label }) => (
                  <ToggleGroupItem
                    key={value}
                    value={value}
                    className="flex-1 text-xs"
                  >
                    {label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </Field>

            <Field>
              <FieldLabel>Role</FieldLabel>
              <FieldDescription>
                Short label used in the node header
              </FieldDescription>
              <Input
                value={nodeData.role ?? ""}
                onChange={(e) => updateNode({ role: e.target.value })}
                placeholder="State owner"
              />
            </Field>

            <Field>
              <FieldLabel>Summary</FieldLabel>
              <FieldDescription>
                What responsibility this box owns
              </FieldDescription>
              <Textarea
                value={nodeData.summary ?? ""}
                onChange={(e) => updateNode({ summary: e.target.value })}
                className="min-h-20 resize-none"
                placeholder="Captures and restores state snapshots."
              />
            </Field>

            <Field>
              <FieldLabel>Source Files</FieldLabel>
              <FieldDescription>One path per line</FieldDescription>
              <Textarea
                value={(nodeData.files ?? []).join("\n")}
                onChange={(e) =>
                  updateNode({ files: e.target.value.split("\n") })
                }
                className="min-h-20 resize-none font-mono text-xs"
                placeholder="src/domain/editor/originator.ts"
              />
            </Field>

            <Field>
              <FieldLabel>Review Notes</FieldLabel>
              <FieldDescription>
                Open questions, risks, or follow-up work
              </FieldDescription>
              <Textarea
                value={nodeData.reviewNotes ?? ""}
                onChange={(e) => updateNode({ reviewNotes: e.target.value })}
                className="min-h-20 resize-none"
                placeholder="Undo stack grows without a retention policy."
              />
            </Field>

            <Field>
              <FieldLabel>Fields</FieldLabel>
              <FieldDescription>One field per line</FieldDescription>
              <Textarea
                value={nodeData.fields.join("\n")}
                onChange={(e) =>
                  updateNode({ fields: e.target.value.split("\n") })
                }
                className="min-h-16 resize-none font-mono text-xs"
                placeholder="- field: Type"
              />
            </Field>

            <Field>
              <FieldLabel>Methods</FieldLabel>
              <FieldDescription>One method per line</FieldDescription>
              <Textarea
                value={nodeData.methods.join("\n")}
                onChange={(e) =>
                  updateNode({ methods: e.target.value.split("\n") })
                }
                className="min-h-16 resize-none font-mono text-xs"
                placeholder="+ method(): ReturnType"
              />
            </Field>
          </FieldGroup>
        </div>
      )}

      {/* ─── Explanation card properties ───────────────────────────── */}
      {isExplanationSelected &&
        nodeData &&
        onUpdateExplanation &&
        onSetExplanationTarget && (
          <div className="flex-1 overflow-y-auto">
            <FieldGroup className="p-4">
              <Field>
                <FieldLabel>Number</FieldLabel>
                <div className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {(nodeData as unknown as ExplanationNodeData).number}
                </div>
              </Field>

              <Field>
                <FieldLabel>Title</FieldLabel>
                <Input
                  value={(nodeData as unknown as ExplanationNodeData).title}
                  onChange={(e) =>
                    onUpdateExplanation({ title: e.target.value })
                  }
                  placeholder="Card title"
                />
              </Field>

              <Field>
                <FieldLabel>Content</FieldLabel>
                <FieldDescription>
                  Supports `inline code` with backticks
                </FieldDescription>
                <Textarea
                  value={(nodeData as unknown as ExplanationNodeData).body}
                  onChange={(e) =>
                    onUpdateExplanation({ body: e.target.value })
                  }
                  className="min-h-24 resize-none"
                  placeholder="Explain this part of the diagram..."
                />
              </Field>

              <Field>
                <FieldLabel>Connects to</FieldLabel>
                <FieldDescription>
                  Anchor this card to a diagram node
                </FieldDescription>
                <Select
                  value={
                    (nodeData as unknown as ExplanationNodeData).targetNodeId ??
                    "none"
                  }
                  onValueChange={(v) =>
                    onSetExplanationTarget(v === "none" ? null : v)
                  }
                >
                  <SelectTrigger className="w-full">
                    {(() => {
                      const selected = classNodes.find(
                        (n) =>
                          n.id ===
                          (nodeData as unknown as ExplanationNodeData)
                            .targetNodeId,
                      );
                      return (nodeData as unknown as ExplanationNodeData)
                        .targetNodeId && selected
                        ? selected.name
                        : "None (free floating)";
                    })()}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (free floating)</SelectItem>
                    {classNodes.map((n) => (
                      <SelectItem key={n.id} value={n.id}>
                        {n.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>
          </div>
        )}

      {/* ─── Edge properties ───────────────────────────────────────── */}
      {isEdge && (
        <div className="flex-1 overflow-y-auto">
          <FieldGroup className="p-4">
            <Field>
              <FieldLabel>Label</FieldLabel>
              <FieldDescription>
                Short verb or phrase shown on the line
              </FieldDescription>
              <Input
                value={edgeData?.label ?? ""}
                onChange={(e) =>
                  updateEdge({ data: { label: e.target.value } })
                }
                placeholder="creates / restores / publishes to"
              />
            </Field>

            <Field>
              <FieldLabel>Relationship Type</FieldLabel>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="outline"
                      className="w-full justify-between font-normal"
                    />
                  }
                >
                  <span className="flex items-center gap-1.5">
                    {(() => {
                      const EdgeIcon = EDGE_ICON_MAP[edgeType!];
                      return EdgeIcon ? (
                        <HugeiconsIcon
                          icon={EdgeIcon}
                          className="size-4"
                          strokeWidth={2}
                        />
                      ) : null;
                    })()}
                    {EDGE_TYPE_BY_VALUE.get(edgeType!)?.label}
                  </span>
                  <HugeiconsIcon
                    icon={ChevronDown}
                    data-icon="inline-end"
                    className="opacity-60"
                    strokeWidth={2.5}
                  />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuGroup>
                    {EDGE_TYPE_META.map(({ value, label }) => {
                      const EdgeIcon = EDGE_ICON_MAP[value];
                      return (
                        <DropdownMenuItem
                          key={value}
                          onClick={() => updateEdge({ type: value })}
                          className="gap-2"
                        >
                          {EdgeIcon && (
                            <HugeiconsIcon
                              icon={EdgeIcon}
                              strokeWidth={2}
                              className="size-4"
                            />
                          )}
                          <span className="text-sm">{label}</span>
                          {edgeType === value && (
                            <HugeiconsIcon
                              icon={Tick01Icon}
                              data-icon="inline-end"
                              className="ml-auto size-4 shrink-0 text-primary"
                              strokeWidth={3}
                            />
                          )}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </Field>

            <Field>
              <FieldLabel>Color</FieldLabel>
              <div className="flex gap-1">
                {EDGE_COLORS.map(({ label, value }) => (
                  <button
                    key={label}
                    onClick={() => updateEdge({ data: { color: value } })}
                    className={cn(
                      "size-7 shrink-0 rounded-md border transition-colors",
                      value === (edgeData?.color ?? null)
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-transparent hover:border-border",
                    )}
                    aria-label={`${label}${value === (edgeData?.color ?? null) ? " (selected)" : ""}`}
                    style={{
                      backgroundColor: value ?? "var(--color-muted-foreground)",
                    }}
                  >
                    <span className="block size-full rounded-md" />
                  </button>
                ))}
              </div>
            </Field>

            <Field>
              <div className="flex items-center justify-between">
                <FieldLabel>Stroke Width</FieldLabel>
                <span className="text-xs font-mono tabular-nums text-muted-foreground">
                  {edgeData?.strokeWidth ?? 2}px
                </span>
              </div>
              <Slider
                value={[edgeData?.strokeWidth ?? 2]}
                onValueChange={(v) =>
                  updateEdge({ data: { strokeWidth: v[0] } })
                }
                min={0.5}
                max={4}
                step={0.5}
                aria-label="Stroke Width"
              />
            </Field>

            <Field>
              <div className="flex items-center justify-between">
                <FieldLabel>Curvature</FieldLabel>
                <span className="text-xs font-mono tabular-nums text-muted-foreground">
                  {Math.round((edgeData?.curvature ?? 0.25) * 100)}%
                </span>
              </div>
              <Slider
                value={[edgeData?.curvature ?? 0.25]}
                onValueChange={(v) => updateEdge({ data: { curvature: v[0] } })}
                min={0}
                max={1}
                step={0.05}
                aria-label="Curvature"
              />
            </Field>
          </FieldGroup>
        </div>
      )}
    </div>
  );
});
