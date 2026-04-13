"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Route-level error boundary for the `/diagram` route.
 *
 * Next.js automatically renders this component when an error occurs
 * in the route segment. It provides a way to recover without a full reload.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/error
 */
export default function DiagramError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("[Diagram Error Boundary]:", error);
  }, [error]);

  return (
    <div className="flex h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-destructive">
            Something went wrong
          </CardTitle>
          <CardDescription>
            An error occurred while loading the diagram builder.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {error.message || "An unexpected error occurred."}
          </p>
          {error.digest && (
            <p className="mt-2 text-xs text-muted-foreground">
              Error ID: {error.digest}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button onClick={reset} variant="default">
            Try again
          </Button>
          <Button onClick={() => window.location.reload()} variant="outline">
            Reload page
          </Button>
          <Button onClick={() => (window.location.href = "/")} variant="ghost">
            Go Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
