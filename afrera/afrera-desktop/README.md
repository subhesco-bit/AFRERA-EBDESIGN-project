# afrera-desktop — superseded

This module is **not the desktop app**. It is an empty scaffold (no source
code, generic boilerplate README claiming Electron) left over from an early
architecture sketch. It was never implemented and should not be used as a
starting point.

The real AFRERA desktop app is a **Tauri** wrapper around the existing
`frontend/` React SPA — not a separate Electron codebase. See:

- `frontend/src-tauri/` — the Tauri (Rust) project
- `README-DESKTOP.md` (repo root) — setup and build instructions
- `MOBILE_DESKTOP_APPLICATION_STRATEGY.md` (repo root) — why Tauri was chosen
  over Electron, and the full investigation/decision record

Do not scaffold a new Electron (or any other) desktop app here. If you need
desktop-specific functionality, add it to `frontend/src-tauri/`.
