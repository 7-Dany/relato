import type { Metadata } from "next";
import { Suspense } from "react";
import { DiagramBuilderClient } from "@/components/diagram/builder-client";

// ─── Route metadata ───────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "Architecture Review Workspace",
  description:
    "Map architecture, connect diagram nodes to source files, and review dependency flow without chart noise.",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

/**
 * `/diagram` route.
 *
 * This is a thin shell — all logic lives in `DiagramBuilder`.
 * Keeping the page component minimal makes it trivial to wrap it with
 * auth, layout variants, or Suspense boundaries in future iterations.
 */

export default async function DiagramPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string }>;
}) {
  const { reference } = await searchParams;
  const initialPatternId = typeof reference === "string" ? reference : null;

  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <div className="text-sm text-muted-foreground">
            Loading diagram builder…
          </div>
        </div>
      }
    >
      <DiagramBuilderClient initialPatternId={initialPatternId} />
    </Suspense>
  );
}
