"use client";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";
import { useDiagramActions } from "../context";

export function EmptyCanvas() {
  const { addNode, loadPattern } = useDiagramActions();

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-6">
      <Empty className="pointer-events-auto max-w-md border bg-card p-6 text-center shadow-sm">
        <EmptyMedia variant="icon">
          <HugeiconsIcon
            icon={Add01Icon}
            className="text-muted-foreground/50"
            strokeWidth={1.5}
          />
        </EmptyMedia>
        <EmptyTitle>Start building your diagram</EmptyTitle>
        <EmptyDescription>
          Add classes and interfaces, connect them with UML relationships, and
          attach source file paths for review traceability.
        </EmptyDescription>
        <div className="mt-5 flex justify-center gap-2">
          <Button onClick={() => addNode(null)}>Add Class</Button>
          <Button variant="outline" onClick={() => loadPattern("memento")}>
            Load Reference
          </Button>
        </div>
      </Empty>
    </div>
  );
}
