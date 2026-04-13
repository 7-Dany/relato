"use client";

import { memo, useMemo } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────────

export type ExplanationNodeData = {
  number: number;
  title: string;
  body: string;
  /** ID of the target diagram node this card explains (for anchor line) */
  targetNodeId: string | null;
};

export type ExplanationNodeType = Node<ExplanationNodeData, "explanation">;

// ─── Module-scope constants ─────────────────────────────────────────────────

// Hoisted regex — no /g flag since split() doesn't use lastIndex
const INLINE_CODE_RE = /(`[^`]+`)/;

// ─── Component ──────────────────────────────────────────────────────────────

function ExplanationNodeComponent({
  data,
  selected,
}: NodeProps<ExplanationNodeType>) {
  const { number, title, body } = data;

  return (
    <div
      className={cn(
        "group/explanation relative min-w-[180px] max-w-[220px] rounded-2xl border bg-background/95 p-3 shadow-lg backdrop-blur",
        "transition-[border-color,box-shadow,opacity] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
        selected
          ? "border-primary shadow-[0_0_0_2px_color-mix(in_oklch,var(--color-primary)_20%,transparent)]"
          : "border-border/80 hover:border-border",
      )}
      role="complementary"
      aria-label={`Explanation ${number}: ${title}`}
    >
      {/* Anchor handle — hidden, anchor edge is created via properties panel only */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="anchor"
        style={{ opacity: 0, pointerEvents: "none" }}
      />

      {/* Numbered badge */}
      <div className="mb-1.5 flex items-center gap-2">
        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
          {number}
        </span>
        <span className="text-sm font-medium text-foreground">{title}</span>
      </div>

      {/* Body with basic rich text rendering */}
      <div className="text-[12px] leading-[1.55] text-muted-foreground">
        {useMemo(
          () =>
            body.split("\n").map((line, i) => {
              const parts = line.split(INLINE_CODE_RE);
              return (
                <p key={i} className={i > 0 ? "mt-1" : ""}>
                  {parts.map((part, j) =>
                    part.startsWith("`") && part.endsWith("`") ? (
                      <code
                        key={j}
                        className="rounded bg-muted px-1 py-0.5 font-mono text-[11px] text-foreground"
                      >
                        {part.slice(1, -1)}
                      </code>
                    ) : (
                      <span key={j}>{part}</span>
                    ),
                  )}
                </p>
              );
            }),
          [body],
        )}
      </div>
    </div>
  );
}

export const ExplanationNode = memo(ExplanationNodeComponent);
