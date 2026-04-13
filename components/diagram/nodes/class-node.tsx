"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────────

export type ClassNodeData = {
  name: string;
  stereotype?: "interface" | "abstract" | null;
  role?: string;
  summary?: string;
  files?: string[];
  reviewNotes?: string;
  fields: string[];
  methods: string[];
  color?: string | null;
};

export type ClassNodeType = Node<ClassNodeData, "classNode">;

// ─── Constants ──────────────────────────────────────────────────────────────

const POSITION_MAP = {
  top: Position.Top,
  bottom: Position.Bottom,
  left: Position.Left,
  right: Position.Right,
} as const;

type HandleSide = keyof typeof POSITION_MAP;
const HANDLE_SIDES = Object.keys(POSITION_MAP) as HandleSide[];

const TARGET_HANDLE_CLASS = cn(
  "size-3.5! rounded-full! border-0! bg-transparent!",
  "opacity-0! transition-opacity! duration-150!",
  "group-hover/node:opacity-100!",
);

const SOURCE_HANDLE_CLASS = cn(
  "size-2.5! rounded-full! border-2! border-background! bg-muted-foreground!",
  "opacity-0! transition-opacity! duration-150!",
  "group-hover/node:opacity-100!",
);

const SELECTED_HANDLE_EXTRA = "opacity-100!";

// ─── Component ──────────────────────────────────────────────────────────────

/** UML class box node rendered on the React Flow canvas. */
function ClassNodeComponent({ data, selected }: NodeProps<ClassNodeType>) {
  const { name, stereotype, role, files, fields, methods, color } = data;

  const visibleFields = fields.filter(Boolean);
  const visibleMethods = methods.filter(Boolean);
  const visibleFiles = files?.filter(Boolean) ?? [];
  const primaryFile = visibleFiles[0];
  const additionalFileCount = Math.max(visibleFiles.length - 1, 0);
  const handleExtra = selected ? SELECTED_HANDLE_EXTRA : "";
  const colorStyle = color ? { borderTopColor: color, borderTopWidth: 4 } : {};

  return (
    <figure
      role="group"
      aria-label={`${name || "ClassName"} class node`}
      className={cn(
        "group/node min-w-[220px] overflow-hidden rounded-sm border bg-card text-card-foreground shadow-[0_16px_40px_rgba(17,24,39,0.08)]",
        "transition-[border-color,box-shadow] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
        selected
          ? "border-primary/70 shadow-[0_0_0_3px_color-mix(in_oklch,var(--color-primary)_18%,transparent),0_18px_40px_rgba(17,24,39,0.12)]"
          : "border-border/90 hover:border-border/60 hover:shadow-[0_18px_42px_rgba(17,24,39,0.12)]",
      )}
      style={colorStyle}
    >
      {/* Handles */}
      {HANDLE_SIDES.map((side) => (
        <Handle
          key={`target-${side}`}
          id={`target-${side}`}
          type="target"
          position={POSITION_MAP[side]}
          aria-label={`Connect to ${side} of ${name || "node"}`}
          className={cn(TARGET_HANDLE_CLASS, handleExtra)}
        />
      ))}
      {HANDLE_SIDES.map((side) => (
        <Handle
          key={side}
          id={side}
          type="source"
          position={POSITION_MAP[side]}
          aria-label={`Connect from ${side} of ${name || "node"}`}
          className={cn(SOURCE_HANDLE_CLASS, handleExtra)}
        />
      ))}

      {/* Header */}
      <figcaption
        className={cn(
          "border-b border-border/80 px-4 py-3 text-center",
          "transition-colors duration-150",
          selected ? "bg-primary/4" : "bg-muted/40",
        )}
      >
        {role && (
          <div className="mb-1 font-mono text-[10px] tracking-[0.18em] uppercase text-muted-foreground">
            {role}
          </div>
        )}
        {stereotype === "interface" && (
          <div
            className="mb-0.5 font-mono text-[10px] font-medium tracking-wide uppercase text-muted-foreground"
            aria-label="Interface stereotype"
          >
            «interface»
          </div>
        )}
        <div
          className={cn(
            "max-w-[200px] truncate text-[15px] font-bold leading-snug tracking-tight",
            stereotype === "abstract" && "italic",
            selected ? "text-foreground" : "text-foreground/90",
          )}
          title={name || "ClassName"}
        >
          {name || "ClassName"}
        </div>
      </figcaption>

      {/* Fields */}
      <div
        className="min-h-8 border-b border-border/80 px-4 py-2"
        role="list"
        aria-label={`${name || "Class"} fields`}
      >
        {visibleFields.length === 0 ? (
          <Placeholder>no fields</Placeholder>
        ) : (
          visibleFields.map((field) => (
            <MemberRow key={field} aria-label={`Field: ${field}`}>
              {field}
            </MemberRow>
          ))
        )}
      </div>

      {/* Methods */}
      <div
        className="min-h-8 px-4 py-2"
        role="list"
        aria-label={`${name || "Class"} methods`}
      >
        {visibleMethods.length === 0 ? (
          <Placeholder>no methods</Placeholder>
        ) : (
          visibleMethods.map((method) => (
            <MemberRow key={method} aria-label={`Method: ${method}`}>
              {method}
            </MemberRow>
          ))
        )}
      </div>

      {/* File path footer */}
      {primaryFile && (
        <div className="border-t border-border/80 bg-muted/30 px-4 py-2">
          <div className="flex items-center justify-between gap-3">
            <span className="truncate font-mono text-[10px] text-muted-foreground">
              {primaryFile}
            </span>
            {additionalFileCount > 0 && (
              <span className="shrink-0 rounded-full bg-background px-2 py-0.5 font-mono text-[9px] text-muted-foreground">
                +{additionalFileCount}
              </span>
            )}
          </div>
        </div>
      )}
    </figure>
  );
}

export const ClassNode = memo(ClassNodeComponent);

// ─── Sub-components ─────────────────────────────────────────────────────────

function Placeholder({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="select-none font-mono text-[11px] italic text-muted-foreground/30"
      aria-hidden="true"
    >
      {children}
    </div>
  );
}

function MemberRow({
  children,
  "aria-label": ariaLabel,
}: {
  children: React.ReactNode;
  "aria-label"?: string;
}) {
  return (
    <div
      className="font-mono text-[11px] leading-[1.6] tracking-tight text-foreground/80"
      role="listitem"
      aria-label={ariaLabel}
    >
      {children}
    </div>
  );
}
