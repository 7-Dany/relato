import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { PATTERNS } from "@/lib/patterns";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between px-6 py-4 md:px-12">
        <div className="flex items-center gap-2">
          <svg
            width="20"
            height="20"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden
          >
            <rect
              x="1"
              y="1"
              width="5"
              height="5"
              rx="1"
              className="fill-primary"
            />
            <rect
              x="10"
              y="1"
              width="5"
              height="5"
              rx="1"
              className="fill-primary/60"
            />
            <rect
              x="1"
              y="10"
              width="5"
              height="5"
              rx="1"
              className="fill-primary/60"
            />
            <rect
              x="10"
              y="10"
              width="5"
              height="5"
              rx="1"
              className="fill-primary/30"
            />
          </svg>
          <span className="font-heading text-lg font-semibold tracking-tight">
            Relato
          </span>
        </div>
        <ThemeToggle />
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 md:px-12">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-mono text-xs tracking-[0.2em] uppercase text-muted-foreground">
            Architecture Review Atlas
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-balance text-foreground sm:text-5xl md:text-6xl">
            Map code the way
            <br />
            you review it
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-muted-foreground">
            Build UML-style diagrams that connect responsibilities,
            dependencies, and source files into one readable map.
          </p>
          <div className="mt-10 flex items-center justify-center gap-3">
            <Link href="/diagram">
              <Button size="lg">Open Diagram Builder</Button>
            </Link>
            <Link href={`/diagram?reference=${PATTERNS[0].id}`}>
              <Button variant="outline" size="lg">
                View {PATTERNS[0].name} Pattern
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-24 grid w-full max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            title="Reference Blueprints"
            description="Load GoF pattern templates as starting points. Adapt them to your codebase."
          />
          <FeatureCard
            title="Source File Links"
            description="Attach real file paths to each node. Trace diagram boxes back to code."
          />
          <FeatureCard
            title="UML Relationships"
            description="Four edge types: association, dependency, inheritance, aggregation."
          />
        </div>
      </main>

      <footer className="border-t px-6 py-6 text-center text-sm text-muted-foreground md:px-12">
        <p>Relato — Architecture Review Atlas</p>
      </footer>
    </div>
  );
}

function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription className="text-sm leading-6">
          {description}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
