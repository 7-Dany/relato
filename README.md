# Relato — Architecture Review Atlas

A modern, visually-rich **UML class diagram builder** for documenting system architecture. Built with Next.js 16, React 19, React Flow, and shadcn/ui.

![Relato](https://img.shields.io/badge/Next.js-16-black)
![React](https://img.shields.io/badge/React-19-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-6-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## Features

- **Visual UML Diagram Builder** — Create class diagrams with drag-and-drop nodes and edges
- **Multiple Relationship Types** — Association, Dependency, Inheritance, and Aggregation
- **Real-time Editing** — Edit class names, fields, methods, and edge properties in a properties panel
- **Edge Customization** — Customize edge colors, widths, and curvature via context menus
- **Dark/Light Theme** — System-aware theme switching with OKLCH color space for consistent design
- **Auto-Layout** — ELK-based automatic layout (top-to-bottom or left-to-right)
- **Design Patterns Library** — Pre-built GoF pattern templates (Memento, Strategy, Observer, etc.)
- **PNG/JSON Export** — Export diagrams as images or structured JSON with viewport-aware cropping
- **Undo/Redo** — Full history management for all diagram changes (dragging, editing, layout)
- **Context Menus** — Right-click nodes and edges for quick actions and property edits
- **Explanation Cards** — Attach numbered callout cards to diagram elements with anchor connections
- **Keyboard Shortcuts** — Power-user shortcuts for rapid diagram creation
- **Bottom Toolbar** — Quick access to layout, zoom controls, edge type selection, and export
- **Left Sidebar** — Pattern library for loading pre-built GoF design patterns
- **Responsive Canvas** — Pan, zoom, and fit-view navigation
- **LocalStorage Persistence** — Diagrams auto-save and restore across sessions

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Deselect | `Esc` |
| Delete selected element | `Del` / `Backspace` |
| Add class | `N` |
| Auto-layout | `L` |
| Undo | `Ctrl/Cmd + Z` |
| Redo | `Ctrl/Cmd + Shift + Z` or `Ctrl/Cmd + Y` |
| Set edge type (1-4) | `1` `2` `3` `4` |

## Getting Started

### Prerequisites

- **Node.js** 20+ or **Bun** 1.0+
- Package manager: [Bun](https://bun.sh/) (recommended), npm, pnpm, or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/relato.git
cd relato

# Install dependencies
bun install

# Start the development server
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to start building diagrams.

### Build for Production

```bash
bun build
bun start
```

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) |
| Language | [TypeScript](https://www.typescriptlang.org/) |
| UI Library | [shadcn/ui](https://ui.shadcn.com/) |
| Diagram Engine | [React Flow (XYFlow)](https://reactflow.dev/) |
| Layout Engine | [ELK](https://www.eclipse.org/elk/) |
| Icons | [HugeIcons](https://hugeicons.com/) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) |
| State Management | Zustand + React Context |
| Fonts | Outfit (heading), IBM Plex Sans (body), Geist (mono) |
| Package Manager | [Bun](https://bun.sh/) |

## Architecture Decisions

### Server vs Client Components

- **Server Components** are used for metadata, routing, and static content
- **Client Components** are isolated to interactive areas: the canvas, toolbar, properties panel, and context menus
- The `"use client"` directive is applied at the component level, not the module level

### State Management

- Diagram actions (add node, reset, load pattern) are provided via **React Context** (`DiagramActionsContext`) accessed via `useDiagramActions()`
- Volatile UI state (selection, active edge type, active pattern) is managed with **Zustand** (`lib/diagram-store.ts`)
- React Flow manages internal canvas state (node positions, edge connections)

### Edge Rendering

- All edge types share a common `DiagramEdgePath` component with configurable markers and dash patterns
- SVG markers are defined in a global `<defs>` block with default and selected variants
- Wide transparent hit targets (16px) make thin edges easy to click/tap

### Composition Patterns

- **Compound Components** — UI is composed of focused, single-responsibility components
- **Explicit Variants** — Toolbar buttons use explicit labels rather than boolean props
- **Context over Props** — Shared state is accessed via context, avoiding prop drilling

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with Turbopack |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT — see [LICENSE](LICENSE) for details.
