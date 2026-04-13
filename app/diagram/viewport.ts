import type { Viewport } from "next";

/**
 * Viewport configuration for the diagram builder.
 *
 * Optimized for a canvas-based editing experience with full viewport usage.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/viewport
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#18181b" },
  ],
};
