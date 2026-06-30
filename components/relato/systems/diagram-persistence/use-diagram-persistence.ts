"use client"

import { useCallback, useEffect, useState } from "react"

import type { DiagramId, DiagramSummary, SavedDiagram } from "../../domain"
import { createEmptyDiagram, createDiagramId, normalizeSavedDiagram } from "../diagram-repository/schema"
import type { DiagramRepository } from "../diagram-repository"

export type SaveStatus = "loading" | "saved" | "saving" | "error"

export type UseDiagramPersistenceResult = {
  diagrams: DiagramSummary[]
  saveStatus: SaveStatus
  persist: (diagram: SavedDiagram) => Promise<void>
  refreshDiagrams: () => Promise<void>
  createEmpty: () => SavedDiagram
  openDiagram: (id: DiagramId) => Promise<SavedDiagram | null>
  deleteDiagram: (id: DiagramId) => Promise<{ ok: true } | { ok: false; error: string }>
  renameDiagram: (id: DiagramId, title: string) => Promise<void>
  updateDiagramDescription: (id: DiagramId, description: string) => Promise<void>
  exportDiagram: (id: DiagramId) => Promise<SavedDiagram | null>
  duplicateDiagram: (id: DiagramId) => Promise<void>
  importDiagram: (data: SavedDiagram) => Promise<void>
}

export function useDiagramPersistence(
  repository: DiagramRepository | null
): UseDiagramPersistenceResult {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("loading")
  const [diagrams, setDiagrams] = useState<DiagramSummary[]>([])

  const refreshDiagrams = useCallback(async () => {
    if (!repository) return
    setDiagrams(await repository.list())
  }, [repository])

  const persist = useCallback(
    async (diagram: SavedDiagram) => {
      if (!repository) return
      setSaveStatus("saving")
      try {
        await repository.save(diagram)
        await refreshDiagrams()
        setSaveStatus("saved")
      } catch {
        setSaveStatus("error")
      }
    },
    [refreshDiagrams, repository]
  )

  useEffect(() => {
    let cancelled = false
    async function loadProjects() {
      if (!repository) return
      const summaries = await repository.list()
      if (!cancelled) {
        setDiagrams(summaries)
        setSaveStatus("saved")
      }
    }
    loadProjects()
    return () => { cancelled = true }
  }, [repository])

  const createEmpty = useCallback((): SavedDiagram => {
    return createEmptyDiagram(new Date().toISOString(), "Architecture diagram")
  }, [])

  const openDiagram = useCallback(
    async (id: DiagramId): Promise<SavedDiagram | null> => {
      if (!repository) return null
      return repository.load(id)
    },
    [repository]
  )

  const deleteDiagram = useCallback(
    async (id: DiagramId) => {
      if (!repository) return
      await repository.delete(id)
      await refreshDiagrams()
    },
    [refreshDiagrams, repository]
  )

  // Wraps deleteDiagram so a failed delete (e.g. blocked by RLS) surfaces an
  // error instead of silently leaving the project in the list.
  const deleteDiagramSafe = useCallback(
    async (id: DiagramId) => {
      try {
        await deleteDiagram(id)
        return { ok: true as const }
      } catch (err) {
        return {
          ok: false as const,
          error: err instanceof Error ? err.message : "Failed to delete project",
        }
      }
    },
    [deleteDiagram]
  )

  const renameDiagram = useCallback(
    async (id: DiagramId, title: string) => {
      if (!repository) return
      setSaveStatus("saving")
      const diagram = await repository.load(id)
      if (!diagram) {
        setSaveStatus("error")
        return
      }
      const renamed = {
        ...diagram,
        title,
        updatedAt: new Date().toISOString(),
      }
      try {
        await repository.save(renamed)
        await refreshDiagrams()
        setSaveStatus("saved")
      } catch {
        setSaveStatus("error")
      }
    },
    [refreshDiagrams, repository]
  )

  const updateDiagramDescription = useCallback(
    async (id: DiagramId, description: string) => {
      if (!repository) return
      setSaveStatus("saving")
      const diagram = await repository.load(id)
      if (!diagram) {
        setSaveStatus("error")
        return
      }
      const updated = {
        ...diagram,
        description,
        updatedAt: new Date().toISOString(),
      }
      try {
        await repository.save(updated)
        await refreshDiagrams()
        setSaveStatus("saved")
      } catch {
        setSaveStatus("error")
      }
    },
    [refreshDiagrams, repository]
  )

  const exportDiagram = useCallback(
    async (id: DiagramId): Promise<SavedDiagram | null> => {
      if (!repository) return null
      return repository.load(id)
    },
    [repository]
  )

  const duplicateDiagram = useCallback(
    async (id: DiagramId) => {
      if (!repository) return
      const original = await repository.load(id)
      if (!original) return
      const now = new Date().toISOString()
      const copy: SavedDiagram = {
        ...original,
        id: createDiagramId(`diagram-${crypto.randomUUID()}`),
        title: `${original.title} (copy)`,
        createdAt: now,
        updatedAt: now,
      }
      await repository.save(copy)
      await refreshDiagrams()
    },
    [refreshDiagrams, repository]
  )

  const importDiagram = useCallback(
    async (data: SavedDiagram) => {
      if (!repository) return
      const normalized = normalizeSavedDiagram(data)
      if (!normalized) return
      const now = new Date().toISOString()
      const imported: SavedDiagram = {
        ...normalized,
        id: createDiagramId(`diagram-${crypto.randomUUID()}`),
        createdAt: now,
        updatedAt: now,
      }
      await repository.save(imported)
      await refreshDiagrams()
    },
    [refreshDiagrams, repository]
  )

  return {
    diagrams,
    saveStatus,
    persist,
    refreshDiagrams,
    createEmpty,
    openDiagram,
    deleteDiagram: deleteDiagramSafe,
    renameDiagram,
    updateDiagramDescription,
    exportDiagram,
    duplicateDiagram,
    importDiagram,
  }
}
