"use client";

import { useState, useMemo, memo } from "react";
import { useStore } from "@xyflow/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import { cn } from "@/lib/utils";
import { PATTERNS, type PatternDefinition } from "@/lib/patterns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { SelectionState } from "../types";

// ─── Types ──────────────────────────────────────────────────────────────────

interface SidebarNodeData {
  id: string;
  type: string;
  name: string;
  targetNodeId?: string | null;
  number?: number;
  title?: string;
}

// Custom equality: ignores position changes — only structural/data changes matter
function sidebarNodesEqual(
  a: SidebarNodeData[],
  b: SidebarNodeData[],
): boolean {
  if (a.length !== b.length) return false;
  return a.every(
    (n, i) =>
      n.id === b[i].id &&
      n.type === b[i].type &&
      n.name === b[i].name &&
      n.targetNodeId === b[i].targetNodeId &&
      n.number === b[i].number &&
      n.title === b[i].title,
  );
}

// ─── Props ──────────────────────────────────────────────────────────────────

interface LeftSidebarProps {
  activePattern: PatternDefinition | null;
  selection: SelectionState;
  onSelectNode: (id: string) => void;
  onLoadPattern: (patternId: string) => void;
  onReset: () => void;
}

// ─── Component ──────────────────────────────────────────────────────────────

export const LeftSidebar = memo(function LeftSidebar({
  activePattern,
  selection,
  onSelectNode,
  onLoadPattern,
  onReset,
}: LeftSidebarProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [isResetOpen, setIsResetOpen] = useState(false);

  // Self-fetching from React Flow store — immune to position changes
  const sidebarNodes = useStore(
    (s) =>
      s.nodes.map((n) => ({
        id: n.id,
        type: n.type ?? "",
        name:
          (n.data as { name?: string }).name ??
          (n.data as { title?: string }).title ??
          "",
        targetNodeId: (n.data as { targetNodeId?: string | null }).targetNodeId,
        number: (n.data as { number?: number }).number,
        title: (n.data as { title?: string }).title,
      })),
    sidebarNodesEqual,
  );

  const toggleExpand = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  // Single-pass grouping — one loop, three outputs
  const { classNodes, explanationsByTarget, orphanExplanations } =
    useMemo(() => {
      const cls: SidebarNodeData[] = [];
      const byTarget = new Map<string, SidebarNodeData[]>();
      const orphans: SidebarNodeData[] = [];

      for (const n of sidebarNodes) {
        if (n.type === "classNode") {
          cls.push(n);
        } else if (n.type === "explanation") {
          const target = n.targetNodeId;
          if (target) {
            if (!byTarget.has(target)) byTarget.set(target, []);
            byTarget.get(target)!.push(n);
          } else {
            orphans.push(n);
          }
        }
      }
      return {
        classNodes: cls,
        explanationsByTarget: byTarget,
        orphanExplanations: orphans,
      };
    }, [sidebarNodes]);

  return (
    <div className="hidden w-65 shrink-0 flex-col border-r bg-muted/10 lg:flex">
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-4 p-3">
          {/* Blueprints */}
          <section className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Blueprints
              </h3>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => {
                  if (sidebarNodes.length > 0) {
                    setIsResetOpen(true);
                  } else {
                    onReset();
                  }
                }}
                className="h-6 px-2 text-xs"
              >
                Reset
              </Button>
            </div>
            <div className="flex flex-col gap-0.5">
              {PATTERNS.map((pattern) => {
                const isActive = activePattern?.id === pattern.id;
                return (
                  <button
                    key={pattern.id}
                    type="button"
                    onClick={() => onLoadPattern(pattern.id)}
                    className={cn(
                      "rounded-md px-2.5 py-1.5 text-left text-sm transition-colors",
                      isActive
                        ? "bg-accent font-medium text-accent-foreground"
                        : "hover:bg-muted/50",
                    )}
                  >
                    {pattern.name}
                  </button>
                );
              })}
            </div>
          </section>

          <Separator />

          {/* Layers */}
          <section className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Layers
              </h3>
              <span className="text-xs text-muted-foreground">
                {selection.nodeIds.length > 0
                  ? `${selection.nodeIds.length} selected`
                  : `${classNodes.length}`}
              </span>
            </div>
            {classNodes.length === 0 ? (
              <Empty className="py-4">
                <EmptyTitle>No layers</EmptyTitle>
                <EmptyDescription>
                  Add a class or interface to start.
                </EmptyDescription>
              </Empty>
            ) : (
              <div className="flex flex-col">
                {classNodes.map((node) => {
                  const isSelected = selection.nodeIds.includes(node.id);
                  const isExpanded = expandedNodes.has(node.id);
                  const childExplanations =
                    explanationsByTarget.get(node.id) ?? [];
                  const hasChildren = childExplanations.length > 0;

                  return (
                    <div key={node.id}>
                      <button
                        type="button"
                        onClick={() => {
                          if (hasChildren) toggleExpand(node.id);
                          onSelectNode(node.id);
                        }}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm transition-colors",
                          isSelected
                            ? "bg-accent text-accent-foreground"
                            : "hover:bg-muted/50",
                        )}
                      >
                        {hasChildren ? (
                          <HugeiconsIcon
                            icon={
                              isExpanded ? ArrowDown01Icon : ArrowRight01Icon
                            }
                            className="size-3 shrink-0 text-muted-foreground transition-transform"
                            strokeWidth={2}
                          />
                        ) : (
                          <span className="size-3 shrink-0" />
                        )}
                        <span className="size-2.5 shrink-0 rounded-sm bg-muted" />
                        <span className="truncate">{node.name}</span>
                      </button>
                      {/* Nested explanation cards */}
                      {isExpanded && hasChildren && (
                        <div className="ml-5 mt-0.5 flex flex-col gap-0.5 border-l border-border/50 pl-3">
                          {childExplanations.map((expl) => {
                            const isExplSelected = selection.nodeIds.includes(
                              expl.id,
                            );
                            return (
                              <button
                                key={expl.id}
                                type="button"
                                onClick={() => onSelectNode(expl.id)}
                                className={cn(
                                  "flex items-center gap-2 rounded-md px-2 py-1 text-left text-xs transition-colors",
                                  isExplSelected
                                    ? "bg-accent text-accent-foreground"
                                    : "text-muted-foreground hover:bg-muted/50",
                                )}
                              >
                                <span className="size-2 shrink-0 rounded-full bg-amber-400/60" />
                                <span className="truncate">
                                  #{expl.number} {expl.title}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
                {/* Orphan explanation cards (no target) */}
                {orphanExplanations.map((expl) => {
                  const isExplSelected = selection.nodeIds.includes(expl.id);
                  return (
                    <button
                      key={expl.id}
                      type="button"
                      onClick={() => onSelectNode(expl.id)}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm transition-colors",
                        isExplSelected
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:bg-muted/50",
                      )}
                    >
                      <span className="size-2.5 shrink-0 rounded-full bg-amber-400/60" />
                      <span className="truncate">
                        #{expl.number} {expl.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Reset confirmation */}
      <AlertDialog open={isResetOpen} onOpenChange={setIsResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset diagram?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all nodes, edges, and history. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                onReset();
                setIsResetOpen(false);
              }}
            >
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
});
