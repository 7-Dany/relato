# Relato Frontend

## Structure

```
components/relato/
├── domain/          — Branded types + DiagramCommand union + result
├── systems/
│   ├── diagram-session/     — Reducer, undo/redo history, selectors, hook
│   ├── diagram-persistence/ — Save/load/CRUD via repository pattern
│   ├── diagram-repository/  — localStorage + API backends, schema validation
│   ├── canvas-adapter/      — Domain ↔ React Flow conversion, ELK layout
│   └── pattern-catalog/     — Reusable diagram templates
├── screens/
│   ├── project-dashboard/   — Grid/list, search, sort, CRUD, import/export
│   └── workbench/           — 10 files: feature-header, left-panel, canvas-pane,
│                               inspector-panel, command-toolbar, context-menu,
│                               keyboard shortcuts, actions context, types
├── ui/              — Nodes, edges, colors, dialogs
└── app/
    ├── builder/     — RelatoBuilder orchestrator + dynamic client import
    └── share/       — Shared diagram read-only view
```

## Key patterns

- **Commands go through reducer** → changes update `history.present` → `useEffect` fires `onSave` callback → `persistence.persist`
- **Merge strategy** in `useSyncedReactFlowDiagram` preserves RF selection/dragging state across reducer-driven diagram updates
- **Repository interface** (`DiagramRepository`) with localStorage and API implementations
- **Migration flow:** localStorage → Supabase on first sign-in, then localStorage cleared

## Canvas performance

- `onNodeDragStop` fires per-node dispatches → each triggers reducer + persist effect
- Use `React.memo` on `CanvasPane`, batch position updates, prevent position changes from triggering non-position saves
