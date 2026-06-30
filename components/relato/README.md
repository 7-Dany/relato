# Relato Feature Architecture

Relato follows `code/frontend/docs/feature-module-pattern.md`.

## Systems

- `domain` owns persisted diagram contracts and imports no React, browser APIs,
  Next.js, or React Flow.
- `systems/diagram-repository` owns saved diagrams, schema migration, backup
  recovery, and the future database seam.
- `systems/diagram-session` owns command application, selection, dirty state,
  active edge kind, and undo/redo.
- `systems/canvas-adapter` is the seam around React Flow and ELK.
- `systems/pattern-catalog` owns starter diagrams in domain format.

## Screens

`screens/workbench` renders the builder workflow. Screens dispatch commands and
call public system interfaces; they do not own persistence or schema logic.
