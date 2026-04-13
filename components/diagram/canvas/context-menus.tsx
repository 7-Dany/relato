"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Delete02Icon,
  Copy01Icon,
  ShuffleIcon,
  Expand,
  ArrowRight01Icon,
  LinkIcon,
  UnfoldMoreIcon,
  DiamondIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import type { Edge, Node } from "@xyflow/react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { EDGE_TYPE_META, EDGE_COLORS, EDGE_WIDTHS } from "../constants";
import type { DiagramEdgeType } from "../context";

const EDGE_ICON_MAP: Record<string, typeof ArrowRight01Icon> = {
  association: ArrowRight01Icon,
  dependency: LinkIcon,
  inheritance: UnfoldMoreIcon,
  aggregation: DiamondIcon,
};

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ContextMenuState {
  x: number;
  y: number;
  type: "node" | "edge";
  node?: Node;
  edge?: Edge;
}

// ─── Component ──────────────────────────────────────────────────────────────

interface DiagramContextMenuProps {
  state: ContextMenuState | null;
  onClose: () => void;
  onDuplicateNode: () => void;
  onUpdateNode: (nodeId: string, patch: Record<string, unknown>) => void;
  onUpdateEdge: (patch: {
    type?: DiagramEdgeType;
    data?: Record<string, unknown>;
  }) => void;
  onDeleteNode: () => void;
  onDeleteEdge: () => void;
}

export function DiagramContextMenu({
  state,
  onClose,
  onDuplicateNode,
  onUpdateNode,
  onUpdateEdge,
  onDeleteNode,
  onDeleteEdge,
}: DiagramContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const subRef = useRef<HTMLDivElement>(null);
  const [activeSub, setActiveSub] = useState<string | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [focusedSubIndex, setFocusedSubIndex] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuItemsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const subItemsRef = useRef<(HTMLButtonElement | null)[]>([]);

  // Helper to get submenu item IDs (declared early to avoid use-before-declare)
  const getSubItemIds = useCallback((sub: string, isNode: boolean) => {
    switch (sub) {
      case "color":
        return EDGE_COLORS.map((c) => c.value ?? "default");
      case "type":
        return isNode ? [] : EDGE_TYPE_META.map((t) => t.value);
      case "width":
        return isNode ? [] : EDGE_WIDTHS.map((w) => String(w.value));
      default:
        return [];
    }
  }, []);

  // Close on outside click or Escape
  useEffect(() => {
    if (!state) return;
    const down = (e: MouseEvent) => {
      const target = e.target as globalThis.Node;
      if (!ref.current?.contains(target) && !subRef.current?.contains(target)) {
        onClose();
      }
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        if (activeSub) {
          setActiveSub(null);
        } else {
          onClose();
        }
        return;
      }

      const isNode = state.type === "node";
      // Define main menu items based on context
      const mainItemIds = isNode
        ? ["duplicate", "color-sub", "delete"]
        : ["type-sub", "color-sub", "width-sub", "delete"];

      if (activeSub) {
        // Submenu keyboard navigation
        const subItemIds = getSubItemIds(activeSub, isNode);
        if (subItemIds.length === 0) return;

        if (e.key === "ArrowDown") {
          e.preventDefault();
          setFocusedSubIndex((prev) => (prev + 1) % subItemIds.length);
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setFocusedSubIndex(
            (prev) => (prev - 1 + subItemIds.length) % subItemIds.length,
          );
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          setActiveSub(null);
        } else if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          subItemsRef.current[focusedSubIndex]?.click();
        }
        return;
      }

      // Main menu keyboard navigation
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedIndex((prev) => (prev + 1) % mainItemIds.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedIndex(
          (prev) => (prev - 1 + mainItemIds.length) % mainItemIds.length,
        );
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        const currentItem = mainItemIds[focusedIndex];
        if (currentItem?.endsWith("-sub")) {
          setActiveSub(currentItem.replace("-sub", ""));
          setFocusedSubIndex(0);
        }
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        menuItemsRef.current[focusedIndex]?.click();
      }
    };
    document.addEventListener("mousedown", down);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", down);
      document.removeEventListener("keydown", key);
    };
  }, [state, onClose, activeSub, focusedIndex, focusedSubIndex]);

  // Auto-focus the menu when it opens
  useEffect(() => {
    if (state) {
      // Use requestAnimationFrame to ensure DOM is painted
      const id = requestAnimationFrame(() => {
        menuItemsRef.current[0]?.focus();
      });
      return () => cancelAnimationFrame(id);
    }
  }, [state]);

  // Cleanup hover timer on unmount (Issue 18)
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  if (!state) return null;

  const isNode = state.type === "node";
  const currentType = isNode
    ? undefined
    : (state.edge?.type as DiagramEdgeType);
  const currentColor = isNode
    ? ((state.node?.data as { color?: string | null })?.color ?? null)
    : ((state.edge?.data as { color?: string | null })?.color ?? null);
  const currentWidth = isNode
    ? undefined
    : ((state.edge?.data as { strokeWidth?: number })?.strokeWidth ?? 2);

  const menuW = 224;
  const subW = 200;
  const vw = typeof window !== "undefined" ? window.innerWidth : 1920;
  const vh = typeof window !== "undefined" ? window.innerHeight : 1080;

  const subLeft =
    state.x + menuW + 6 > vw - subW - 8
      ? state.x - subW - 6
      : state.x + menuW + 6;
  const subTop = Math.min(Math.max(state.y - 4, 8), vh - 200);

  const openSub = (id: string) => {
    if (timer.current) clearTimeout(timer.current);
    setActiveSub(id);
    setFocusedSubIndex(0);
  };
  const closeSub = () => {
    timer.current = setTimeout(() => setActiveSub(null), 150);
  };
  const keepSub = () => {
    if (timer.current) clearTimeout(timer.current);
  };

  return (
    <>
      {/* Main menu */}
      <div
        ref={ref}
        role="menu"
        aria-label="Diagram context menu"
        aria-activedescendant={`menu-item-${focusedIndex}`}
        className="fixed z-50 w-56 overflow-hidden rounded-xl border bg-popover/95 p-1.5 text-sm text-popover-foreground shadow-lg backdrop-blur"
        style={{ left: state.x, top: state.y }}
        onMouseLeave={closeSub}
      >
        {isNode ? (
          <>
            {/* Duplicate */}
            <Button
              ref={(el) => {
                menuItemsRef.current[0] = el;
              }}
              id="menu-item-0"
              role="menuitem"
              variant="ghost"
              tabIndex={focusedIndex === 0 ? 0 : -1}
              className={cn(
                "w-full justify-start gap-2 font-normal",
                focusedIndex === 0 && "bg-accent",
              )}
              onFocus={() => setFocusedIndex(0)}
              onMouseEnter={() => setFocusedIndex(0)}
              onClick={() => {
                onDuplicateNode();
                onClose();
              }}
            >
              <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} />
              Duplicate
            </Button>
            <Separator className="my-1.5" />

            {/* Color */}
            <SubMenuItem
              ref={(el) => {
                menuItemsRef.current[1] = el;
              }}
              id="menu-item-1"
              colorDot={currentColor}
              label="Color"
              active={activeSub === "color"}
              focused={focusedIndex === 1}
              onEnter={() => openSub("color")}
              onFocus={() => setFocusedIndex(1)}
              onMouseEnter={() => {
                setFocusedIndex(1);
                openSub("color");
              }}
              showArrow
            />

            <Separator className="my-1.5" />

            {/* Delete */}
            <Button
              ref={(el) => {
                menuItemsRef.current[2] = el;
              }}
              id="menu-item-2"
              role="menuitem"
              variant="ghost"
              tabIndex={focusedIndex === 2 ? 0 : -1}
              className={cn(
                "w-full justify-start gap-2 font-normal text-destructive hover:bg-destructive/10",
                focusedIndex === 2 && "bg-destructive/10",
              )}
              onFocus={() => setFocusedIndex(2)}
              onMouseEnter={() => setFocusedIndex(2)}
              onClick={() => {
                onDeleteNode();
                onClose();
              }}
            >
              <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
              Delete Node
            </Button>
          </>
        ) : (
          <>
            {/* Type */}
            <SubMenuItem
              ref={(el) => {
                menuItemsRef.current[0] = el;
              }}
              id="menu-item-0"
              icon={ShuffleIcon}
              label="Type"
              value={EDGE_TYPE_META.find((t) => t.value === currentType)?.label}
              active={activeSub === "type"}
              focused={focusedIndex === 0}
              onEnter={() => openSub("type")}
              onFocus={() => setFocusedIndex(0)}
              onMouseEnter={() => {
                setFocusedIndex(0);
                openSub("type");
              }}
              showArrow
            />

            {/* Color */}
            <SubMenuItem
              ref={(el) => {
                menuItemsRef.current[1] = el;
              }}
              id="menu-item-1"
              colorDot={currentColor}
              label="Color"
              active={activeSub === "color"}
              focused={focusedIndex === 1}
              onEnter={() => openSub("color")}
              onFocus={() => setFocusedIndex(1)}
              onMouseEnter={() => {
                setFocusedIndex(1);
                openSub("color");
              }}
              showArrow
            />

            {/* Width */}
            <SubMenuItem
              ref={(el) => {
                menuItemsRef.current[2] = el;
              }}
              id="menu-item-2"
              icon={Expand}
              label="Width"
              value={
                EDGE_WIDTHS.find((w) => w.value === currentWidth)?.label ??
                "Normal"
              }
              active={activeSub === "width"}
              focused={focusedIndex === 2}
              onEnter={() => openSub("width")}
              onFocus={() => setFocusedIndex(2)}
              onMouseEnter={() => {
                setFocusedIndex(2);
                openSub("width");
              }}
              showArrow
            />

            <Separator className="my-1.5" />

            {/* Delete */}
            <Button
              ref={(el) => {
                menuItemsRef.current[3] = el;
              }}
              id="menu-item-3"
              role="menuitem"
              variant="ghost"
              tabIndex={focusedIndex === 3 ? 0 : -1}
              className={cn(
                "w-full justify-start gap-2 font-normal text-destructive hover:bg-destructive/10",
                focusedIndex === 3 && "bg-destructive/10",
              )}
              onFocus={() => setFocusedIndex(3)}
              onMouseEnter={() => setFocusedIndex(3)}
              onClick={() => {
                onDeleteEdge();
                onClose();
              }}
            >
              <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
              Delete Edge
            </Button>
          </>
        )}
      </div>

      {/* ─── Submenus ─────────────────────────────────────────────── */}

      {/* Color submenu (shared by node & edge) */}
      {activeSub === "color" && (
        <div
          ref={subRef}
          role="menu"
          aria-label="Color options"
          aria-activedescendant={`sub-item-${focusedSubIndex}`}
          className="fixed z-50 w-48 overflow-hidden rounded-xl border bg-popover/95 p-1.5 text-sm text-popover-foreground shadow-lg backdrop-blur"
          style={{ left: subLeft, top: subTop }}
          onMouseEnter={keepSub}
          onMouseLeave={closeSub}
        >
          {EDGE_COLORS.map(({ label, value }, idx) => {
            const isActive = value === currentColor;
            return (
              <button
                ref={(el) => {
                  subItemsRef.current[idx] = el;
                }}
                id={`sub-item-${idx}`}
                role="menuitem"
                key={label}
                tabIndex={focusedSubIndex === idx ? 0 : -1}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors hover:bg-accent",
                  focusedSubIndex === idx && "bg-accent",
                  isActive && "bg-accent",
                )}
                onFocus={() => setFocusedSubIndex(idx)}
                onMouseEnter={() => setFocusedSubIndex(idx)}
                onClick={() => {
                  if (isNode && state.node) {
                    onUpdateNode(state.node.id, { color: value });
                  } else {
                    onUpdateEdge({ data: { color: value } });
                  }
                  onClose();
                }}
              >
                {/* Active indicator circle */}
                <span
                  className={cn(
                    "size-3 shrink-0 rounded-full border",
                    isActive ? "border-primary" : "border-transparent",
                  )}
                  style={{
                    backgroundColor: value ?? "var(--color-muted-foreground)",
                  }}
                />
                <span className="flex-1 text-left">{label}</span>
                {isActive && (
                  <HugeiconsIcon
                    icon={Tick02Icon}
                    className="text-primary"
                    strokeWidth={2}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Type submenu (edge only) */}
      {!isNode && activeSub === "type" && (
        <div
          ref={subRef}
          role="menu"
          aria-label="Edge type"
          aria-activedescendant={`sub-item-${focusedSubIndex}`}
          className="fixed z-50 w-52 overflow-hidden rounded-xl border bg-popover/95 p-1.5 text-sm text-popover-foreground shadow-lg backdrop-blur"
          style={{ left: subLeft, top: subTop }}
          onMouseEnter={keepSub}
          onMouseLeave={closeSub}
        >
          {EDGE_TYPE_META.map(({ value, label }, idx) => {
            const EdgeIcon = EDGE_ICON_MAP[value];
            return (
              <button
                ref={(el) => {
                  subItemsRef.current[idx] = el;
                }}
                id={`sub-item-${idx}`}
                role="menuitem"
                key={value}
                tabIndex={focusedSubIndex === idx ? 0 : -1}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors hover:bg-accent",
                  focusedSubIndex === idx && "bg-accent",
                  currentType === value && "bg-accent",
                )}
                onFocus={() => setFocusedSubIndex(idx)}
                onMouseEnter={() => setFocusedSubIndex(idx)}
                onClick={() => {
                  onUpdateEdge({ type: value });
                  onClose();
                }}
              >
                {EdgeIcon && (
                  <HugeiconsIcon
                    icon={EdgeIcon}
                    className="size-4 opacity-60"
                    strokeWidth={2}
                  />
                )}
                <span className="flex-1 text-left">{label}</span>
                {currentType === value && (
                  <HugeiconsIcon
                    icon={Tick02Icon}
                    className="text-primary"
                    strokeWidth={2}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Width submenu (edge only) */}
      {!isNode && activeSub === "width" && (
        <div
          ref={subRef}
          role="menu"
          aria-label="Edge width"
          aria-activedescendant={`sub-item-${focusedSubIndex}`}
          className="fixed z-50 w-44 overflow-hidden rounded-xl border bg-popover/95 p-1.5 text-sm text-popover-foreground shadow-lg backdrop-blur"
          style={{ left: subLeft, top: subTop }}
          onMouseEnter={keepSub}
          onMouseLeave={closeSub}
        >
          {EDGE_WIDTHS.map(({ label, value }, idx) => (
            <button
              ref={(el) => {
                subItemsRef.current[idx] = el;
              }}
              id={`sub-item-${idx}`}
              role="menuitem"
              key={value}
              tabIndex={focusedSubIndex === idx ? 0 : -1}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors hover:bg-accent",
                focusedSubIndex === idx && "bg-accent",
                currentWidth === value && "bg-accent",
              )}
              onFocus={() => setFocusedSubIndex(idx)}
              onMouseEnter={() => setFocusedSubIndex(idx)}
              onClick={() => {
                onUpdateEdge({ data: { strokeWidth: value } });
                onClose();
              }}
            >
              <span
                className="w-5 bg-current rounded-full"
                style={{ height: Math.max(2, value) }}
              />
              <span className="flex-1 text-left">{label}</span>
              {currentWidth === value && (
                <HugeiconsIcon
                  icon={Tick02Icon}
                  className="text-primary"
                  strokeWidth={2}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </>
  );
}

// ─── Internal sub-components ────────────────────────────────────────────────

interface SubMenuItemProps {
  icon?: typeof ShuffleIcon;
  colorDot?: string | null;
  label: string;
  value?: string;
  active?: boolean;
  focused?: boolean;
  onEnter?: () => void;
  onFocus?: () => void;
  onMouseEnter?: () => void;
  showArrow?: boolean;
  ref?: React.Ref<HTMLButtonElement>;
  id?: string;
}

function SubMenuItem({
  icon,
  colorDot,
  label,
  value,
  active,
  focused,
  onEnter,
  onFocus,
  onMouseEnter,
  showArrow,
  ...rest
}: SubMenuItemProps) {
  const swatchClass =
    colorDot === null ? "bg-muted-foreground" : colorDot ? "" : undefined;

  return (
    <Button
      role="menuitem"
      variant="ghost"
      tabIndex={focused ? 0 : -1}
      className={cn(
        "w-full justify-start gap-2 font-normal",
        focused && "bg-accent",
        active && "bg-accent",
      )}
      onFocus={onFocus}
      onMouseEnter={onMouseEnter}
      onMouseMove={(_e) => {
        // Only trigger onEnter if not already focused (avoid reopening on mouse move within)
        if (!active) onEnter?.();
      }}
      {...rest}
    >
      {/* Color dot or icon */}
      {colorDot !== undefined ? (
        <span
          className={cn("size-3 shrink-0 rounded-full border", swatchClass)}
          style={
            colorDot
              ? { backgroundColor: colorDot, borderColor: colorDot }
              : undefined
          }
        />
      ) : (
        icon && (
          <HugeiconsIcon icon={icon} className="opacity-50" strokeWidth={2} />
        )
      )}
      <span className="flex flex-1 items-center gap-2">
        <span className="text-sm">{label}</span>
        {value && (
          <span className="text-xs text-muted-foreground">{value}</span>
        )}
      </span>
      {showArrow && (
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          className="opacity-40"
          strokeWidth={2}
        />
      )}
    </Button>
  );
}
