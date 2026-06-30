"use client"

import { useState } from "react"
import { ReactFlowProvider } from "@xyflow/react"

import type { WorkbenchProps } from "./types"
import { CanvasPane } from "./canvas-pane"
import { RelatoFeatureHeader } from "./feature-header"
import { InspectorPanel } from "./inspector-panel"
import { LeftPanel } from "./left-panel"

export function WorkbenchScreen(props: WorkbenchProps) {
  const [leftCollapsed, setLeftCollapsed] = useState(false)

  return (
    <ReactFlowProvider>
      <div className="relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#06120f] text-[#dcece6]">
        <RelatoFeatureHeader
          {...props}
          leftCollapsed={leftCollapsed}
          onToggleLeft={() => setLeftCollapsed((v) => !v)}
        />

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <LeftPanel
            {...props}
            collapsed={leftCollapsed}
          />

          <main className="relative min-w-0 flex-1">
            <CanvasPane {...props} />
          </main>

          {props.session.selection !== null && <InspectorPanel {...props} />}
        </div>
      </div>
    </ReactFlowProvider>
  )
}
