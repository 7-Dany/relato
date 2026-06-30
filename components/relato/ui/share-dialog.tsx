"use client"

import { useCallback, useState } from "react"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { Link01Icon, Copy01Icon, Tick02Icon } from "@hugeicons/core-free-icons"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

type SharePermission = "view" | "edit"

export function ShareDialog({
  open,
  onOpenChange,
  diagramId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  diagramId: string
}) {
  const [permission, setPermission] = useState<SharePermission>("view")
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createLink = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation()
      setLoading(true)
      setError(null)
      setShareUrl(null)

      try {
        const res = await fetch("/api/relato/shares", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ diagram_id: diagramId, permission }),
        })

        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error ?? "Failed to create share link")
        }

        const data = await res.json()
        const url = `${window.location.origin}/relato/share/${data.token}`
        setShareUrl(url)
        toast.success("Share link created")
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong")
        toast.error("Failed to create share link")
      } finally {
        setLoading(false)
      }
    },
    [diagramId, permission]
  )

  const copyLink = useCallback(async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: select text manually
    }
  }, [shareUrl])

  const reset = useCallback(() => {
    setShareUrl(null)
    setCopied(false)
    setError(null)
    setPermission("view")
  }, [])

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v)
        if (!v) reset()
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HugeiconsIcon icon={Link01Icon} size={16} />
            Share diagram
          </DialogTitle>
          <DialogDescription>
            Create a link to share this diagram with others.
          </DialogDescription>
        </DialogHeader>

        {shareUrl ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={shareUrl}
                onClick={(e) => e.currentTarget.select()}
                className="h-9 flex-1 rounded-md border border-input bg-input/30 px-2 text-sm text-foreground outline-none focus:border-ring"
              />
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                onClick={copyLink}
                className="text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <HugeiconsIcon
                  icon={copied ? Tick02Icon : Copy01Icon}
                  size={16}
                />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Anyone with this link can{" "}
              {permission === "edit" ? "view and edit" : "view"} this diagram.
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={reset}
              className="text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              Create another link
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <RadioGroup
              value={permission}
              onValueChange={(v) => setPermission(v as SharePermission)}
              className="flex flex-col gap-2"
            >
              <Label className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-input/20 p-3 text-sm text-foreground hover:bg-accent/50 has-[:checked]:border-primary">
                <RadioGroupItem value="view" />
                <div>
                  <div className="font-medium">Can view</div>
                  <div className="text-xs text-muted-foreground">
                    Read-only access to the diagram
                  </div>
                </div>
              </Label>
              <Label className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-input/20 p-3 text-sm text-foreground hover:bg-accent/50 has-[:checked]:border-primary">
                <RadioGroupItem value="edit" />
                <div>
                  <div className="font-medium">Can edit</div>
                  <div className="text-xs text-muted-foreground">
                    Recipient needs to sign in to edit
                  </div>
                </div>
              </Label>
            </RadioGroup>

            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={createLink}
                disabled={loading}
              >
                {loading ? "Creating…" : "Create link"}
              </Button>
              <p className="text-xs text-muted-foreground">
                Anyone with this link can{" "}
                {permission === "edit" ? "view and edit" : "view"} this diagram.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
