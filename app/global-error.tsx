"use client";

import "@/app/globals.css";

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
 * Root-level error boundary — catches errors in the root layout.
 *
 * This is the topmost error boundary and replaces the entire HTML
 * document if an error bubbles up past all other boundaries.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/error#global-errorjs
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Global Error Boundary]:", error);
  }, [error]);

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-destructive">
                Application Error
              </CardTitle>
              <CardDescription>
                A critical error occurred in the application.
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
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
              >
                Reload page
              </Button>
              <Button
                onClick={() => (window.location.href = "/")}
                variant="ghost"
              >
                Go Home
              </Button>
            </CardFooter>
          </Card>
        </div>
      </body>
    </html>
  );
}
