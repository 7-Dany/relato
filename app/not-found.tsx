import { Metadata } from "next";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Page Not Found",
  description: "The page you're looking for doesn't exist.",
};

/**
 * Not-found page — shown when a route segment doesn't match.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/not-found
 */
export default function NotFound() {
  return (
    <div className="flex h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">404 — Page Not Found</CardTitle>
          <CardDescription>
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Try navigating back to the diagram builder to continue building
            architecture diagrams.
          </p>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Link href="/diagram">
            <span className="inline-flex h-9 shrink-0 items-center justify-center rounded-4xl border border-transparent bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors outline-none hover:bg-primary/80 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50">
              Go to Diagram Builder
            </span>
          </Link>
          <Link href="/">
            <span className="inline-flex h-9 shrink-0 items-center justify-center rounded-4xl border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors outline-none hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50">
              Go Home
            </span>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
