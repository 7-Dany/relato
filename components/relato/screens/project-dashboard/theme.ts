import type { SavedDiagram } from "../../domain"

export const theme = {
  bg: "bg-background",
  card: "bg-card",
  border: "border-border",
  text: "text-foreground",
  muted: "text-muted-foreground",
  input: "bg-input/40",
  placeholder: "placeholder:text-muted-foreground/60",
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

export function downloadJson(data: SavedDiagram) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${data.title || "project"}.json`
  a.click()
  URL.revokeObjectURL(url)
}
