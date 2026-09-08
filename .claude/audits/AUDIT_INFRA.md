---
agent: infra-auditor
status: warn
findings: 7
---

# Infra / CI/CD / Docker Audit

## Summary

Re-run from scratch on branch `audit/ui-api-fix` (current HEAD `5e2eb01b`), against the actual
files on disk right now — other sessions are concurrently editing this repo, so this reflects a
live snapshot, not the prior audit's branch/commit.

**The specific claim this audit was asked to verify — that `docker-compose.yml`'s `DATABASE_URL`
fix is actually present — is CONFIRMED.** `backend/docker-compose.yml`'s `backend` service sets
`DATABASE_URL: postgresql://afrera:afrera_password@postgres:5432/afrera_db` alongside the
`PG_*` vars, with an inline comment explaining why `database/migrate.js` needs it specifically
(it only reads `DATABASE_URL`, no `PG_*` fallback). This is real, not a stale claim.

Beyond that, this branch has also already fixed most of what the previous `AUDIT_INFRA.md`
(read before this run, findings dated against a different, non-ancestor branch) flagged as
critical there:

- **Tauri desktop CI job — now has something to build.** Unlike the branch the prior audit
  inspected, `audit/ui-api-fix` actually contains the full `frontend/src-tauri/` scaffold:
  `Cargo.toml`, `build.rs`, `src/main.rs`, and a populated `icons/` directory matching what
  `tauri.conf.json` requires. The `desktop` job in `.github/workflows/ci.yml` (lines 376–417)
  can plausibly build now.
- **Terraform step — split out and given real AWS auth.** It is no longer embedded in the
  `frontend` job. It is now its own `infra` job (lines 298–322) using
  `aws-actions/configure-aws-credentials@v4` with real `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`
  secrets (matching `docs/infra/TERRAFORM_CI.md`, which exists and documents this), and is marked
  `continue-on-error: true` pending confirmation those secrets/remote state actually work. Nothing
  else `needs: infra`, so even if it fails, it no longer blocks `frontend`, `docker`, `desktop`,
  or `mlflow_deploy` the way the old embedded step did.
- **Node version drift — resolved.** `backend/Dockerfile` now builds from `node:20-slim` (both
  stages), matching `NODE_VERSION: '20'` in `.github/workflows/ci.yml`. No more CI-tests-20/
  ships-18 mismatch.
- **`docs/OPEN_ITEMS.md` staleness — resolved.** The section about
  `tools/validate-resolution-rules.js` now explicitly says "FIXED — wired into CI (this section
  was stale, corrected 2026-08-28)" and accurately describes the current
  `information_schema`-based implementation and its live reference at `ci.yml:166`. Matches what
  reading the script and the workflow directly confirms.

What's left is a smaller, real list. Overall status: **warn** (no CI-breaking defects confirmed
by static reading, but real gaps remain: no `.dockerignore`, a dead superseded workflow file, an
orphaned manifest, no actual deploy path, and several advisory-only CI gates masking known debt).

## Findings

### 1. [MEDIUM] No production deployment step exists anywhere in the pipeline
**Location:** `.github/workflows/ci.yml` — `docker` job (lines 347–367), `mlflow_deploy` job
(lines 324–345), trailing comment (lines 480–487)

Unchanged from the prior audit. `docker` builds the backend image with `push: false` ("Build
only - not pushed. Restore the registry login + push step once a container registry is actually
chosen"). `mlflow_deploy` only runs `kubectl ... --dry-run=client`. The new `mobile-android` job
(lines 419–458) builds a debug APK and uploads it as an artifact but has no distribution step
either (no Play Store upload, no signing config referenced). There is still no path from a green
CI run to anything reachable by a real user, for backend, frontend, mobile, or desktop.

**Remediation:** Decide and wire an actual deploy target (registry push, static hosting for the
frontend build, real k8s manifests or a PaaS), or document plainly that deployment stays a manual
step for now so it isn't assumed automated.

### 2. [LOW] Superseded workflow file still committed
**Location:** `backend/.github/workflows/ci-cd.yml`

Unchanged. Still headed `SUPERSEDED - THIS FILE NEVER RUNS AND NEVER HAS`, with its own
instruction to "Kept for reference only. Delete once /.github/workflows/ci.yml is confirmed green
on a real push." `ci.yml` has clearly been iterated on repeatedly since (Terraform split into its
own job, Tauri/Android jobs added, schema/AI-rules validation added) without this file being
removed. Still references `k8s/*.yaml` and a `ghcr.io` push flow that don't match current
`ci.yml`.

**Remediation:** Delete `backend/.github/workflows/ci-cd.yml` per its own header instruction.

### 3. [LOW] Orphaned PWA manifest still present
**Location:** `frontend/public/manifest.json`; `frontend/index.html` line 13;
`frontend/public/manifest.webmanifest`

Unchanged. `frontend/index.html` links `<link rel="manifest" href="/manifest.webmanifest">`.
`manifest.webmanifest` (confirmed by reading it) is a complete, correct manifest — real name,
icons (`/icons/icon-192.png`, `/icons/icon-512.png`, `/icons/icon-maskable-512.png`), theme
color. `manifest.json` still sits alongside it in `frontend/public/`, still unreferenced by
`index.html` or anything under `frontend/src`. Dead weight / maintenance trap, not a functional
bug.

**Remediation:** Delete `frontend/public/manifest.json`, keep `manifest.webmanifest` as the only
one.

### 4. [LOW] No `.dockerignore` anywhere in the repo
**Location:** repo-wide (file absent); `backend/Dockerfile`

Confirmed still absent (checked repo root and `backend/`). `backend/Dockerfile` still mitigates
the immediate risk with explicit `COPY package*.json ./` / `COPY src ./src` rather than
`COPY . .`, so this remains a guardrail gap rather than an active leak.

**Remediation:** Add `backend/.dockerignore` (`node_modules`, `.git`, `.env*`, `coverage`,
`*.log`) as a guardrail independent of how `COPY` is written today.

### 5. [LOW] `backend/docker-compose.yml` uses obsolete Compose `version` key and dev-only secrets
**Location:** `backend/docker-compose.yml` line 1

Unchanged: `version: '3.8'` is ignored (with a warning) by current Compose. Hardcoded
`afrera_password` / `JWT_SECRET: your-super-secret-key-change-in-production` remain fine for a
local-only file — worth noting these are now the exact strings the new
`backend/src/config/productionConfig.js` guard (see Finding 7) treats as placeholder values, so
if anyone ever pointed `NODE_ENV=production` at this compose file's env block, the app would now
correctly refuse to boot rather than run insecurely. That's a net improvement, not a new gap.

**Remediation:** Drop the `version:` key; no urgency on the secrets given the above.

### 6. [INFO] Three CI gates are advisory (`continue-on-error: true`) over known, unresolved issues
**Location:** `.github/workflows/ci.yml` line 215 (`Test`), line 227 (`Governance check`), line
238 (`Boundary check`), line 322 (`infra`/Terraform job)

Same two as before (Governance: "advisory until the flagged random() calls are cleared";
Boundary: "advisory until the 2 unguarded modules are fixed"), plus one new one added since:
`Test` (line 213–215) now runs `npm test` for real and is explicitly `continue-on-error: true`
because "21 of 33 pre-existing suites" fail — the workflow's own comment says this is the first
time CI has actually executed the test suite. The newly split-out `infra` job is also advisory
pending confirmation the AWS secrets/remote state actually work end-to-end. None of these
silently hide new regressions (the comments are honest about scope), but for a "launch level" bar
this is four checks that can regress further without failing a single build.

**Remediation:** Track the four items (random() calls, 2 unguarded modules, the 21 failing test
suites, Terraform AWS auth confirmation) as their own follow-ups, then drop `continue-on-error`
from each once resolved.

### 7. [INFO] New production-config boot guard added and correctly wired
**Location:** `backend/src/config/productionConfig.js` (new, untracked); `backend/src/index.js`
lines 7–8

Not a defect — noting it because it's new since the last infra audit and directly relevant to
config drift. `assertProductionConfiguration()` is called at the very top of `index.js`, before
`express` is even required, and throws if `NODE_ENV === 'production'` and `DATABASE_URL`,
`JWT_SECRET`, or `ENCRYPTION_KEY` are missing/placeholder values (including the exact
`your-super-secret-key-change-in-production` string that appears in `docker-compose.yml`), too
short, or if neither `ALLOWED_ORIGINS` nor `FRONTEND_URL` is set. It is a no-op outside
`NODE_ENV=production`, so it does not affect the dev compose file (`NODE_ENV: development`) or CI
(`NODE_ENV: test`) — verified against both. Correctly wired, no drift introduced.

## Metrics

- CI workflow files found: 2 (`.github/workflows/ci.yml` — active, discovered by GitHub Actions;
  `backend/.github/workflows/ci-cd.yml` — inert/superseded, still not deleted)
- Jobs in active workflow: 8 (`backend`, `frontend`, `infra`, `mlflow_deploy`, `docker`,
  `desktop`, `mobile-android`, `security`) — 2 new (`infra`, `mobile-android`) since prior audit
- CI jobs verified as currently unable to build/deploy anything real: 2 (`docker` — builds but
  never pushes; `mlflow_deploy` — dry-run only); `mobile-android` builds an APK artifact but has
  no distribution step
- CI steps advisory (`continue-on-error: true`) over known debt: 4 (`Test`, `Governance check`,
  `Boundary check`, `infra`/Terraform plan)
- Dockerfiles: 1 (`backend/Dockerfile`) — multi-stage, `node:20-slim` both stages (matches CI
  `NODE_VERSION: '20'`), HEALTHCHECK present and confirmed to hit a real mounted `/health` route
  (`backend/src/index.js:1069`)
- `.dockerignore` files present: 0
- docker-compose services: 7 (postgres, mongodb, redis, backend, rabbitmq, elasticsearch, +
  network/volumes); `DATABASE_URL` fix for the `backend` service's migrate step — **confirmed
  present**
- PWA manifest files present: 2 (`manifest.json` still orphaned, `manifest.webmanifest` still the
  one actually linked from `index.html`)
- Tauri scaffold: **now complete** on this branch — `frontend/src-tauri/{Cargo.toml, build.rs,
  src/main.rs, icons/*}` all present, matching what `tauri.conf.json` requires
- Terraform files: 4 under `infra/terraform/`; CI auth now uses
  `aws-actions/configure-aws-credentials@v4` in its own `infra` job (previously embedded, wrong
  auth mechanism, blocked `frontend`)
- K8s manifests: 4, all MLflow-scoped — no manifests for backend/frontend/mobile app deployment
- Findings total: 7 (Medium: 1, Low: 4, Info: 2) — down from 10 (Critical: 2, Medium: 3, Low: 4,
  Info: 1) in the prior audit; both prior CRITICAL findings (Tauri scaffold missing, Terraform
  auth blocking frontend) are resolved on this branch
