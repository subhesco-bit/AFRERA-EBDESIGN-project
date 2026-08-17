# Audit provenance

These 9 reports (`AUDIT_BUGS.md`, `AUDIT_CODE.md`, `AUDIT_DB.md`, `AUDIT_DOCS.md`,
`AUDIT_INFRA.md`, `AUDIT_PERF.md`, `AUDIT_SECURITY.md`, `AUDIT_SEO.md`, `AUDIT_UI.md`)
were produced by the launch-readiness audit run on branch `claude/eloquent-napier-660f37`
(fork point 23 commits behind this branch) and ported here verbatim before that branch
was deleted as stale — it had no other unique work worth keeping. `dep-auditor` and
`api-tester` reports were never produced on that branch (no `AUDIT_DEPS.md`/`AUDIT_API.md`
exist) — that pair of the 11-auditor `full-audit` workflow never completed there.

`AUDIT_PERF.md` Finding #1 ("no code-splitting for any of 150 route-level modules")
is the origin of the React.lazy conversion task referenced earlier in this session as
"C3" — that work was in progress on the stale branch (which is also where the 43
missing-page-import and `SharedInfraPage` bugs were noticed as a side discovery) but
was never finished or consolidated into a `FIXES.md` (no fix-planner run happened
there). Note `AUDIT_PERF.md`'s figures (150 modules, 270 imports, 1,342-line App.jsx)
describe that stale branch's App.jsx, not this branch's — this branch already uses a
centralized `config/routes.js` with all pages lazy-loaded, so Finding #1 is already
resolved here too.

Most findings (backend security/DB/infra/docs/code-quality, frontend accessibility/SEO)
are independent of the App.jsx/routing refactor that happened on this branch and should
still apply, but they have **not** been re-verified against this branch's current code.
Two things referenced in these reports are already resolved here and can be treated as
closed, not open items:

- `AUDIT_BUGS.md`'s "already-fixed `insuranceClaimsService.js:331`" context — confirmed
  still fixed on this branch (`aiRequest`/`aiResponse` correctly separated).
- `AUDIT_INFRA.md` Finding 1 (Tauri desktop CI job has no `src-tauri/` scaffold) —
  `frontend/src-tauri/` (with `Cargo.toml`, `build.rs`, `icons/`) already exists on this
  branch, so that CRITICAL finding no longer applies here.

Everything else should be re-verified (file/line references may have drifted) before
being fed into a fix-planner pass.
