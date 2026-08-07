# Technical Debt Register

**Generated:** 2026-08-04 by `tools/engineering-registry.js`
**Status:** DESCRIPTIVE — derived from code, not authored.
**Do not edit by hand.** Regenerate instead: `node tools/engineering-registry.js`

---

| Item | Measure | Severity |
|---|---|---|
| Fabricated AI output (`Math.random()`) | 34 calls | **Critical** — presented to users as analysis |
| Services with routes but no auth guard | 4 | **High** |
| Duplicate table definitions | 19 | High |
| TODO/FIXME markers | 1 | Low |
| Test files vs services | 30 / 83 | **High** — 36% |
| Components with zero ARIA | 71 of 71 | **High** |
| Error boundaries | 0 | **High** — one fault blanks the app |

## Unguarded services

- analyticsService (2 routes)
- catalogIntelligenceService (8 routes)
- merchandisingService (10 routes)
- moduleCatalogService (4 routes)
