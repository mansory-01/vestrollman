import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility for conditionally joining class names and merging Tailwind classes.
 * 
 * @param inputs - List of class values (strings, objects, etc.)
 * @returns A merged tailwind class string.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
