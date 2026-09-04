# Frontend Boundary Violations

**Generated:** 2026-09-03 by `tools/frontend-boundaries.js`
**Status:** DESCRIPTIVE — measured from source.
**Do not edit by hand.**

---

**Total: 0** across 0 files (1162 scanned).

| Rule | Severity | Files | Description |
|---|---|---|---|
| FE-01 | critical | 0 | Network calls go through services/api.js — never raw fetch(). |
| FE-02 | high | 0 | Components must not fetch. Pages fetch; components receive props. |
| FE-03 | high | 0 | Interactive elements need an accessible name. |
| FE-04 | high | 0 | Every route-level page needs an error boundary above it. |
| FE-05 | medium | 0 | No hardcoded colour literals — use design tokens. |
| FE-06 | medium | 0 | A page fetching data must render a loading and an error state. |