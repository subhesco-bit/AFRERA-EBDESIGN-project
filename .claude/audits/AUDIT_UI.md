---
agent: ui-auditor
status: fail
findings: 12
---

# UI / Accessibility / Responsive-Design Audit — AFRERA Frontend

Scope: `frontend/src` (React 18 + Tailwind SPA). 565 `.jsx` files across `components/`, `pages/`, and 150 auto-generated `modules/M001-M150`. `afrera/afrera-web` and `afrera/afrera-app` were checked and contain no source (empty scaffolding, not audited further). This was a static read-through of the source — no browser was launched, so findings are based on markup/JSX/CSS-class inspection, not runtime DOM or a live contrast checker.

## Summary

The application shell (`Layout.jsx`, `Sidebar.jsx`, `BottomNav.jsx`) is genuinely well built: it has a working skip link, a labelled `<main>` landmark, `aria-label`s on the floating chat/voice widget buttons, and `aria-current="page"` on active nav links. The shared `common/DataPrimitives.jsx` table primitive even adds a `<caption>` and `scope="col"` — better table semantics than most of the codebase needs it to be.

Outside that shell, the picture is uneven. The single global header (`Header.jsx`, rendered on every page) implements seven navigation dropdowns using CSS `group-hover` only, which makes the entire desktop mega-menu unreachable by keyboard. Twenty-one page-level "modals" are hand-rolled `fixed inset-0` overlays with none of `role="dialog"`, focus trapping, or Escape-to-close — every one of them is a keyboard/screen-reader trap or a silent dead-end. Around 31 files render a `<label>` next to (not wrapping) its `<input>`/`<select>` with no `htmlFor`/`id` pairing, so screen readers won't announce the field's purpose on focus. These three patterns alone touch nearly every authenticated workflow in the app (farmer records, logistics, dairy, KYC, land registry, etc.), which is why the overall status is **fail** rather than **warn** — the shell is launch-ready, the page content underneath it is not.

Responsive design is inconsistent rather than broken: 81 grids use a fixed `grid-cols-2/3/4` with no `sm:`/`md:` breakpoint, and the fixed `BottomNav` has no reserved spacing in `Layout.jsx`, so it can visually overlap page/footer content on small screens. Color contrast is mostly acceptable (Tailwind's default palette), but `text-gray-400` is used for actionable icon buttons (not just decorative icons) in ~10 places, which sits under the WCAG 1.4.11 non-text 3:1 minimum against a white background.

## Findings

### 1. [Critical] Desktop navigation menus are keyboard-inaccessible
**Location:** `frontend/src/components/Header.jsx` — 7 occurrences of `group-hover:block` (lines ~32-229: Marketplace, Farmer Portal, Pricing Tools, Finance/ERP, Vendor Portal, Admin Portal, Enterprise Portal dropdowns).
**Description:** Every top-level dropdown trigger is a `<button aria-haspopup="true">` whose submenu (`<div className="... hidden group-hover:block">`) is revealed only by CSS `:hover` on the parent `.group`. There is no `onClick`/`onFocus` handler, no `aria-expanded` state, and the submenu container has no `tabIndex`/keyboard-open mechanism. A keyboard-only or screen-reader user who tabs to any of these seven triggers cannot open the menu at all — every link inside (Browse Products, Farmer Home, Ledger, Compliance, Admin Dashboard, etc.) is unreachable except by mouse. This is the site's primary navigation and appears on every page. WCAG 2.1.1 (Keyboard) failure.
**Remediation:** Convert each trigger to control visibility via React state (`aria-expanded`, click-to-toggle, close on outside-click/Escape) rather than `group-hover`, or use a Radix `DropdownMenu` (already a project dependency — `@radix-ui/react-dropdown-menu`) which handles keyboard interaction, `aria-expanded`, and focus management for free. The mobile menu (`mobileMenuOpen` state) already gets this right and can be used as the pattern.

### 2. [Critical] 21 hand-rolled modal overlays have no dialog semantics, focus trap, or Escape handling
**Location:** All 21 files below use `className="fixed inset-0 bg-black bg-opacity-50 ..."` as a custom modal pattern: `ClimateAdvisoryPage.jsx`, `CorporateBuyerPage.jsx`, `DairyManagementPage.jsx`, `FarmCostingPage.jsx`, `FarmerFieldPage.jsx`, `FarmerKycPage.jsx`, `FertilizerInventoryPage.jsx`, `HarvestPlanPage.jsx`, `IrrigationManagementPage.jsx`, `LabourManagementPage.jsx`, `LandRegistryPage.jsx`, `LogisticsProviderPage.jsx`, `OrchardManagementPage.jsx`, `PondManagementPage.jsx`, `PreOrderPage.jsx`, `SeedVaultPage.jsx`, `ShgManagementPage.jsx`, `SowingManagementPage.jsx`, `TractorManagementPage.jsx`, `VillageRegistryPage.jsx`, `WhatGrowPage.jsx`.
**Description:** None of these 21 overlays have `role="dialog"`/`aria-modal="true"`, none trap focus inside the panel (confirmed zero `.focus()` calls in the codebase outside form inputs), and none close on Escape. A keyboard user who tabs into one of these panels can tab straight through it into the page content behind the (still visually present) overlay, and has no keyboard way to dismiss it. A screen-reader user gets no announcement that a dialog opened at all — it reads as ordinary page content. Example at `SeedVaultPage.jsx:240-250`: the "Add Seeds to Vault" panel's close control is a bare `✕` glyph button with no `aria-label` ("Close" is never announced). The project already ships `@radix-ui/react-dialog` and has a working wrapper at `frontend/src/components/ui/dialog.jsx`, but it's used in only 2 places — everywhere else reinvents the pattern without the accessibility primitives Radix provides for free.
**Remediation:** Replace the custom `fixed inset-0` pattern with the existing `components/ui/dialog.jsx` (Radix) wrapper across these 21 files, or at minimum add `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing at the panel's heading, an Escape-key handler, and initial-focus + focus-trap + focus-return-on-close logic to each. Give every glyph-only close button (`✕`) an `aria-label="Close"`.

### 3. [High] Form labels are not programmatically associated with their controls
**Location:** ~31 files matching the pattern `<label className="block text-sm font-medium text-gray-700 ...">Text</label>` immediately followed by a sibling `<input>`/`<select>` with no shared `id`/`htmlFor`. Confirmed example: `frontend/src/components/LaboratoryERP/SampleRegistration.jsx:137-199` (Select Laboratory, Sample Type, Sample Source, Collection Date, etc. — 7+ fields in this one form). Codebase-wide: 217 `<input>` elements but only 32 carry an `id`, and only 16 `htmlFor` usages exist against 230 `<label>` elements.
**Description:** Because the `<label>` neither wraps the control nor references it via `htmlFor`/`id`, a screen reader announces the input with no accessible name when it receives focus ("edit text, blank" instead of "Sample Source, edit text"). WCAG 1.3.1 (Info and Relationships) / 4.1.2 (Name, Role, Value) failure. Note this is not universal: the shared `Field` component in `components/common/DataPrimitives.jsx` (line 326-334) does this correctly with `htmlFor={id}`, and `components/forms/FormBuilderPanel.jsx` does it correctly by wrapping the input inside the `<label>` — but neither pattern is consistently reused elsewhere.
**Remediation:** Either wrap each input in its `<label>` (as `FormBuilderPanel.jsx` already does) or add matching `id`/`htmlFor` pairs (as `DataPrimitives.jsx`'s `Field` does). Given the inconsistency, standardizing all raw forms on the existing `ui/label.jsx` + `ui/input.jsx` (Radix-based, already correct) or the `Field` primitive would fix this class of bug in one pass rather than file-by-file.

### 4. [Medium] Icon-only action buttons frequently have no accessible name
**Location:** e.g. `frontend/src/pages/ComparePage.jsx:54`, `CorporateBuyerPage.jsx:280`, `FarmerFieldPage.jsx:171,246`, `HarvestPlanPage.jsx:237`, `LogisticsProviderPage.jsx:365`, `PreOrderPage.jsx:185`, `SeedVaultPage.jsx:247,404`, `WhatGrowPage.jsx:188` — all `<button className="text-gray-400 hover:text-gray-600">` wrapping a bare Lucide icon (X, Trash, etc.) with no `aria-label`.
**Description:** 286 `<button>` elements exist across the app, but only 21 files use `aria-label` anywhere. Spot-checked icon-only close/remove buttons render only a graphical icon with no text and no `aria-label`, so their purpose is announced as "button" with no name to a screen-reader user. Contrast with `components/Layout.jsx`, where the equivalent chat/voice toggle buttons do this correctly (`aria-label={openWidget === 'chat' ? 'Close chat assistant' : 'Open chat assistant'}`).
**Remediation:** Add `aria-label` to every icon-only interactive control; a lint rule (`eslint-plugin-jsx-a11y`'s `aria-label`/`control-has-associated-label`) would catch regressions going forward — the project's current `eslint src --ext js,jsx` config does not appear to run jsx-a11y (see Metrics).

### 5. [Medium] Icon-only buttons use sub-AA-contrast gray for actionable (not decorative) icons
**Location:** Same buttons as Finding 4, e.g. `SeedVaultPage.jsx:247` — `className="text-gray-400 hover:text-gray-600"`.
**Description:** `text-gray-400` (#9CA3AF) on a white panel background is roughly 2.8:1, below the WCAG 1.4.11 "non-text contrast" minimum of 3:1 required for meaningful UI components/icons (as distinct from purely decorative icons, which are exempt — several `text-gray-300` icon usages elsewhere in the app, e.g. empty-state illustrations in `CartPage.jsx:69`, are correctly decorative and not flagged here).
**Remediation:** Bump interactive icon buttons to at least `text-gray-500`/`text-gray-600` at rest, consistent with the `hover:` state already used.

### 6. [Medium] 81 grids hard-code column count with no responsive breakpoint
**Location:** Representative sample: `ArVr/ExperienceViewer.jsx:91,130`, `ConsumerHealth/HealthDashboard.jsx:124`, `FarmerPortal/LandRecords.jsx:119,150`, `FoodIntelligence/FoodSafetyDashboard.jsx:91`, `Insurance/InsurancePremiumCalculator.jsx:92,99,157,217` (81 total matches of `grid-cols-[2-6]` with no `sm:`/`md:`/`lg:` variant anywhere in the same class string).
**Description:** Tailwind grids declared as plain `grid-cols-2`, `grid-cols-3`, `grid-cols-4` etc. apply at all viewport widths, including narrow mobile screens. Forms and stat panels built this way will compress form fields/cards into columns too narrow to read comfortably below ~375-414px, rather than stacking to a single column as the rest of the app's responsive patterns (which do use `md:grid-cols-*`) intend.
**Remediation:** Audit each hard-coded `grid-cols-N` and add a mobile-first base of `grid-cols-1` with `sm:`/`md:` overrides, matching the pattern already used correctly elsewhere (e.g. `forms/FormBuilderPanel.jsx:30` uses `grid gap-4 md:grid-cols-2`).

### 7. [Medium] Fixed `BottomNav` has no reserved layout space, risking overlap with page/footer content
**Location:** `frontend/src/components/Layout.jsx:33-40` (`<main>` uses `p-4`, no bottom padding) and `frontend/src/components/BottomNav.jsx:14` (`fixed bottom-0 left-0 right-0 ... lg:hidden`).
**Description:** `BottomNav` is `position: fixed` and only hidden at `lg:` breakpoint, so on mobile/tablet it always overlays whatever is at the bottom of the viewport. `Layout.jsx` does not add bottom padding/margin to `<main>` or account for it before `<Footer>`, so on any page whose content ends near the viewport bottom (short pages, or the end of `Footer`'s links/social icons), the fixed nav bar can sit on top of that content, making it unclickable and, for zoomed/low-vision users, unreadable.
**Remediation:** Add `pb-16 lg:pb-0` (or equivalent) to the `<main>`/page wrapper in `Layout.jsx` so content — including the footer — always clears the fixed bottom nav's height on small viewports.

### 8. [Medium] Footer social links have no accessible name and are dead placeholder links
**Location:** `frontend/src/components/Footer.jsx:21-32`.
**Description:** The four social icons (Facebook, Twitter, Instagram, LinkedIn) are `<a href="#" className="text-gray-400 hover:text-white transition"><IconOnly /></a>` — no `aria-label`, no visible text, and `href="#"` doesn't navigate anywhere (also matches 3 other `href="#"` occurrences app-wide). Screen readers announce these as unlabelled links; sighted keyboard users who click one get a page-top jump to nowhere.
**Remediation:** Add `aria-label="Facebook"` (etc.) to each link and either point `href` at the real social profile URLs or, if none exist yet, remove the links rather than shipping dead placeholders.

### 9. [Low] Shared `DataTable` primitive has no horizontal-scroll wrapper
**Location:** `frontend/src/components/common/DataPrimitives.jsx:250-286` (`DataTable` renders a bare `<table style={{ width: '100%' }}>` with no scroll container), and two auto-generated module pages with unstyled bare tables: `frontend/src/modules/M006/M006Page.jsx:44`, `frontend/src/modules/M011/M011Page.jsx:69`.
**Description:** Unlike `components/ui/table.jsx` (which correctly wraps its `<table>` in `<div className="relative w-full overflow-auto">`), `DataTable` and the two module pages have no scroll container. A table with several columns will overflow the viewport on mobile with no way to see the cut-off columns short of the browser's own pinch-zoom. Low severity because `DataTable` currently has zero call sites in the codebase (grep found 0 usages under `src/modules`) — it's presently dead code, but worth fixing before it's adopted.
**Remediation:** Wrap the `<table>` in `DataTable` (and the two bare module tables) in a `<div className="overflow-x-auto">`, matching `ui/table.jsx`.

### 10. [Low] `<select>`/`<input>` grouped in unbroken 2-column grids inside modals
**Location:** e.g. `SeedVaultPage.jsx:254` (`grid grid-cols-2 gap-4` inside a `max-w-lg` modal form).
**Description:** Same root cause as Finding 6 but specifically inside constrained modal widths (`max-w-lg`/`max-w-md`), where two form columns can become uncomfortably narrow well before general mobile breakpoints, since the modal itself doesn't shrink to full-width until very small viewports.
**Remediation:** Default modal-internal grids to a single column (`grid-cols-1 sm:grid-cols-2`).

### 11. [Low] No `eslint-plugin-jsx-a11y` in the lint pipeline
**Location:** `frontend/package.json` lint script (`eslint src --ext js,jsx ...`); no `jsx-a11y` plugin in `package.json` dependencies or (checked) `.eslintrc`.
**Description:** None of findings 1-8 would currently be caught automatically in CI/pre-commit — there's no static accessibility linting gate, so regressions of the same kind will keep shipping.
**Remediation:** Add `eslint-plugin-jsx-a11y` with the recommended ruleset; it would flag missing `alt`, missing labels, `href="#"`, and interactive elements without keyboard handlers automatically.

### 12. [Low] `<img>` usage is minimal but clean
**Location:** 5 files, 6 `<img>` tags total (searched `frontend/src/**/*.jsx`).
**Description:** Positive finding, not a defect: every `<img>` found has an `alt` attribute. Most product/media imagery in the app is instead rendered as background images or "No image" text placeholders (e.g. `MarketplacePage.jsx:208`, `ProductDetailPage.jsx:57`), which sidesteps the missing-`alt` problem common in similar apps but should be kept in mind if raster `<img>` usage grows.
**Remediation:** None required now; keep `alt` mandatory as image usage grows, and prefer meaningful `alt` text (e.g. product name) over generic labels when images are added.

## Metrics

| Metric | Count |
|---|---|
| `.jsx` files scanned | 565 |
| Auto-generated module pages (`modules/M001`-`M150`) | 150 |
| `<img>` tags / missing `alt` | 6 / 0 |
| `<button>` elements (total) | 286 |
| Files using `aria-label` anywhere | 21 / 565 |
| Files with zero `aria-*` attributes | 539 / 565 |
| `<input>` elements | 217 |
| `<input>` elements with an `id` | 32 |
| `<label>` elements | 230 |
| `htmlFor` usages | 16 |
| Files with unassociated `<label>`+control pattern | 31 |
| `role="dialog"` / `aria-modal` usages | 0 / 0 |
| Custom `fixed inset-0` modal overlays | 21 |
| Custom modals with Escape-key handling | 0 |
| `@radix-ui/react-dialog`-based dialog usages | 2 |
| `group-hover`-only reveal patterns (keyboard-inaccessible) | 7 (all in `Header.jsx`) |
| `grid-cols-[2-6]` without a responsive breakpoint | 81 |
| `href="#"` placeholder links | 4 |
| `text-gray-400` usages (icons + text, mixed decorative/actionable) | 50 |
| `text-gray-300` usages | 12 |
| `<table>` elements | 19 |
| `<table>`s wrapped in a horizontal-scroll container | 17 (via `overflow-auto`/`overflow-x-auto`) |
| Skip-to-content link present | Yes (`Layout.jsx`) |
| Landmark `<main>` present | Yes (`Layout.jsx`) |
| `eslint-plugin-jsx-a11y` configured | No |

## What's left
- [ ] Fix Header.jsx dropdown keyboard accessibility (Finding 1)
- [ ] Add dialog semantics/focus trap/Escape handling to the 21 custom modal overlays (Finding 2)
- [ ] Associate labels with form controls across the ~31 affected files (Finding 3)
- [ ] Add aria-label to icon-only buttons (Finding 4)
- [ ] Fix sub-AA icon contrast on actionable icon buttons (Finding 5)
- [ ] Add responsive breakpoints to hard-coded grid-cols usages (Finding 6)
- [ ] Reserve bottom spacing for fixed BottomNav in Layout.jsx (Finding 7)
- [ ] Label or remove Footer social placeholder links (Finding 8)
- [ ] Add overflow wrapper to DataTable primitive and the two bare module tables (Finding 9)
- [ ] Break modal-internal grids to single column by default (Finding 10)
- [ ] Add eslint-plugin-jsx-a11y to the lint pipeline (Finding 11)

*verified by vibecheck*
