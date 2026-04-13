"use client";

import { cn } from "@/lib/utils";
import type { PatternCallout } from "@/lib/patterns";

const PLACEMENT_CLASS: Record<PatternCallout["placement"], string> = {
  "top-left": "left-6 top-6",
  "top-right": "right-6 top-6",
  "bottom-left": "bottom-20 left-6",
  "bottom-right": "bottom-20 right-6",
};

export function ReferenceCallouts({
  callouts,
}: {
  callouts: PatternCallout[];
}) {
  if (callouts.length === 0) return null;

  return (
    <>
      {callouts.map((callout) => (
        <div
          key={callout.id}
          className={cn(
            "pointer-events-none absolute z-10 hidden max-w-[240px] rounded-2xl border bg-background/90 p-4 shadow-sm backdrop-blur lg:block",
            PLACEMENT_CLASS[callout.placement],
          )}
        >
          <h3 className="text-sm font-medium text-foreground">
            {callout.title}
          </h3>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {callout.body}
          </p>
        </div>
      ))}
    </>
  );
}
