# afrera-mobile — superseded

This module is **not the mobile app**. It is an empty scaffold (no source
code, generic boilerplate README claiming React Native + Expo) left over
from an early architecture sketch. It was never implemented and should not
be used as a starting point.

The real AFRERA mobile experience is a **PWA built into `frontend/`** — not
a separate React Native/Expo codebase. See:

- `frontend/public/manifest.webmanifest` — the web app manifest (installable,
  icons, shortcuts)
- `frontend/public/sw.js` — the service worker (offline caching, background
  sync)
- `MOBILE_DESKTOP_APPLICATION_STRATEGY.md` (repo root) — why PWA was chosen
  over React Native/Expo, and the full investigation/decision record

Do not scaffold a new React Native or Expo app here. If a hardware capability
genuinely can't be reached from the PWA (e.g. background geofencing, NFC),
the strategy doc's Phase 3 covers wrapping the same `frontend/` build with
Capacitor instead of forking the UI into a second codebase.
