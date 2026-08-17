# Audit provenance

These 8 reports (`AUDIT_BUGS.md`, `AUDIT_CODE.md`, `AUDIT_DB.md`, `AUDIT_DOCS.md`,
`AUDIT_INFRA.md`, `AUDIT_SECURITY.md`, `AUDIT_SEO.md`, `AUDIT_UI.md`) were produced by
the launch-readiness audit run on branch `claude/eloquent-napier-660f37` (fork point
23 commits behind this branch) and ported here verbatim before that branch was deleted
as stale — it had no other unique work worth keeping.

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
