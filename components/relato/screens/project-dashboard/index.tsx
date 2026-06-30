"use client"

import { useEffect, useMemo, useState, useRef } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Add01Icon,
  Cancel01Icon,
  FlowIcon,
  GridViewIcon,
  ListViewIcon,
  Loading03Icon,
  Search01Icon,
  SortingIcon,
  Upload04Icon,
} from "@hugeicons/core-free-icons"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { ThemeToggle } from "@/components/theme-toggle"
import { AuthButton } from "../../ui/auth-button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"
import type { DiagramId, DiagramSummary, SavedDiagram } from "../../domain"
import { normalizeSavedDiagram } from "../../systems/diagram-repository/schema"
import { EmptyProjectState, SearchEmptyState } from "./empty-states"
import { ProjectCard } from "./project-card"
import { theme } from "./theme"

type SortKey = "updatedAt" | "title" | "nodeCount"
type ViewMode = "grid" | "list"

const SORT_LABELS: Record<SortKey, string> = {
  updatedAt: "Last modified",
  title: "Name",
  nodeCount: "Size",
}

export function RelatoProjectDashboard({
  diagrams,
  isLoading,
  isCreatingDiagram,
  onCreateDiagram,
  onOpenDiagram,
  onDeleteDiagram,
  onRenameDiagram,
  onUpdateDescription,
  onExportDiagram,
  onDuplicateDiagram,
  onImportDiagram,
}: {
  diagrams: DiagramSummary[]
  isLoading?: boolean
  isCreatingDiagram?: boolean
  onCreateDiagram: () => void
  onOpenDiagram: (id: DiagramId) => void
  onDeleteDiagram: (id: DiagramId) => void
  onRenameDiagram: (id: DiagramId, title: string) => void
  onUpdateDescription?: (id: DiagramId, description: string) => void
  onExportDiagram?: (id: DiagramId) => Promise<SavedDiagram | null>
  onDuplicateDiagram?: (id: DiagramId) => Promise<void>
  onImportDiagram?: (data: SavedDiagram) => Promise<void>
}) {
  const [titles, setTitles] = useState<Record<string, string>>({})
  const [descriptions, setDescriptions] = useState<Record<string, string>>({})
  const [search, setSearch] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("updatedAt")
  const [view, setView] = useState<ViewMode>("grid")
  const [deleteTarget, setDeleteTarget] = useState<DiagramSummary | null>(null)
  const importInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTitles(Object.fromEntries(diagrams.map((d) => [d.id, d.title])))
    setDescriptions(
      Object.fromEntries(diagrams.map((d) => [d.id, d.description]))
    )
  }, [diagrams])

  function commitTitle(diagram: DiagramSummary) {
    const next = titles[diagram.id]?.trim()
    if (!next || next === diagram.title) return
    onRenameDiagram(diagram.id, next)
  }

  function commitDescription(diagram: DiagramSummary) {
    const next = descriptions[diagram.id] ?? ""
    if (next === diagram.description) return
    onUpdateDescription?.(diagram.id, next)
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return diagrams
      .filter(
        (d) =>
          !q ||
          (d.title ?? "").toLowerCase().includes(q) ||
          (d.description ?? "").toLowerCase().includes(q)
      )
      .sort((a, b) => {
        if (sortKey === "title") return (a.title ?? "").localeCompare(b.title ?? "")
        if (sortKey === "nodeCount") return b.nodeCount - a.nodeCount
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      })
  }, [diagrams, search, sortKey])

  return (
    <>
      <input
        ref={importInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0]
          if (!file) return
          try {
            const text = await file.text()
            const data = JSON.parse(text)
            const normalized = normalizeSavedDiagram(data)
            if (normalized) {
              await onImportDiagram?.(normalized)
            }
          } catch {
            /* invalid file */
          }
          e.target.value = ""
        }}
      />

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete &ldquo;{deleteTarget?.title}&rdquo;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the project and all of its diagram
              data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (deleteTarget) onDeleteDiagram(deleteTarget.id)
                setDeleteTarget(null)
              }}
            >
              Delete project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className={cn(theme.bg, theme.text, "min-h-svh w-full")}>
        {/* ── Top app bar — brand + account-level actions ──────────────── */}
        <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="mx-auto flex h-14 w-full items-center gap-3 px-6 lg:px-10 xl:px-16">
            <div className="flex min-w-0 items-center gap-2.5">
              <div
                aria-hidden
                className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground"
              >
                <HugeiconsIcon icon={FlowIcon} size={16} />
              </div>
              <span className="truncate text-[15px] font-semibold tracking-tight">
                Relato
              </span>
            </div>

            <div className="ml-auto flex shrink-0 items-center gap-1.5">
              <ThemeToggle />
              <AuthButton />

              <Separator orientation="vertical" className="mx-1.5 h-5" />

              <Button
                variant="ghost"
                size="sm"
                onClick={() => importInputRef.current?.click()}
                className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <HugeiconsIcon icon={Upload04Icon} size={14} />
                Import
              </Button>
              <Button
                onClick={onCreateDiagram}
                disabled={isCreatingDiagram}
                aria-busy={isCreatingDiagram}
                size="sm"
                className="h-8 gap-1.5 text-xs"
              >
                <HugeiconsIcon
                  icon={isCreatingDiagram ? Loading03Icon : Add01Icon}
                  size={14}
                  className={isCreatingDiagram ? "animate-spin" : undefined}
                />
                {isCreatingDiagram ? "Creating…" : "New project"}
              </Button>
            </div>
          </div>
        </header>

        {/* ── Content ──────────────────────────────────────────────────── */}
        <div className="mx-auto flex w-full flex-col gap-5 px-6 py-6 lg:px-10 xl:px-16">
          {/* ── Toolbar — search + filters for the project list ──────────── */}
          <div className="flex flex-wrap items-center gap-3">
            <InputGroup className="min-w-0 max-w-sm flex-1">
              <InputGroupAddon>
                <HugeiconsIcon icon={Search01Icon} className="text-muted-foreground" />
              </InputGroupAddon>
              <InputGroupInput
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search projects..."
                className="h-9 text-sm"
              />
              {search ? (
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    size="icon-xs"
                    variant="ghost"
                    onClick={() => setSearch("")}
                    aria-label="Clear search"
                    className="text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    <HugeiconsIcon icon={Cancel01Icon} />
                  </InputGroupButton>
                </InputGroupAddon>
              ) : null}
            </InputGroup>

            <div className="ml-auto flex shrink-0 items-center gap-2">
              {diagrams.length > 0 && (
                <span className={cn("hidden text-xs sm:inline", theme.muted)}>
                  {filtered.length} of {diagrams.length} project
                  {diagrams.length !== 1 ? "s" : ""}
                </span>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="outline"
                      size="sm"
                      aria-label="Sort projects"
                      title="Sort projects"
                      className="h-9 text-xs"
                    />
                  }
                >
                  <HugeiconsIcon icon={SortingIcon} data-icon="inline-start" />
                  <span className="hidden sm:inline">{SORT_LABELS[sortKey]}</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-40">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel
                      className={cn(
                        "text-[10px] font-black tracking-wider uppercase",
                        theme.muted
                      )}
                    >
                      Sort by
                    </DropdownMenuLabel>
                    <DropdownMenuRadioGroup
                      value={sortKey}
                      onValueChange={(value) =>
                        setSortKey(value as SortKey)
                      }
                    >
                      {(Object.keys(SORT_LABELS) as SortKey[]).map(
                        (key) => (
                          <DropdownMenuRadioItem key={key} value={key}>
                            {SORT_LABELS[key]}
                          </DropdownMenuRadioItem>
                        )
                      )}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              <ToggleGroup
                variant="outline"
                value={[view]}
                onValueChange={(value) => {
                  const next = value[0] as ViewMode | undefined
                  if (next) setView(next)
                }}
                className="h-9"
              >
                <ToggleGroupItem
                  value="grid"
                  aria-label="Grid view"
                  className="size-8 p-0"
                >
                  <HugeiconsIcon icon={GridViewIcon} size={14} />
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="list"
                  aria-label="List view"
                  className="size-8 p-0"
                >
                  <HugeiconsIcon icon={ListViewIcon} size={14} />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>

          {diagrams.length > 0 && (
            <p className={cn("-mt-2 text-xs sm:hidden", theme.muted)}>
              {filtered.length} of {diagrams.length} project
              {diagrams.length !== 1 ? "s" : ""}
            </p>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <div
                className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
                role="status"
              >
                <span className="sr-only">Loading projects…</span>
              </div>
            </div>
          ) : diagrams.length > 0 ? (
            <>
              {filtered.length === 0 ? (
                <SearchEmptyState
                  search={search}
                  onClear={() => setSearch("")}
                />
              ) : (
                <section
                  className={cn(
                    view === "grid"
                      ? "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
                      : "flex flex-col gap-2"
                  )}
                >
                  {filtered.map((diagram) => (
                    <ProjectCard
                      key={diagram.id}
                      diagram={diagram}
                      titleValue={titles[diagram.id] ?? diagram.title}
                      descriptionValue={
                        descriptions[diagram.id] ?? diagram.description
                      }
                      view={view}
                      canEditDescription={Boolean(onUpdateDescription)}
                      onTitleChange={(value) =>
                        setTitles((current) => ({
                          ...current,
                          [diagram.id]: value,
                        }))
                      }
                      onTitleBlur={() => commitTitle(diagram)}
                      onDescriptionChange={(value) =>
                        setDescriptions((current) => ({
                          ...current,
                          [diagram.id]: value,
                        }))
                      }
                      onDescriptionBlur={() => commitDescription(diagram)}
                      onOpen={() => onOpenDiagram(diagram.id)}
                      onDelete={() => setDeleteTarget(diagram)}
                      onDuplicate={() => onDuplicateDiagram?.(diagram.id)}
                      onExportDiagram={onExportDiagram}
                    />
                  ))}
                </section>
              )}
            </>
          ) : (
            <EmptyProjectState
              onCreateDiagram={onCreateDiagram}
              isCreatingDiagram={isCreatingDiagram}
            />
          )}
        </div>
      </div>
    </>
  )
}
