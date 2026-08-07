# Frontend Wireframe — layers and permitted dependencies

**Generated:** 2026-08-04 by `tools/frontend-boundaries.js`
**Status:** DESCRIPTIVE — measured from source.
**Do not edit by hand.**

---

```
┌──────────────────────────────────────────────────────────────┐
│  App.jsx     routing · provider composition · ErrorBoundary  │
├──────────────────────────────────────────────────────────────┤
│  pages       route-level: fetch → arrange → delegate         │
├──────────────────────────────────────────────────────────────┤
│  components  presentation only. Receive props. Never fetch.  │
├───────────────────────────┬──────────────────────────────────┤
│  store (zustand)          │  hooks                           │
│  cross-page state         │  reusable stateful logic         │
├───────────────────────────┴──────────────────────────────────┤
│  services/api.js   THE ONLY LAYER THAT TALKS TO THE NETWORK  │
│  auth header · 401 refresh · baseURL · offline queue         │
└──────────────────────────────────────────────────────────────┘

   Anything calling fetch() outside services/ has silently opted out
   of authentication and token refresh.
```

## Layers as built

| Layer | Files | Owns | May import |
|---|---|---|---|
| **app** | 1 | Routing, provider composition | pages, components, store, services, hooks |
| **pages** | 38 | Route-level composition. Fetches, arranges, delegates. | components, store, services, hooks |
| **components** | 31 | Presentation and local interaction only | components, store, hooks |
| **store** | 1 | Cross-page state (zustand) | services |
| **hooks** | 1 | Reusable stateful logic | services, store |
| **services** | 2 | ALL network I/O. The only layer that talks to the API. | _nothing_ |

## Rules

### FE-01 — Network calls go through services/api.js — never raw fetch().

**Severity:** critical

services/api.js attaches the Authorization header and handles 401 by refreshing the token. 30 files bypassed it with raw fetch() and NONE set an auth header. Against a guarded endpoint every one of those calls returns 401 and the screen renders empty.

### FE-02 — Components must not fetch. Pages fetch; components receive props.

**Severity:** high

A component that fetches cannot be reused on a screen that already has the data, and cannot be tested without mocking the network. It also produces N requests when rendered in a list.

### FE-03 — Interactive elements need an accessible name.

**Severity:** high

A button whose only content is an icon is unlabelled to a screen reader. This platform ships a voice mode for low-literacy and low-vision farmers; unlabelled controls make that mode decorative.

### FE-04 — Every route-level page needs an error boundary above it.

**Severity:** high

Without one, a single component throwing unmounts the whole React tree and the user sees a blank white page. On a rural connection with partial data this is not a rare path.

### FE-05 — No hardcoded colour literals — use design tokens.

**Severity:** medium

Two different greens both called "the brand green" already shipped once. Tokens are the single source of truth; a hex in a component silently forks it and does not follow dark mode.

### FE-06 — A page fetching data must render a loading and an error state.

**Severity:** medium

Otherwise a slow or failed request is indistinguishable from empty data. The user cannot tell "no orders" from "we could not load your orders", and will act on the wrong one.

