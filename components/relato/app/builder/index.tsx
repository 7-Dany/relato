"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import type { DiagramId, SavedDiagram } from "../../domain"
import {
  createLocalDiagramRepository,
  createApiDiagramRepository,
} from "../../systems/diagram-repository"
import { createEmptyDiagram } from "../../systems/diagram-repository/schema"
import { useDiagramSession } from "../../systems/diagram-session"
import { useDiagramPersistence } from "../../systems/diagram-persistence"
import { useAuthStatus } from "../../systems/diagram-repository/use-auth-status"
import { RelatoProjectDashboard } from "../../screens/project-dashboard"
import { WorkbenchScreen } from "../../screens/workbench"

function clearLocalStorage() {
  if (typeof window === "undefined") return
  const storage = window.localStorage
  const keysToRemove: string[] = []
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i)
    if (key?.startsWith("relato:diagrams:v1:")) {
      keysToRemove.push(key)
    }
  }
  keysToRemove.forEach((key) => storage.removeItem(key))
}

export function RelatoBuilder() {
  const { user } = useAuthStatus()
  const [migrated, setMigrated] = useState(false)
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "done">("idle")

  const localRepo = useMemo(() => {
    if (typeof window === "undefined") return null
    return createLocalDiagramRepository(window.localStorage)
  }, [])

  const apiRepo = useMemo(() => {
    if (typeof window === "undefined") return null
    return createApiDiagramRepository()
  }, [])

  const repository = useMemo(() => {
    if (user && apiRepo) return apiRepo
    return localRepo
  }, [user, apiRepo, localRepo])

  const persistence = useDiagramPersistence(repository)
  const [view, setView] = useState<"projects" | "workbench">("projects")
  const [isCreatingDiagram, setIsCreatingDiagram] = useState(false)

  // Migrate localStorage → Supabase on first sign-in, then clear localStorage
  useEffect(() => {
    if (!user || migrated || !localRepo || !apiRepo) return
    setMigrated(true)
    setSyncStatus("syncing")

    Promise.all([localRepo.list(), apiRepo.list()]).then(
      async ([localSummaries, apiSummaries]) => {
        const apiIds = new Set(apiSummaries.map((s) => s.id))

        // Only migrate diagrams not already in Supabase
        const toMigrate = localSummaries.filter((s) => !apiIds.has(s.id))

        await Promise.all(
          toMigrate.map(async (summary) => {
            const diagram = await localRepo!.load(summary.id)
            if (diagram) {
              await apiRepo!.save(diagram).catch(() => {})
            }
          })
        )

        clearLocalStorage()
        await persistence.refreshDiagrams()
        setSyncStatus("done")
      }
    )
  }, [user, migrated, localRepo, apiRepo, persistence])

  const { session, canUndo, canRedo, dispatch, undo, redo, loadDiagram } =
    useDiagramSession(persistence.createEmpty(), persistence.persist)

  const openDiagram = useCallback(
    async (id: DiagramId) => {
      const diagram = await persistence.openDiagram(id)
      if (!diagram) return
      loadDiagram(diagram)
      setView("workbench")
    },
    [loadDiagram, persistence]
  )

  const createDiagram = useCallback(async () => {
    if (isCreatingDiagram) return
    setIsCreatingDiagram(true)
    try {
      const diagram = persistence.createEmpty()
      loadDiagram(diagram)
      await persistence.persist(diagram)
      setView("workbench")
    } finally {
      setIsCreatingDiagram(false)
    }
  }, [isCreatingDiagram, loadDiagram, persistence])

  const deleteDiagram = useCallback(
    async (id: DiagramId) => {
      const result = await persistence.deleteDiagram(id)
      if (!result.ok) {
        toast.error("Couldn't delete project", { description: result.error })
        return
      }
      if (id !== session.diagram.id) return
      setView("projects")
    },
    [persistence, session.diagram.id]
  )

  const renameDiagram = useCallback(
    async (id: DiagramId, title: string) => {
      if (id === session.diagram.id) {
        const renamed: SavedDiagram = {
          ...session.diagram,
          title,
          updatedAt: new Date().toISOString(),
        }
        await persistence.persist(renamed)
        loadDiagram(renamed)
      } else {
        await persistence.renameDiagram(id, title)
      }
    },
    [persistence, session.diagram, loadDiagram]
  )

  const updateDiagramDescription = useCallback(
    async (id: DiagramId, description: string) => {
      if (id === session.diagram.id) {
        const updated: SavedDiagram = {
          ...session.diagram,
          description,
          updatedAt: new Date().toISOString(),
        }
        await persistence.persist(updated)
        loadDiagram(updated)
      } else {
        await persistence.updateDiagramDescription(id, description)
      }
    },
    [persistence, session.diagram, loadDiagram]
  )

  const clearDiagram = useCallback(() => {
    const now = new Date().toISOString()
    const blank = createEmptyDiagram(now, session.diagram.title)
    dispatch({
      type: "replace-diagram",
      diagram: {
        ...blank,
        id: session.diagram.id,
        createdAt: session.diagram.createdAt,
      },
    })
  }, [dispatch, session.diagram.createdAt, session.diagram.id, session.diagram.title])

  const isLoading =
    syncStatus === "syncing" ||
    (persistence.saveStatus === "loading" && !user)

  if (view === "projects") {
    return (
      <RelatoProjectDashboard
        diagrams={persistence.diagrams}
        isLoading={isLoading}
        isCreatingDiagram={isCreatingDiagram}
        onCreateDiagram={createDiagram}
        onOpenDiagram={openDiagram}
        onDeleteDiagram={deleteDiagram}
        onRenameDiagram={renameDiagram}
        onUpdateDescription={updateDiagramDescription}
        onExportDiagram={persistence.exportDiagram}
        onDuplicateDiagram={persistence.duplicateDiagram}
        onImportDiagram={persistence.importDiagram}
      />
    )
  }

  return (
    <WorkbenchScreen
      session={session}
      saveStatus={persistence.saveStatus}
      canUndo={canUndo}
      canRedo={canRedo}
      dispatch={dispatch}
      onUndo={undo}
      onRedo={redo}
      onClearDiagram={clearDiagram}
      diagrams={persistence.diagrams}
      onCreateDiagram={createDiagram}
      onOpenDiagram={openDiagram}
      onDeleteDiagram={deleteDiagram}
      onShowProjects={() => setView("projects")}
    />
  )
}
