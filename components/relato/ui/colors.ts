/**
 * Canonical accent color palette for Relato diagram elements.
 *
 * Both the inspector panel and the diagram context menu use this list so they
 * always agree on which colors are available and what their OKLCH values are.
 */
export const RELATO_ACCENT_COLORS: ReadonlyArray<{
  label: string
  value: string | null
}> = [
  { label: "Default", value: null },
  { label: "Red", value: "oklch(0.628 0.257 29.234)" },
  { label: "Orange", value: "oklch(0.705 0.213 47.604)" },
  { label: "Yellow", value: "oklch(0.795 0.184 86.047)" },
  { label: "Green", value: "oklch(0.723 0.219 149.579)" },
  { label: "Cyan", value: "oklch(0.715 0.143 215.221)" },
  { label: "Blue", value: "oklch(0.623 0.214 259.815)" },
  { label: "Purple", value: "oklch(0.627 0.265 303.9)" },
  { label: "Pink", value: "oklch(0.664 0.216 355.1)" },
]
