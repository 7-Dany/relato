"use client";

import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  Add01Icon,
  FolderIcon,
  Cancel01Icon,
  Sun01Icon,
  Moon01Icon,
  ArrowRight01Icon,
  LinkIcon,
  UnfoldMoreIcon,
  DiamondIcon,
  HelpCircleIcon,
  Message01Icon,
  Download01Icon,
  ArrangeIcon,
} from "@hugeicons/core-free-icons";
import { useState, useMemo } from "react";
import { useTheme } from "next-themes";
import { useReactFlow } from "@xyflow/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
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

import { useDiagramActions } from "../context";
import {
  useDiagramActiveEdgeType,
  useDiagramActivePatternId,
  useDiagramStore,
} from "@/lib/diagram-store";
import { EDGE_TYPE_META, EDGE_TYPE_BY_VALUE } from "../constants";
import { PATTERNS } from "@/lib/patterns";
import { ShortcutsDialog } from "./shortcuts-dialog";

// ─── Constants ──────────────────────────────────────────────────────────────

const EDGE_ICON_MAP: Record<string, IconSvgElement> = {
  association: ArrowRight01Icon,
  dependency: LinkIcon,
  inheritance: UnfoldMoreIcon,
  aggregation: DiamondIcon,
};

// ─── Tool Button ────────────────────────────────────────────────────────────

function ToolButton({
  icon,
  label,
  onClick,
}: {
  icon: IconSvgElement;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="size-8"
    >
      <HugeiconsIcon icon={icon} strokeWidth={2} />
    </Button>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

export function BottomToolbar() {
  const { addNode, addExplanationCard, loadPattern, resetDiagram, layout } =
    useDiagramActions();
  const activeEdgeType = useDiagramActiveEdgeType();
  const activePatternId = useDiagramActivePatternId();
  const { setActiveEdgeType } = useDiagramStore();
  const { resolvedTheme, setTheme } = useTheme();
  const {
    getNodes,
    getEdges,
    getNodesBounds: getFlowNodesBounds,
  } = useReactFlow();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [patternOpen, setPatternOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isClearOpen, setIsClearOpen] = useState(false);
  const [pendingPatternId, setPendingPatternId] = useState<string | null>(null);

  const hasDiagramContent = useMemo(() => getNodes().length > 0, [getNodes]);

  const handleExportPNG = async () => {
    if (isExporting) return;
    setIsExporting(true);
    toast.loading("Exporting...");

    const nodes = getNodes();
    if (nodes.length === 0) {
      toast.dismiss();
      toast.error("Nothing to export");
      setIsExporting(false);
      return;
    }

    // Try multiple selectors for better compatibility across React Flow versions
    const rendererEl =
      (document.querySelector(".react-flow__renderer") as HTMLElement | null) ||
      (document.querySelector(
        "[data-testid='react-flow-renderer']",
      ) as HTMLElement | null) ||
      (document.querySelector(".react-flow") as HTMLElement | null);

    if (!rendererEl) {
      toast.dismiss();
      toast.error("Canvas not found");
      setIsExporting(false);
      return;
    }

    try {
      const PIXEL_RATIO = 2;
      const bgColor = resolvedTheme === "dark" ? "#09090b" : "#ffffff";

      const { toPng } = await import("html-to-image");

      // Calculate tight bounds around all nodes for cleaner export
      // This ensures we only export the diagram area, not empty canvas space
      const nodesBounds = getFlowNodesBounds(nodes);

      // If we can't calculate bounds, fall back to full renderer export
      if (!nodesBounds || nodesBounds.width === 0 || nodesBounds.height === 0) {
        throw new Error("Unable to calculate diagram bounds");
      }

      // Create export options with proper typing
      const exportOptions = {
        backgroundColor: bgColor,
        pixelRatio: PIXEL_RATIO,
        cacheBust: true, // Prevent cached/stale exports
        // Comprehensive filter to exclude React Flow UI elements
        filter: (node: HTMLElement) => {
          if (!node.classList) return true;

          // Exclude all React Flow UI panels and controls
          const excludeClasses = [
            "react-flow__controls",
            "react-flow__minimap",
            "react-flow__panel",
            "react-flow__background",
            "react-flow__attribution",
          ];

          return !excludeClasses.some((cls) => node.classList.contains(cls));
        },
        // Style adjustments for better export quality
        style: {
          // Ensure the exported area matches the calculated bounds
          transform: `scale(1)`,
        },
      };

      const dataUrl = await toPng(rendererEl, exportOptions);

      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = "relato-diagram.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.dismiss();
      toast("Exported as PNG");
    } catch (err) {
      console.error("PNG export error:", err);
      toast.dismiss();
      toast.error(`Export failed: ${(err as Error).message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJSON = () => {
    try {
      const data = {
        version: "1.0",
        exportedAt: new Date().toISOString(),
        nodes: getNodes(),
        edges: getEdges(),
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "relato-diagram.json";
      a.click();
      URL.revokeObjectURL(url);
      toast("Exported as JSON");
    } catch {
      toast.error("JSON export failed — diagram contains circular references");
    }
  };

  const activeMeta = EDGE_TYPE_BY_VALUE.get(activeEdgeType);
  const ActiveEdgeIcon = EDGE_ICON_MAP[activeEdgeType];

  return (
    <>
      <div
        className="fixed bottom-4 z-50 flex items-center gap-0.5 rounded-xl border bg-background/95 px-2 py-1.5 shadow-lg backdrop-blur supports-backdrop-filter:bg-background/60"
        style={{ left: "calc(50% + 130px)", transform: "translateX(-50%)" }}
      >
        <ToolButton
          icon={Add01Icon}
          label="Add Class (N)"
          onClick={() => addNode(null)}
        />
        <ToolButton
          icon={Message01Icon}
          label="Add Explanation Card"
          onClick={() => addExplanationCard()}
        />
        <ToolButton
          icon={ArrangeIcon}
          label="Auto-layout diagram (L)"
          onClick={() => layout("TB")}
        />

        <Separator orientation="vertical" className="mx-1 h-8 self-center" />

        {/* Edge type */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="size-8"
                aria-label={`${activeMeta?.label} edge type`}
                title={`${activeMeta?.label} — Click to change`}
              />
            }
          >
            {ActiveEdgeIcon && (
              <HugeiconsIcon icon={ActiveEdgeIcon} strokeWidth={2} />
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-56">
            <DropdownMenuGroup>
              {EDGE_TYPE_META.map(({ value, label }) => {
                const EdgeIcon = EDGE_ICON_MAP[value];
                return (
                  <DropdownMenuItem
                    key={value}
                    onClick={() => setActiveEdgeType(value)}
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
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="mx-1 h-8 self-center" />

        {/* Blueprints */}
        <DropdownMenu open={patternOpen} onOpenChange={setPatternOpen}>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="size-8"
                aria-label="Reference Blueprints"
                title="Blueprints"
              />
            }
          >
            <HugeiconsIcon icon={FolderIcon} strokeWidth={2} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-64">
            <DropdownMenuGroup>
              {PATTERNS.map((pattern) => {
                const isActive = activePatternId === pattern.id;
                return (
                  <DropdownMenuItem
                    key={pattern.id}
                    onClick={() => {
                      if (hasDiagramContent && !isActive) {
                        setPendingPatternId(pattern.id);
                        setPatternOpen(false);
                      } else {
                        loadPattern(pattern.id);
                        setPatternOpen(false);
                      }
                    }}
                    className="gap-2"
                  >
                    <span className="text-sm">{pattern.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {pattern.nodes.length}
                    </span>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <ToolButton
          icon={Cancel01Icon}
          label={activePatternId ? "Blank Map" : "Clear"}
          onClick={() => {
            if (hasDiagramContent) {
              setIsClearOpen(true);
            } else {
              resetDiagram();
            }
          }}
        />

        <Separator orientation="vertical" className="mx-1 h-8 self-center" />

        {/* Export */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="size-8"
                aria-label="Export diagram"
                disabled={isExporting}
              >
                <HugeiconsIcon icon={Download01Icon} strokeWidth={2} />
              </Button>
            }
          />
          <DropdownMenuContent align="center" className="min-w-35">
            <DropdownMenuItem onClick={handleExportPNG} disabled={isExporting}>
              PNG Image
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportJSON}>
              JSON Data
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <ToolButton
          icon={HelpCircleIcon}
          label="Keyboard Shortcuts"
          onClick={() => setShortcutsOpen(true)}
        />
        <ToolButton
          icon={resolvedTheme === "dark" ? Sun01Icon : Moon01Icon}
          label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        />
      </div>

      <ShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />

      {/* Clear diagram confirmation */}
      <AlertDialog open={isClearOpen} onOpenChange={setIsClearOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear diagram?</AlertDialogTitle>
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
                resetDiagram();
                setIsClearOpen(false);
              }}
            >
              Clear
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Load pattern confirmation */}
      <AlertDialog
        open={pendingPatternId !== null}
        onOpenChange={(open) => {
          if (!open) setPendingPatternId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Load blueprint?</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace the current diagram. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingPatternId) {
                  loadPattern(pendingPatternId);
                }
                setPendingPatternId(null);
              }}
            >
              Load
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
