# UI Layering Guide

Grounded in the real, running frontend (`frontend/src`) — every token and component named here exists in the codebase as of this writing. Not a design aspiration document.

## 1. Page shell (outer-to-inner)

```
<Layout>                         frontend/src/components/Layout.jsx
  <Header />                     sticky, z-sticky
  <div class="flex">
    <Sidebar />                  desktop only
    <main>{page content}</main>  <Outlet /> — routed page renders here
  </div>
  <Footer />
  <BottomNav />                  mobile only (lg:hidden), z-sticky
  {floating chat/voice widgets}  z-popover, only when authenticated
</Layout>
```

Every route in `src/App.jsx` / `src/config/routes.js` renders inside this shell via `<Outlet />`. A page component never re-implements header/nav — it only owns the content between them.

## 2. Responsive strategy

Tailwind's default breakpoints, used consistently:
- **`lg:` (1024px)** is the real mobile/desktop split point — `Sidebar` is desktop-only, `BottomNav` is `lg:hidden`. There is no separate tablet layout; tablet gets the mobile chrome with more horizontal room.
- Container: centered, `2rem` padding, capped at `1400px` on `2xl` (`tailwind.config.js`).

## 3. Stacking order (z-index)

Fixed in this session — previously 46 of ~49 z-index declarations across the app were the literal value `50` (sticky header, modal dialogs, toast notifications, dropdowns, and a floating chat widget all on one undifferentiated layer). Now a documented scale, defined once in `src/index.css` and exposed to Tailwind as utility classes:

| Class | CSS var | Value | Used for |
|---|---|---|---|
| `z-sticky` | `--z-sticky` | 20 | Persistent chrome: `Header`, mobile bottom bar |
| `z-dropdown` | `--z-dropdown` | 30 | `select` menus, the language selector |
| `z-popover` | `--z-popover` | 40 | Floating widgets over page content (chat/voice launcher) |
| `z-modal` | `--z-modal` | 50 | Dialogs and full-page blocking overlays (loading states, record forms) |
| `z-toast` | `--z-toast` | 60 | Transient notifications — must outrank an open modal, since a toast is often reporting the result of an action taken inside one |
| `z-skiplink` | `--z-skiplink` | 100 | Accessibility skip-to-content link — always wins |

**Rule:** never write a raw `z-50`/`z-[N]` in a new component. Pick the semantic class that matches the layer's actual role. If none fits, that's a sign a new layer genuinely needs adding to this table — add it here first, then use it.

## 4. Color system

Two layers, both real (`src/index.css`, `tailwind.config.js`):

**Base (shadcn-style, generic)** — `background`, `foreground`, `card`, `popover`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `border`, `input`, `ring`. Full light/dark pair via `.dark` class + `darkMode: ['class']`.

**AFRERA domain tokens** — these exist because the generic palette above cannot express what this platform actually shows. Each is a semantic HSL CSS variable, exposed as a Tailwind color so components write `bg-perishable` instead of picking their own hex value:

| Token | Meaning | Design intent |
|---|---|---|
| `brandAccent` | Brand accent (was a hardcoded `#f97316`) | One definition, not 45 components picking their own orange |
| `perishable` / `ambient` | Handling engine (mirrors backend `handling_engines`, migration 992) | Perishable = live/clock-running green; ambient = stable/cost-optimised blue-grey |
| `coldchain.{ok,warn,breach}` | Cold-chain telemetry state | Three-stage, unambiguous |
| `provenance.{gi,organic,unverified}` | Origin/certification trust | `unverified` is a deliberately honest neutral grey — **never green**, so an unverified claim can't visually pass as a verified one |
| `sev.{info,notice,warning,critical,emergency}` | Mirrors backend `SEVERITY` enum + emergency ladder | Lightness descends monotonically through the scale — severity survives greyscale and red-green colorblindness, not just hue |
| `data.{real,estimated,assumed}` | Mirrors the MCDA data-quality weighting | A figure derived from assumed data must never render with the same visual confidence as a measured one |

**Rule:** a new feature showing perishability, cold-chain state, certification, incident severity, or data confidence uses these tokens — it does not invent a new color. If the existing set genuinely doesn't cover a new concept, add a token here (with the same reasoning-in-comment discipline as the existing ones), not a one-off hex value in a component.

## 5. Component layering (structural, not visual)

- **Page** (`src/pages/*.jsx`) — owns data fetching and layout for one route. Never renders `Header`/`Sidebar`/`Footer` itself.
- **Feature component** (`src/components/<Domain>/*.jsx`) — a real, working, domain-specific unit (e.g. `Logistics/RealTimeTracking.jsx`, `Logistics/CustodyChainViewer.jsx`). Composed into one or more pages.
- **UI primitive** (`src/components/ui/*.jsx`) — shadcn-derived, generic, no domain knowledge (`button`, `dialog`, `select`, `Toast`, `card`). Every domain token above is designed to be usable through these primitives (e.g. `<Badge className="bg-sev-critical">`).
- **Layout chrome** (`Header`, `Sidebar`, `Footer`, `BottomNav`, `Layout`) — rendered once, globally, never per-page.

## 6. Known gap

`src/modules/M001`–`M150` are a separate, mechanically-generated catalogue (150 generic CRUD scaffold pages), not built against this design system — they predate it and use ad-hoc inline styles. Bringing them onto these tokens is real, tracked follow-up work, not done here.
