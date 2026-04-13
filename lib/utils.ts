import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind class names with intelligent conflict resolution.
 * Uses `twMerge` to handle conflicting classes (e.g. `p-4 p-6` -> `p-6`).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
