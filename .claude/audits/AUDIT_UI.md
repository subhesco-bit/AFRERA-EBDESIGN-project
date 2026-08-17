---
agent: ui-auditor
status: fail
findings: 12
---

## Summary

Read through the frontend source (`frontend/src`, 565 `.jsx` files including 150 auto-generated modules) and the app shell (`App.jsx`, `Layout.jsx`, `Header.jsx`, `Sidebar.jsx`, `BottomNav.jsx`, `Footer.jsx`, shared `ui/` and `common/DataPrimitives.jsx` primitives), cross-checked with targeted greps across the whole tree, then read representative files in full before writing up each finding. No browser was launched (static/code review only).

## Findings

**Critical**

1. `frontend/src/components/Header.jsx` — all 7 desktop nav dropdowns (mega-menus for Marketplace, Farmer Portal, Pricing, Finance/ERP, Admin, etc.) use CSS `group-hover:block` only, making the entire primary nav unreachable by keyboard. This is global nav present on every page. Remediation: add `focus-within` handling and/or `aria-expanded`/keyboard toggle logic so the menus open on focus, not just hover.

2. 21 pages (`SeedVaultPage.jsx`, `FarmerFieldPage.jsx`, `LandRegistryPage.jsx`, and others) implement custom `fixed inset-0` modal overlays with zero `role="dialog"`, no focus trap, no Escape-key handling. A `role="dialog"`/`aria-modal`/`.focus()` grep across the app returned 0 hits, despite an accessible Radix-based `ui/dialog.jsx` primitive already existing and being used in only 2 places. Remediation: migrate these 21 custom modals onto the existing `ui/dialog.jsx` primitive rather than hand-rolling overlays.

**High**

3. ~31 files render `<label>` next to (not wrapping, no `htmlFor`) form inputs. Of 217 `<input>` elements, only 32 have an `id`; only 16 `htmlFor` usages exist against 230 `<label>` elements. Example: `LaboratoryERP/SampleRegistration.jsx`. Remediation: add matching `id`/`htmlFor` pairs (or wrap inputs in their labels) across these files.

**Medium**

4. Icon-only buttons frequently lack `aria-label` — only 21 of 565 files use `aria-label` at all.
5. Some actionable icon buttons use `text-gray-400` (~2.8:1 contrast), below WCAG 1.4.11's 3:1 minimum for UI components.
6. 81 grids hard-code `grid-cols-2/3/4` with no responsive breakpoint, risking cramped layouts on narrow viewports.
7. The fixed `BottomNav` has no reserved space in `Layout.jsx`, risking overlap with footer/page content on mobile.
8. Footer's 4 social icon links have no accessible name and use `href="#"`.

**Low**

9. The shared `DataTable` primitive (currently dead code, 0 call sites) lacks an overflow wrapper for narrow viewports.
10. Modal-internal grids stay 2-column even inside narrow dialogs.
11. No `eslint-plugin-jsx-a11y` in the lint pipeline to catch accessibility regressions going forward.
12. `<img>` usage is otherwise clean — all 6 `<img>` tags (across 5 files) have `alt` text; noted as a positive, tracked as a low-priority reminder to keep enforcing this as the app grows.

## Positive notes

The app shell itself is genuinely well built: skip link present, `<main>` landmark used, `aria-current` on nav, `aria-label`s on the floating chat/voice buttons, and the `Field`/`DataTable` primitives in `common/DataPrimitives.jsx` are solid. The problems are concentrated in page-level custom modals, hand-written forms, and the header's hover-only dropdowns — not systemic across all 565 files.

## Metrics

- Files reviewed: 565 `.jsx` files (150 auto-generated modules + app shell + shared primitives)
- `<input>` elements: 217 total, 32 with `id`, 16 `htmlFor` usages against 230 `<label>`s
- Files using `aria-label` at all: 21 / 565
- Custom modal implementations missing `role="dialog"`: 21
- Findings by severity: 2 Critical, 1 High, 5 Medium, 3 Low/positive
