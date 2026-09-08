---
agent: ui-auditor
status: warn
findings: 6
---

# UI Audit — Focused Re-Check on Uncommitted Changes

**Scope note:** per explicit brief, this pass focuses on the three
uncommitted pages on `audit/ui-api-fix`
(`AuditReportPage.jsx`, `ColdStorageDashboardPage.jsx`,
`PremiumMarketplacePage.jsx` — reviewed via `git diff` against the prior
commit, then the full current file) plus a spot-check of whether the
long-standing nav-reachability gap from the prior `AUDIT_UI.md` and
`.ai/tasks/ACTIVE.md` still applies to these three specifically. It does
**not** re-run the full 165-page routing sweep, the full 279-object dead-API
sweep, or re-report Findings 1–8 from the prior `AUDIT_UI.md` — those are
tracked, still-open items, not re-verified here beyond what's directly
relevant to the three modified pages.

## Summary

All three pages moved from static/mock/placeholder UI to real API-backed
data this session (`auditComplianceAPI`, `coldStorageAPI` temperature +
compliance endpoints, `/api/v1/ecommerce/listings`) and the wiring itself is
sound — loading states, error states, and empty states are all present and
distinguished from each other, which is not universal in this codebase.
`AuditReportPage.jsx` in particular is now a good accessibility example
(`aria-busy`, `role="alert"` on the error state, disabled-state buttons with
visible label text, not icon-only). The real remaining issues are (1) a
genuine rendering bug in `PremiumMarketplacePage.jsx` that predates this
diff but is live on the page being touched, (2) two real but pre-existing
accessibility gaps (unlabeled form controls) also live on pages in this
diff, and (3) confirmation that none of the three pages have been added to
primary nav, consistent with — not a new instance beyond — the standing
Finding 7 in the prior audit.

## Findings

### 1. [MEDIUM] `PremiumMarketplacePage.jsx` renders an emoji string as an `<img src>`, showing a broken-image icon instead of the intended content
- **Location:** `frontend/src/pages/PremiumMarketplacePage.jsx:194-198`
  (render) and `:22-29` (mock data), `:47` (real-data mapping fallback).
- **Description:** Every product object's `image` field is either an emoji
  string (`'🌾'`, `'🟡'`, etc. — used for all 6 mock products, and as the
  fallback for any real listing with no `images[0]`) or a real image URL.
  The render logic is `{product.image ? <img src={product.image}
  alt={product.name} /> : <div>No Image</div>}` — since an emoji string is
  truthy, it is passed straight into `<img src="🌾">`, which is not a valid
  image URL. Every mock product (the fallback path used whenever the real
  `/api/v1/ecommerce/listings` endpoint is unreachable — the default state in
  this dev environment with no Postgres running, confirmed via
  `.ai/tasks/ACTIVE.md`) will show a broken-image icon on every card instead
  of the intended emoji. `alt={product.name}` is present, so a screen reader
  is unaffected, but every sighted user hits this every time the page loads
  with no live backend — which, per this session's own environment notes,
  is the common case.
- **Remediation:** branch on whether `image` looks like a URL (e.g.
  `/^https?:\/\//` or a `/`-prefixed path) vs. a short emoji/text token, and
  render the emoji as text content (e.g. inside a `<span aria-hidden>` with
  the true product name still conveyed via visible text nearby) rather than
  as an `<img src>`.

### 2. [MEDIUM] Filter controls in `PremiumMarketplacePage.jsx` have no programmatic label association
- **Location:** `frontend/src/pages/PremiumMarketplacePage.jsx:126-172`.
- **Description:** All four filter controls (`Price Range` range slider,
  `Category` select, `Certification` select, `Minimum Order Volume` number
  input) use a bare `<label>Text</label>` immediately followed by a sibling
  `<input>`/`<select>` — the label is not wrapped around the control and has
  no `htmlFor`/`id` pair. A screen reader reaching these controls announces
  "slider", "combobox", "spinbutton" with no accessible name at all, not the
  visible label text. This is a real, common WCAG 1.3.1/4.1.2 failure, not
  present in the shared `ui/` component library elsewhere in this app (this
  page uses raw HTML + a CSS module, not the shared `Field`/`ui/*` primitives
  used by most of the rest of the frontend).
- **Remediation:** add matching `id`/`htmlFor` pairs to all four
  label/control pairs (e.g. `id="premium-filter-category"`).

### 3. [LOW] Facility `<select>` in `ColdStorageDashboardPage.jsx`'s Temperature tab has no accessible label
- **Location:** `frontend/src/pages/ColdStorageDashboardPage.jsx:368-381`.
- **Description:** The new (this diff) facility picker is a raw `<select>`
  rendered inline inside a `CardDescription` sentence ("Real-time
  temperature readings [select]") with no `<label>`, `aria-label`, or
  `aria-labelledby`. Sighted users infer its purpose from surrounding prose;
  a screen reader announces only "combobox" with the currently-selected
  facility name as its accessible name (browsers commonly fall back to the
  selected `<option>` text), which is ambiguous out of context. Minor since
  the control is keyboard-operable and the page functions correctly without
  it, but worth a one-line fix.
- **Remediation:** add `aria-label="Select facility"` to the `<select>`.

### 4. [LOW] Sidebar filters become completely inaccessible below 1024px in `PremiumMarketplacePage.jsx` — no toggle provided
- **Location:** `frontend/src/pages/PremiumMarketplace.module.css:376-384`
  (`@media (max-width: 1024px) { .sidebar { display: none; } }`).
- **Description:** Pre-existing (not part of this diff's line changes, but
  live on the page being touched, so flagged per the audit brief). Below
  1024px — i.e. every tablet in portrait and all phones — the entire filter
  sidebar is hidden via `display: none` with no button, drawer, or other
  mechanism to reach it. Users on those viewports can browse the default
  unfiltered list only; the `category`/`certification`/`price`/`volume`
  filters this page's real backend query supports (`:54-64` in the JSX) are
  simply unreachable, not just visually collapsed. Cart sidebar correctly
  reflows to `position: relative` at 768px in the same file, showing the
  intended pattern was thought through for one sidebar but not the other.
- **Remediation:** add a "Filters" toggle button visible below 1024px that
  reveals the sidebar as an overlay/drawer, matching the pattern most of the
  rest of this app's mobile nav already uses (`Sidebar.jsx`/`BottomNav.jsx`).

### 5. [LOW] Non-functional Grid/List view toggle buttons
- **Location:** `frontend/src/pages/PremiumMarketplacePage.jsx:184-187`.
- **Description:** `<button className={styles.viewBtn}>Grid</button>` and
  the equivalent `List` button have no `onClick` and no `aria-pressed`
  state — they render as real, focusable, apparently-interactive buttons
  that do nothing on click or activation. Not an accessibility violation
  per se (they're real `<button>` elements, keyboard-reachable), but a
  genuine UX dead-end a screen-reader or keyboard user has no way to
  discover is inert without pressing it.
- **Remediation:** either wire them to an actual grid/list layout toggle, or
  remove them until that view mode exists.

### 6. [INFO — confirmed still open, not a new instance] None of the three modified pages are in primary nav
- **Location:** `frontend/src/config/routes.js:232-233` (`/marketplace/premium`),
  `:641` (`/admin/audit-report`), `:854` (`/cold-storage-dashboard`) — all
  three route successfully; `frontend/src/components/Header.jsx`,
  `Sidebar.jsx`, `BottomNav.jsx` — confirmed via
  `grep -r "audit-report\|cold-storage-dashboard\|premium-market"` — zero
  matches in any of the three nav surfaces.
- **Description:** This is the same standing gap documented as Finding 7 in
  the prior `AUDIT_UI.md` ("Primary navigation reaches roughly a third of
  routed pages") and not a new problem introduced by this session's changes
  — recorded here only because the brief asked to check current state on
  these specific pages rather than assume. `PremiumMarketplacePage` is at
  least reachable from `MarketplacePage` in practice if a "Premium" link
  exists there (not verified in this pass — out of scope per the brief);
  `AuditReportPage` and `ColdStorageDashboardPage` have no discoverable
  entry point from the UI at all, only direct URL navigation.
- **Remediation:** no new action beyond what Finding 7 already recommends
  (role-scoped submenus); not re-counted as a fresh finding.

## Metrics

- Pages reviewed in full: 3 (`AuditReportPage.jsx`, 191 lines;
  `ColdStorageDashboardPage.jsx`, 526 lines; `PremiumMarketplacePage.jsx`,
  291 lines + `PremiumMarketplace.module.css`, 403 lines)
- Loading/error/empty states present and distinguished: 3/3 pages (all)
- New accessibility regressions introduced by this diff: 1
  (`ColdStorageDashboardPage.jsx`'s new facility `<select>`, Finding 3)
- Pre-existing accessibility/UX issues surfaced while reviewing these pages:
  4 (Findings 1, 2, 4, 5 — all in `PremiumMarketplacePage.jsx`, none touched
  by this diff's line changes)
- `role="progressbar"`/`aria-valuenow` etc. verified correct in the shared
  `ui/progress.jsx` component both pages rely on — not a finding
- Nav-surface grep for all three pages' route paths: 0/3 present in
  `Header.jsx`/`Sidebar.jsx`/`BottomNav.jsx` (consistent with prior audit's
  Finding 7, not re-counted)

*Verified By VibeCheck ✅*
