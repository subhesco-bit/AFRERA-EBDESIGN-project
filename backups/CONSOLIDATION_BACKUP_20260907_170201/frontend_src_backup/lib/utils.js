import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind class strings safely — clsx resolves conditionals,
 * twMerge resolves conflicting utilities (e.g. two different `px-*`
 * values) by keeping the last one instead of shipping both.
 *
 * Every component in components/ui/ is built against the CSS variable
 * tokens already defined in tailwind.config.js/src/index.css (--primary,
 * --border, --ring, etc.) rather than hardcoded colors, per FE-05 in
 * docs/registry/20_FRONTEND_BOUNDARIES.md.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
