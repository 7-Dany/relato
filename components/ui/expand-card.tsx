"use client"

import * as React from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"

import { cn } from "@/lib/utils"

// ─── Types ───────────────────────────────────────────────────────────────────

type Rect = { top: number; left: number; width: number; height: number }
type Size = { width: number; height: number }

export type ExpandPlacement = "auto" | "top" | "bottom"

// ─── Constants ───────────────────────────────────────────────────────────────

const EASE = [0.23, 1, 0.32, 1] as const
const ENTER = { duration: 0.28, ease: EASE }
const EXIT = { duration: 0.2, ease: EASE }
const FADE = { duration: 0.18, ease: "easeOut" as const }
const CONTENT = { duration: 0.18, delay: 0.06, ease: "easeOut" as const }
const REDUCED = { duration: 0 }

const FOCUSABLE_SELECTOR =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),[tabindex]:not([tabindex="-1"])'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const clamp = (v: number, lo: number, hi: number) =>
  v < lo ? lo : v > hi ? hi : v

function computePanelRect(
  anchor: Rect,
  panel: Size,
  container: Size,
  gutter: number,
  placement: ExpandPlacement
): Rect {
  const prefersRight = anchor.left + anchor.width / 2 <= container.width / 2
  const left = clamp(
    prefersRight ? anchor.left : anchor.left + anchor.width - panel.width,
    gutter,
    Math.max(gutter, container.width - panel.width - gutter)
  )

  const minTop = gutter
  const maxTop = Math.max(gutter, container.height - panel.height - gutter)

  let top: number
  if (placement === "top") {
    // Align bottom of panel with bottom of anchor; grow upward
    top = anchor.top + anchor.height - panel.height
  } else if (placement === "bottom") {
    top = anchor.top
  } else {
    // auto: prefer below anchor, fall back above if not enough room
    top =
      anchor.top > maxTop
        ? anchor.top + anchor.height - panel.height
        : anchor.top
  }

  // ── Universal clamp ──────────────────────────────────────────────────────
  // Applied to ALL placements — prevents the panel from escaping the viewport
  // regardless of where the anchor sits on screen.
  top = clamp(top, minTop, maxTop)

  // ── Tall-panel centering ─────────────────────────────────────────────────
  // When the panel fills ≥60 % of the viewport height, anchoring it to the
  // card edge looks wrong — the card may be near the bottom/top of the page.
  // Centre it vertically instead so it always feels intentional.
  const fillRatio = panel.height / container.height
  if (fillRatio >= 0.6) {
    top = clamp(
      Math.round((container.height - panel.height) / 2),
      minTop,
      maxTop
    )
  }

  return { top, left, width: panel.width, height: panel.height }
}

// ─── Root provider (singleton) ───────────────────────────────────────────────

type RootState = {
  activeId: string | null
  activeGroupId: string | null
  panelId: string
  open: (groupId: string, id: string, trigger: HTMLElement | null) => void
  close: () => void
}

const RootCtx = React.createContext<RootState | null>(null)

function ExpandCardProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = React.useState<{
    groupId: string
    id: string
  } | null>(null)
  const triggerRef = React.useRef<HTMLElement | null>(null)
  const baseId = React.useId()
  const panelId = `${baseId}-panel`

  const open = React.useCallback(
    (groupId: string, id: string, trigger: HTMLElement | null) => {
      triggerRef.current = trigger
      setActive({ groupId, id })
    },
    []
  )
  const close = React.useCallback(() => setActive(null), [])

  // Restore focus on close
  const wasOpen = React.useRef(false)
  React.useEffect(() => {
    if (active) {
      wasOpen.current = true
    } else if (wasOpen.current) {
      wasOpen.current = false
      triggerRef.current?.focus({ preventScroll: true })
    }
  }, [active])

  // Escape — only attached while open
  React.useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation()
        setActive(null)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [active])

  const value = React.useMemo<RootState>(
    () => ({
      activeId: active?.id ?? null,
      activeGroupId: active?.groupId ?? null,
      panelId,
      open,
      close,
    }),
    [active, panelId, open, close]
  )

  return <RootCtx.Provider value={value}>{children}</RootCtx.Provider>
}

function useRoot() {
  const ctx = React.useContext(RootCtx)
  if (!ctx)
    throw new Error("ExpandCardGrid must be wrapped in <ExpandCardProvider>")
  return ctx
}

// ─── Grid context ────────────────────────────────────────────────────────────

type GridContextValue = {
  activeId: string | null
  panelRect: Rect | null
  panelId: string
  somethingOpen: boolean
  open: (id: string, trigger: HTMLElement | null) => void
  close: () => void
  registerItem: (id: string, node: HTMLButtonElement | null) => void
}

const GridCtx = React.createContext<GridContextValue | null>(null)

function useExpandCard() {
  const ctx = React.useContext(GridCtx)
  if (!ctx)
    throw new Error("useExpandCard must be used within <ExpandCardGrid>")
  return ctx
}

// ─── ExpandCardGrid ──────────────────────────────────────────────────────────

type ExpandCardGridProps = React.ComponentProps<"div"> & {
  renderPanel: (id: string) => React.ReactNode
  panelWidth?: number | ((containerWidth: number) => number)
  gutter?: number
  panelRadius?: number
  itemRadius?: number
  /** Where the expanded panel grows from. Default: "auto" */
  placement?: ExpandPlacement
}

function ExpandCardGrid({
  className,
  children,
  renderPanel,
  panelWidth: panelWidthProp,
  gutter = 12,
  panelRadius = 20,
  itemRadius = 16,
  placement = "auto",
  ...props
}: ExpandCardGridProps) {
  const root = useRoot()
  const groupId = React.useId()
  const isActiveGroup = root.activeGroupId === groupId
  const activeId = isActiveGroup ? root.activeId : null

  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const itemsRef = React.useRef(new Map<string, HTMLButtonElement>())
  const measureRef = React.useRef<HTMLDivElement | null>(null)
  const panelRef = React.useRef<HTMLDivElement | null>(null)

  const [layout, setLayout] = React.useState<{
    anchor: Rect
    container: Size
    width: number
  } | null>(null)
  const [panelRect, setPanelRect] = React.useState<Rect | null>(null)

  const reduceMotion = useReducedMotion()

  const registerItem = React.useCallback(
    (id: string, node: HTMLButtonElement | null) => {
      if (node) itemsRef.current.set(id, node)
      else itemsRef.current.delete(id)
    },
    []
  )

  const syncLayout = React.useCallback(
    (id: string) => {
      const container = containerRef.current
      const item = itemsRef.current.get(id)
      if (!container || !item) return
      // Use viewport-relative coords so the fixed panel can be placed anywhere
      const itemR = item.getBoundingClientRect()
      const anchor: Rect = {
        top: itemR.top,
        left: itemR.left,
        width: itemR.width,
        height: itemR.height,
      }
      const cr = container.getBoundingClientRect()
      // Constrain against the viewport, not just the local grid container
      const containerSize: Size = {
        width: window.innerWidth,
        height: window.innerHeight,
      }
      const width =
        typeof panelWidthProp === "function"
          ? panelWidthProp(cr.width)
          : (panelWidthProp ?? Math.min(520, cr.width - gutter * 2))
      setLayout({ anchor, container: containerSize, width })
    },
    [panelWidthProp, gutter]
  )

  React.useEffect(() => {
    if (!activeId) {
      setLayout(null)
      setPanelRect(null)
      return
    }
    syncLayout(activeId)
  }, [activeId, syncLayout])

  React.useEffect(() => {
    if (!activeId) return
    const update = () => syncLayout(activeId)
    const ro = new ResizeObserver(update)
    if (containerRef.current) ro.observe(containerRef.current)
    window.addEventListener("scroll", update, { passive: true, capture: true })
    return () => {
      ro.disconnect()
      window.removeEventListener("scroll", update, { capture: true })
    }
  }, [activeId, syncLayout])

  React.useLayoutEffect(() => {
    if (!activeId || !layout || !measureRef.current) return
    // Cap height to the viewport so the panel never extends off-screen
    const maxH = layout.container.height - gutter * 2
    const h = Math.min(measureRef.current.offsetHeight, maxH)
    setPanelRect(
      computePanelRect(
        layout.anchor,
        { width: layout.width, height: h },
        layout.container,
        gutter,
        placement
      )
    )
  }, [activeId, layout, gutter, placement])

  const open = React.useCallback(
    (id: string, trigger: HTMLElement | null) =>
      root.open(groupId, id, trigger),
    [root, groupId]
  )
  const close = React.useCallback(() => root.close(), [root])

  // Tab trap
  React.useEffect(() => {
    if (!activeId) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !panelRef.current) return
      const els =
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      if (els.length === 0) {
        e.preventDefault()
        panelRef.current.focus()
        return
      }
      const first = els[0]
      const last = els[els.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [activeId])

  React.useEffect(() => {
    if (activeId && panelRect) panelRef.current?.focus({ preventScroll: true })
  }, [activeId, panelRect])

  const origins = React.useMemo(() => {
    if (!layout || !panelRect) return { v: "top", h: "left" } as const
    const a = layout.anchor
    const v =
      Math.abs(panelRect.top + panelRect.height - (a.top + a.height)) <
      Math.abs(panelRect.top - a.top)
        ? "bottom"
        : "top"
    const h = panelRect.left < a.left ? "right" : "left"
    return { v, h } as const
  }, [layout, panelRect])

  const ctxValue = React.useMemo<GridContextValue>(
    () => ({
      activeId,
      panelRect,
      panelId: root.panelId,
      somethingOpen: Boolean(root.activeId),
      open,
      close,
      registerItem,
    }),
    [
      activeId,
      panelRect,
      root.panelId,
      root.activeId,
      open,
      close,
      registerItem,
    ]
  )

  const enter = reduceMotion ? REDUCED : ENTER
  const exit = reduceMotion ? REDUCED : EXIT
  const fade = reduceMotion ? REDUCED : FADE
  const content = reduceMotion ? REDUCED : CONTENT
  const anchor = layout?.anchor ?? null

  return (
    <GridCtx.Provider value={ctxValue}>
      <div
        ref={containerRef}
        data-slot="expand-card-grid"
        data-state={activeId ? "open" : "closed"}
        className={cn(
          "relative isolate",
          // When a card is open, lift this stacking context above sibling
          // grids. Without an explicit z-index both grids sit at "auto"
          // stacking level, so the later-in-DOM memory section paints over
          // the CPU panel and makes it look glassy / transparent.
          activeId && "z-50",
          className
        )}
        {...props}
      >
        {children}

        {activeId && layout ? (
          <div
            aria-hidden="true"
            inert
            data-slot="expand-card-measure"
            className="pointer-events-none invisible absolute top-0 left-0 -z-10 opacity-0"
            style={{ width: layout.width }}
          >
            <div ref={measureRef}>{renderPanel(activeId)}</div>
          </div>
        ) : null}

        <AnimatePresence>
          {activeId && anchor && panelRect ? (
            <React.Fragment key={activeId}>
              <motion.button
                type="button"
                aria-label="Close expanded card"
                tabIndex={-1}
                data-slot="expand-card-backdrop"
                className={cn(
                  "fixed inset-0 z-40 cursor-default",
                  "bg-foreground/15 backdrop-blur-sm",
                  "dark:bg-background/70"
                )}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={fade}
                onClick={close}
              />
              <motion.div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                id={root.panelId}
                tabIndex={-1}
                data-slot="expand-card-panel"
                className={cn(
                  // fixed: floats over the full viewport, never clipped by the grid container
                  "fixed z-[9999] overflow-hidden",
                  "bg-card text-card-foreground",
                  // ring instead of border → no +2px making the body overflow
                  "ring-1 ring-border",
                  "shadow-2xl shadow-black/30 dark:shadow-black/60",
                  "focus:outline-none",
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                )}
                initial={{
                  top: anchor.top,
                  left: anchor.left,
                  width: anchor.width,
                  height: anchor.height,
                  borderRadius: itemRadius,
                }}
                animate={{
                  top: panelRect.top,
                  left: panelRect.left,
                  width: panelRect.width,
                  height: panelRect.height,
                  borderRadius: panelRadius,
                }}
                exit={{
                  top: anchor.top,
                  left: anchor.left,
                  width: anchor.width,
                  height: anchor.height,
                  borderRadius: itemRadius,
                  transition: exit,
                }}
                transition={enter}
                style={{
                  // Belt-and-suspenders: guarantee opaque surface even if a
                  // utility class loses the cascade race during animation.
                  backgroundColor: "var(--card)",
                  willChange: "top, left, width, height",
                  isolation: "isolate",
                  transformOrigin: `${origins.v} ${origins.h}`,
                }}
              >
                <motion.div
                  data-slot="expand-card-panel-content"
                  className="h-full"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={content}
                >
                  {renderPanel(activeId)}
                </motion.div>
              </motion.div>
            </React.Fragment>
          ) : null}
        </AnimatePresence>
      </div>
    </GridCtx.Provider>
  )
}

// ─── ExpandCardItem ──────────────────────────────────────────────────────────

type ExpandCardItemProps = Omit<
  React.ComponentProps<"button">,
  "onClick" | "id"
> & {
  id: string
}

function ExpandCardItem({ id, className, ref, ...props }: ExpandCardItemProps) {
  const {
    activeId,
    panelRect,
    open,
    close,
    registerItem,
    panelId,
    somethingOpen,
  } = useExpandCard()

  const isActive = id === activeId
  const isFaded = somethingOpen && !isActive
  const panelVisible = Boolean(activeId && panelRect)
  const localRef = React.useRef<HTMLButtonElement | null>(null)

  const setRef = React.useCallback(
    (node: HTMLButtonElement | null) => {
      localRef.current = node
      registerItem(id, node)
      if (typeof ref === "function") ref(node)
      else if (ref)
        (ref as React.RefObject<HTMLButtonElement | null>).current = node
    },
    [id, ref, registerItem]
  )

  return (
    <button
      type="button"
      ref={setRef}
      data-slot="expand-card-item"
      data-state={isActive ? "open" : "closed"}
      data-faded={isFaded || undefined}
      aria-expanded={isActive}
      aria-haspopup="dialog"
      aria-controls={isActive ? panelId : undefined}
      onClick={() => (isActive ? close() : open(id, localRef.current))}
      className={cn(
        "group/card relative block w-full cursor-pointer appearance-none overflow-visible rounded-2xl border-0 bg-transparent p-0 text-left select-none",
        "transition-[opacity,filter] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
        isFaded && "pointer-events-none opacity-35 blur-[1.5px]",
        isActive &&
          panelVisible &&
          "pointer-events-none opacity-0 duration-150",
        className
      )}
      {...props}
    />
  )
}

export { ExpandCardProvider, ExpandCardGrid, ExpandCardItem, useExpandCard }
