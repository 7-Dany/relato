/** Shared display constants — single source of truth for all diagram UI. */

import type { DiagramEdgeType } from "./context";

// ─── Edge type metadata ────────────────────────────────────────────────────

export interface EdgeTypeMeta {
  value: DiagramEdgeType;
  label: string;
  description: string;
  symbol: string;
}

export const EDGE_TYPE_META: readonly EdgeTypeMeta[] = [
  {
    value: "association",
    label: "Association",
    description: "Solid line, open arrow",
    symbol: "→",
  },
  {
    value: "dependency",
    label: "Dependency",
    description: "Dashed line, open arrow",
    symbol: "⇢",
  },
  {
    value: "inheritance",
    label: "Inheritance",
    description: "Solid line, hollow triangle",
    symbol: "▷",
  },
  {
    value: "aggregation",
    label: "Aggregation",
    description: "Solid line, hollow diamond",
    symbol: "◇",
  },
] as const;

/** O(1) lookup — avoids repeated `.find()` calls. */
export const EDGE_TYPE_BY_VALUE = new Map(
  EDGE_TYPE_META.map((meta) => [meta.value, meta]),
);

// ─── Edge colour swatches ──────────────────────────────────────────────────

export interface EdgeColorOption {
  label: string;
  value: string | null;
}

export const EDGE_COLORS: readonly EdgeColorOption[] = [
  { label: "Default", value: null },
  { label: "Red", value: "oklch(0.628 0.257 29.234)" },
  { label: "Orange", value: "oklch(0.705 0.213 47.604)" },
  { label: "Yellow", value: "oklch(0.795 0.184 86.047)" },
  { label: "Green", value: "oklch(0.723 0.219 149.579)" },
  { label: "Cyan", value: "oklch(0.715 0.143 215.221)" },
  { label: "Blue", value: "oklch(0.623 0.214 259.815)" },
  { label: "Purple", value: "oklch(0.627 0.265 303.9)" },
  { label: "Pink", value: "oklch(0.664 0.216 355.1)" },
] as const;

// ─── Edge stroke-width presets ─────────────────────────────────────────────

export interface EdgeWidthOption {
  label: string;
  value: number;
}

export const EDGE_WIDTHS: readonly EdgeWidthOption[] = [
  { label: "Thin", value: 1 },
  { label: "Normal", value: 2 },
  { label: "Thick", value: 3 },
  { label: "Bold", value: 4 },
] as const;

// ─── Class node stereotype options ─────────────────────────────────────────

export const STEREOTYPE_OPTIONS = [
  { value: "none", label: "Class" },
  { value: "interface", label: "«interface»" },
  { value: "abstract", label: "Abstract" },
] as const;

export type StereotypeValue = (typeof STEREOTYPE_OPTIONS)[number]["value"];
