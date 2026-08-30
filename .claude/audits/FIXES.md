# FIXES.md — Linkage Remediation Plan (consolidated 2026-08-30)

Consolidated from `AUDIT_ARCHITECTURE.md`, `AUDIT_DB.md`, `AUDIT_UI.md`,
`AUDIT_API.md` (all written earlier today, same audit wave). Prioritized by
severity × leverage. User directive: "address all issues simultaneously,
complete the job overnight." Executed via 3 parallel background agents
(no shared file targets, to avoid merge conflicts):

- **Agent B1 (DB/schema linkage)** — fold the 46 real `modules/*/model.sql`
  files into the executed migration path (Finding 11, the root cause behind
  ≥22 confirmed 42P01 crash-on-query modules); fix `docker-compose.yml`'s
  4%-of-schema gap; fix the 2 new fabrication instances (M022, M107).
- **Agent B2 (API route linkage)** — F1 (platformCoreAPI 9 missing routes),
  F2 (animal-health missing DELETE/PUT), F3 (breeding-outcome path
  mismatch x3), F4 (pig FCR), F5 (M056 PUT/DELETE), F7 (stale doc-comments).
- **Agent F1 (UI wiring)** — notification bell (Finding 1), admin
  audit/security console panels (Finding 2), government schemes page
  extension (Finding 3), primary-nav reachability sweep (Finding 7).

## Explicitly deferred (not attempted overnight — too large/speculative for one pass)

- **35 modules with zero schema anywhere** (18 placeholder-only + 17 missing
  `model.sql`) — DB audit Finding 12. Needs real schema *design* work per
  module (not just wiring), starting from each service.js's INSERT column
  list. Flagged as next priority after tonight's fixes land.
- **F6's ~150 endpoint / ~20 resource family "frontend built ahead of
  backend" surface** (land, labour, farmer-kyc, shg, authorization, FPO
  governance/marketing/compliance, etc.) — large, bounded backend build-out,
  already self-documented in `api.js`'s own comments. Not blocked on
  anything, just too large for one overnight pass alongside everything else.
- **F8's ~78 unverified "orphaned" backend mount prefixes** — needs
  per-module manual verification before either building UI or deleting;
  explicitly flagged by the API audit as not-yet-confirmed.
- **UI Finding 4** (contractOfferAPI/millCircuitAPI — needs a whole new
  page, not a wiring fix) and the ~26 smaller zero-UI-consumer API objects
  UI Finding's metrics section lists by name only.
- **5-system AI orchestration fragmentation** — known, tracked architectural
  debt (ACTIVE.md), not regressed, not a "linkage broken" bug per se.
- **DB audit's original Findings 1, 3-10** (missing FK indexes, N+1 writes,
  dead `database/models/`, migrate.js `down`/auto-repair behavior, 29
  orphaned duplicate schema files) — real but lower severity than the
  cross-stack linkage gap the user specifically called out; left for a
  dedicated follow-up pass.

Status of each item tracked below as agents complete.

## Status

- **Agent B1 (DB/schema linkage) — DONE, see `.ai/tasks/ACTIVE.md`
  "2026-08-30 — Agent B1: DB/schema linkage fix"** for full detail.
  - Finding 11/13 (46 real `model.sql` files): 44 folded into new
    `backend/src/database/migrations/9500-9543_*.sql`; 2 (`M057`, `M087`)
    needed no new file, every table they define already exists elsewhere.
    Conservative collision policy applied throughout: skipped re-creating
    ~35 tables that already exist under the same name elsewhere with a
    possibly-different schema (logged, not silently absorbed), and dropped
    ~40 `REFERENCES` constraints pointing at those skipped tables (column
    kept, FK dropped) rather than guessing a compatible parent.
    **Live `npm run migrate` was NOT run — Postgres unreachable in this
    environment; SQL is structurally verified (paren-balance, no
    trailing-comma syntax errors) but not proven to apply. Run in CI/staging
    before trusting fully.**
  - Finding 14 (M022/M107 fabrication): DONE — real logic implemented
    against the actual input (not just relabeled), `node -c` clean.
  - Finding 2 (docker-compose schema gap): found already fixed by an
    earlier session (`npm run migrate && node src/index.js` command was
    already there) but that fix was incomplete — `migrate.js` needs
    `DATABASE_URL` specifically and the compose file never set it. Added.
  - Finding 12 (35 modules, zero schema anywhere): confirmed still open,
    out of scope, unchanged.

## Status

- **Agent B2 (API route linkage) — CLOSED (2026-08-30).** F1, F2, F3, F4, F5,
  F7 all fixed for real (not stubbed as "won't fix"), verified with
  `node --check` on every modified file plus a full backend boot check
  (clean, only pre-existing DB-not-running noise). F1's 9 endpoints have no
  real backing logic anywhere in the codebase, so they were wired as honest
  `501 NOT_IMPLEMENTED` rather than fabricated — same pattern as
  `aiGatewayRoutes.js`. Full detail in `.ai/tasks/ACTIVE.md`
  ("2026-08-30 — Agent B2: API route linkage fixes"). One new finding
  surfaced and logged there but *not* fixed (out of scope for this pass):
  `fpoInventoryAPI`'s `/modules/m056` frontend comment claims it backs
  `fpo_inventory_items`, but the module actually mounted at that path is
  M056 = Payment Processing — a real naming/content collision needing a
  schema decision, not a routing fix.

- **Agent F1 (UI wiring) — CLOSED (2026-08-30).** All four assigned findings
  fixed, `frontend/src/` only, verified with a clean `npx vite build`.
  - UI Finding 1 (notification bell): new `NotificationBell.jsx` mounted in
    `Header.jsx`, wired to the real `notificationAPI`.
  - UI Finding 2 (audit/security consoles): `SystemAdministrationPage.jsx`
    gained Audit and Security tabs wired to real `auditComplianceAPI` /
    `securityAccessControlAPI` (both admin-gated server-side, same as
    the page's existing tabs).
  - UI Finding 3 (government schemes/CSR): `GovernmentDashboardPage.jsx`
    gained a verified-registry section on the Schemes tab plus new Weather
    Alerts / Announcements / CSR Opportunities tabs, wired to real
    `governmentSchemeAPI` / `schemeRegistryAPI`.
  - UI Finding 7 (nav reachability): `Sidebar.jsx` rewritten with 10 new
    grouped sections covering all 110 previously-unlinked non-param routed
    paths — 0 gaps remain versus `config/routes.js`.
  Full detail in `.ai/tasks/ACTIVE.md` ("Closed this session (2026-08-30):
  UI wiring sweep").
