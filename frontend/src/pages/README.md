# Status update: resolved, not documented-around

The 24 `.tsx` placeholder files that used to live directly in this
directory (`body.tsx`, `brain.tsx`, `cells.tsx`, …) were dead code —
generic static text, never imported anywhere, never reachable from the
router. They have been **deleted**.

In their place: **`frontend/src/pages/kernel/`**, 24 real, routed,
data-fetching pages backed by a real API — see
`frontend/src/pages/kernel/README.md`.
