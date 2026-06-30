"use client"

import { useEffect, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Copy01Icon,
  Delete02Icon,
  ArrowRight01Icon,
  LinkIcon,
  UnfoldMoreIcon,
  DiamondIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import type { DiagramEdgeKind } from "../../domain"
import type { DiagramCommand } from "../../domain"
import { RELATO_ACCENT_COLORS } from "../../ui/colors"

// ─── Types ─────────────────────────────────────────────────────────────────────

export type ContextMenuTarget =
  | { kind: "node"; nodeId: string; nodeColor: string | null }
  | { kind: "edge"; edgeId: string; edgeKind: DiagramEdgeKind; edgeColor: string | null; edgeStrokeWidth: number }

export type ContextMenuState = {
  x: number
  y: number
  target: ContextMenuTarget
}

// ─── Constant options ──────────────────────────────────────────────────────────

// Shared with inspector-panel — single source of truth
const ACCENT_COLORS = RELATO_ACCENT_COLORS

const EDGE_KINDS: { kind: DiagramEdgeKind; label: string; icon: typeof ArrowRight01Icon }[] = [
  { kind: "association", label: "Association", icon: ArrowRight01Icon },
  { kind: "dependency", label: "Dependency", icon: LinkIcon },
  { kind: "inheritance", label: "Inheritance", icon: UnfoldMoreIcon },
  { kind: "aggregation", label: "Aggregation", icon: DiamondIcon },
]

const STROKE_WIDTHS = [
  { label: "Thin", value: 1 },
  { label: "Normal", value: 2 },
  { label: "Thick", value: 3.5 },
  { label: "Heavy", value: 5 },
] as const

// ─── Component ─────────────────────────────────────────────────────────────────

interface ContextMenuProps {
  state: ContextMenuState | null
  onClose: () => void
  dispatch: (command: DiagramCommand) => void
}

type Submenu = "color" | "kind" | "width" | null

export function DiagramContextMenu({ state, onClose, dispatch }: ContextMenuProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const subRef = useRef<HTMLDivElement>(null)
  const [activeSub, setActiveSub] = useState<Submenu>(null)
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Close on outside click or Escape ─────────────────────────────────────
  useEffect(() => {
    if (!state) return

    function onMouseDown(e: MouseEvent) {
      const t = e.target as Node
      if (!rootRef.current?.contains(t) && !subRef.current?.contains(t)) {
        onClose()
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault()
        if (activeSub) { setActiveSub(null) } else { onClose() }
      }
    }

    document.addEventListener("mousedown", onMouseDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onMouseDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [state, onClose, activeSub])

  useEffect(() => {
    return () => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current)
    }
  }, [])

  if (!state) return null

  const { x, y, target } = state
  const isNode = target.kind === "node"

  // Submenu position: prefer right, flip left if near edge
  const vw = typeof window !== "undefined" ? window.innerWidth : 1920
  const menuW = 224
  const subW = 200
  const subLeft = x + menuW + 6 > vw - subW - 8 ? x - subW - 6 : x + menuW + 6
  const subTop = Math.min(Math.max(y - 4, 8), (typeof window !== "undefined" ? window.innerHeight : 1080) - 240)

  function openSub(sub: Submenu) {
    if (hoverTimer.current) clearTimeout(hoverTimer.current)
    setActiveSub(sub)
  }
  function closeSub() {
    hoverTimer.current = setTimeout(() => setActiveSub(null), 150)
  }
  function keepSub() {
    if (hoverTimer.current) clearTimeout(hoverTimer.current)
  }

  // ── Commands ──────────────────────────────────────────────────────────────

  function handleDuplicate() {
    if (target.kind !== "node") return
    dispatch({ type: "duplicate-node", id: target.nodeId as never })
    onClose()
  }

  function handleDelete() {
    if (target.kind === "node") {
      dispatch({ type: "delete-selection", selection: { kind: "node", id: target.nodeId as never } })
    } else {
      dispatch({ type: "delete-selection", selection: { kind: "edge", id: target.edgeId as never } })
    }
    onClose()
  }

  function handleColorChange(color: string | null) {
    if (target.kind === "node") {
      dispatch({ type: "update-class-node", id: target.nodeId as never, patch: { color } })
    } else {
      dispatch({ type: "update-edge", id: target.edgeId as never, patch: { color } })
    }
    onClose()
  }

  function handleKindChange(kind: DiagramEdgeKind) {
    if (target.kind !== "edge") return
    dispatch({ type: "update-edge", id: target.edgeId as never, patch: { kind } })
    onClose()
  }

  function handleStrokeChange(strokeWidth: number) {
    if (target.kind !== "edge") return
    dispatch({ type: "update-edge", id: target.edgeId as never, patch: { strokeWidth } })
    onClose()
  }

  const currentColor = isNode ? (target as typeof target & { nodeColor: string | null }).nodeColor : (target as typeof target & { edgeColor: string | null }).edgeColor

  return (
    <>
      {/* ── Main menu ─────────────────────────────────────────────────── */}
      <div
        ref={rootRef}
        role="menu"
        aria-label="Diagram context menu"
        className="fixed z-50 w-56 overflow-hidden rounded-xl border border-border bg-popover/95 p-1.5 text-sm text-popover-foreground shadow-lg backdrop-blur"
        style={{ left: x, top: y }}
        onMouseLeave={closeSub}
      >
        {isNode ? (
          <>
            <MenuButton
              icon={Copy01Icon}
              onClick={handleDuplicate}
              onMouseEnter={() => openSub(null)}
            >
              Duplicate
            </MenuButton>

            <Separator className="my-1.5" />

            <SubMenuTrigger
              label="Color"
              colorDot={currentColor}
              active={activeSub === "color"}
              onMouseEnter={() => openSub("color")}
            />

            <Separator className="my-1.5" />

            <MenuButton
              icon={Delete02Icon}
              destructive
              onClick={handleDelete}
              onMouseEnter={() => openSub(null)}
            >
              Delete Node
            </MenuButton>
          </>
        ) : (
          <>
            <SubMenuTrigger
              label="Type"
              value={EDGE_KINDS.find((k) => k.kind === (target as { edgeKind: DiagramEdgeKind }).edgeKind)?.label}
              active={activeSub === "kind"}
              onMouseEnter={() => openSub("kind")}
            />
            <SubMenuTrigger
              label="Color"
              colorDot={currentColor}
              active={activeSub === "color"}
              onMouseEnter={() => openSub("color")}
            />
            <SubMenuTrigger
              label="Width"
              value={STROKE_WIDTHS.find((w) => w.value === (target as { edgeStrokeWidth: number }).edgeStrokeWidth)?.label ?? "Normal"}
              active={activeSub === "width"}
              onMouseEnter={() => openSub("width")}
            />

            <Separator className="my-1.5" />

            <MenuButton
              icon={Delete02Icon}
              destructive
              onClick={handleDelete}
              onMouseEnter={() => openSub(null)}
            >
              Delete Edge
            </MenuButton>
          </>
        )}
      </div>

      {/* ── Color submenu ─────────────────────────────────────────────── */}
      {activeSub === "color" && (
        <div
          ref={subRef}
          role="menu"
          aria-label="Accent color"
          className="fixed z-50 w-44 overflow-hidden rounded-xl border border-border bg-popover/95 p-1.5 text-sm text-popover-foreground shadow-lg backdrop-blur"
          style={{ left: subLeft, top: subTop }}
          onMouseEnter={keepSub}
          onMouseLeave={closeSub}
        >
          {ACCENT_COLORS.map(({ label, value }) => {
            const active = value === currentColor
            return (
              <button
                key={label}
                role="menuitem"
                type="button"
                onClick={() => handleColorChange(value)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors hover:bg-accent",
                  active && "bg-accent"
                )}
              >
                <span
                  className="size-3 shrink-0 rounded-full border"
                  style={{
                    background: value ?? "var(--color-muted-foreground)",
                    borderColor: active ? "var(--color-primary)" : "transparent",
                  }}
                />
                <span className="flex-1 text-left">{label}</span>
                {active && <HugeiconsIcon icon={Tick02Icon} className="text-primary" strokeWidth={2} />}
              </button>
            )
          })}
        </div>
      )}

      {/* ── Edge kind submenu ──────────────────────────────────────────── */}
      {activeSub === "kind" && !isNode && (
        <div
          ref={subRef}
          role="menu"
          aria-label="Edge type"
          className="fixed z-50 w-48 overflow-hidden rounded-xl border border-border bg-popover/95 p-1.5 text-sm text-popover-foreground shadow-lg backdrop-blur"
          style={{ left: subLeft, top: subTop }}
          onMouseEnter={keepSub}
          onMouseLeave={closeSub}
        >
          {EDGE_KINDS.map(({ kind, label, icon }) => {
            const active = kind === (target as { edgeKind: DiagramEdgeKind }).edgeKind
            return (
              <button
                key={kind}
                role="menuitem"
                type="button"
                onClick={() => handleKindChange(kind)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors hover:bg-accent",
                  active && "bg-accent"
                )}
              >
                <HugeiconsIcon icon={icon} className="size-4 opacity-60" strokeWidth={2} />
                <span className="flex-1 text-left">{label}</span>
                {active && <HugeiconsIcon icon={Tick02Icon} className="text-primary" strokeWidth={2} />}
              </button>
            )
          })}
        </div>
      )}

      {/* ── Stroke width submenu ───────────────────────────────────────── */}
      {activeSub === "width" && !isNode && (
        <div
          ref={subRef}
          role="menu"
          aria-label="Stroke width"
          className="fixed z-50 w-40 overflow-hidden rounded-xl border border-border bg-popover/95 p-1.5 text-sm text-popover-foreground shadow-lg backdrop-blur"
          style={{ left: subLeft, top: subTop }}
          onMouseEnter={keepSub}
          onMouseLeave={closeSub}
        >
          {STROKE_WIDTHS.map(({ label, value }) => {
            const active = value === (target as { edgeStrokeWidth: number }).edgeStrokeWidth
            return (
              <button
                key={value}
                role="menuitem"
                type="button"
                onClick={() => handleStrokeChange(value)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors hover:bg-accent",
                  active && "bg-accent"
                )}
              >
                <span
                  className="w-5 rounded-full bg-current"
                  style={{ height: Math.max(2, value) }}
                  aria-hidden
                />
                <span className="flex-1 text-left">{label}</span>
                {active && <HugeiconsIcon icon={Tick02Icon} className="text-primary" strokeWidth={2} />}
              </button>
            )
          })}
        </div>
      )}
    </>
  )
}

// ─── Internal helpers ──────────────────────────────────────────────────────────

function MenuButton({
  icon,
  destructive,
  children,
  onClick,
  onMouseEnter,
}: {
  icon: typeof Delete02Icon
  destructive?: boolean
  children: React.ReactNode
  onClick: () => void
  onMouseEnter?: () => void
}) {
  return (
    <Button
      role="menuitem"
      variant="ghost"
      className={cn(
        "w-full justify-start gap-2 font-normal",
        destructive && "text-destructive hover:bg-destructive/10"
      )}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
    >
      <HugeiconsIcon icon={icon} strokeWidth={2} />
      {children}
    </Button>
  )
}

function SubMenuTrigger({
  label,
  value,
  colorDot,
  active,
  onMouseEnter,
}: {
  label: string
  value?: string
  colorDot?: string | null
  active: boolean
  onMouseEnter: () => void
}) {
  return (
    <Button
      role="menuitem"
      variant="ghost"
      className={cn(
        "w-full justify-start gap-2 font-normal",
        active && "bg-accent"
      )}
      onMouseEnter={onMouseEnter}
    >
      {colorDot !== undefined && (
        <span
          className="size-3 shrink-0 rounded-full"
          style={{ background: colorDot ?? "var(--color-muted-foreground)" }}
          aria-hidden
        />
      )}
      <span className="flex flex-1 items-center gap-2 text-sm">
        {label}
        {value && <span className="text-xs text-muted-foreground">{value}</span>}
      </span>
      <svg className="size-3.5 opacity-40" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
        <path d="M6 4l4 4-4 4" strokeWidth="1.5" stroke="currentColor" fill="none" />
      </svg>
    </Button>
  )
}
