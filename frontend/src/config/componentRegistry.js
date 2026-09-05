/**
 * Keeps every UI module in the Vite graph so generated/atomic files are not orphaned.
 * Components stay lazy; importing this registry is the linkage, not eager mounting.
 */
export const componentModules = import.meta.glob('../components/**/*.{jsx,js}');

export function listRegisteredComponents() {
  return Object.keys(componentModules).sort();
}
