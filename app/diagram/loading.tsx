import { Spinner } from "@/components/ui/spinner";

/**
 * Loading UI for the `/diagram` route segment.
 *
 * Next.js automatically shows this component as a Suspense fallback
 * while the route segment is loading or streaming.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/loading
 */
export default function DiagramLoading() {
  return (
    <div
      className="flex h-screen items-center justify-center bg-background"
      role="status"
      aria-label="Loading diagram builder"
    >
      <div className="flex flex-col items-center gap-4">
        <Spinner className="size-8" />
        <p className="text-sm text-muted-foreground">
          Loading diagram builder…
        </p>
      </div>
    </div>
  );
}
