---
agent: infra-auditor
status: fail
findings: 10
---

# Infra / CI/CD / Docker Audit

## Summary

Commit `b08881d5` ("Fix PWA manifest icon mismatch, invalid duplicate CI workflow, add Tauri
desktop CI job") was verified against the actual files, not the commit message. Two of its
three claims hold up; the third introduces a CI job that cannot currently succeed:

- **Duplicate CI workflow fix — CORRECT.** `.github/workflows/ci.yml` is now a single valid
  YAML document with one `name:`/`on:`/`jobs:` block. No leftover concatenated document remains
  in that file.
- **PWA manifest icon fix — technically correct but applied to a dead file.** The icons
  referenced in `frontend/public/manifest.json` now point at real files. However, the app does
  not load `manifest.json` — `frontend/index.html` links `<link rel="manifest"
  href="/manifest.webmanifest">`, and `frontend/public/manifest.webmanifest` is a separate file
  that already had correct icon references before this commit. `manifest.json` is orphaned;
  nothing in `frontend/src`, `frontend/public`, or `index.html` references it. The commit did
  not fix a live bug — the real manifest was never broken.
- **Tauri desktop CI job — added, but cannot pass on this branch.** The job's own comment and
  the commit message both assert the Tauri app is "already fully scaffolded and configured
  (frontend/src-tauri...)". On this branch there is no `frontend/src-tauri` directory, no
  `Cargo.toml` anywhere in the repo, and none of the icon files `tauri.conf.json` requires
  (`icons/32x32.png`, `icons/icon.icns`, `icons/icon.ico`, `icons/icon.png`) exist. `git ls-files`
  confirms only a bare `tauri.conf.json` at repo root is tracked. (A later commit,
  `30894395`, on the unrelated branch `audit/ui-api-fix`, does add and track `frontend/src-tauri/`
  — but that commit is not an ancestor of this branch's `HEAD`, so it does not help this
  workflow.) The new `desktop` job will fail on `ubuntu-latest`, `windows-latest`, and
  `macos-latest` on every push to `main`/`develop`.

Beyond the audited commit, the pre-existing `frontend` job embeds a Terraform init/plan step
that has no working AWS authentication and will almost certainly fail `terraform init`, which
blocks the entire frontend job (and, downstream, `desktop` and `mlflow_deploy`, both of which
`needs: [frontend]`/`needs: [backend, frontend]`).

Net effect: as configured right now, this pipeline cannot go green on a normal push to `main`.
Overall status: **fail**.

## Findings

### 1. [CRITICAL] Tauri desktop CI job has nothing to build — will fail on all 3 OSes
**Location:** `.github/workflows/ci.yml` lines 334–375 (`desktop` job); `tauri.conf.json` (repo root)

The `desktop` job runs `npm run tauri:build` from `frontend/` on `ubuntu-latest`,
`windows-latest`, and `macos-latest` for every push. The Tauri CLI looks for a
`src-tauri/tauri.conf.json` (or an explicit `--config` pointing at one) relative to the
directory it's invoked from. Verified on disk:
- No `frontend/src-tauri/` directory exists anywhere in this checkout.
- No `Cargo.toml` exists anywhere in the repo.
- `tauri.conf.json` sits alone at the repo root, not under any `src-tauri/` folder — it is
  configuration for a Tauri project whose Rust half was never committed to this branch.
- The bundle icons it declares (`icons/32x32.png`, `icons/128x128.png`, `icons/128x128@2x.png`,
  `icons/icon.icns`, `icons/icon.ico`) and the system-tray icon (`icons/icon.png`) all resolve
  to a repo-root `icons/` directory that does not exist.

`git ls-files | grep -i tauri` returns only `tauri.conf.json`. The commit message and the
in-workflow comment ("already fully scaffolded and configured... frontend/src-tauri") describe
a state that does not exist on this branch. `npm run tauri:build` will fail immediately with
"no Tauri project found" (or equivalent) on all three matrix legs, turning the `desktop` job red
on every push/PR from the moment this workflow file lands.

**Remediation:** Either (a) commit the actual `frontend/src-tauri/` Rust scaffold (Cargo.toml,
`src-tauri/tauri.conf.json`, `build.rs`, icons) before merging this workflow — note a
`frontend/src-tauri/` scaffold does exist on the unrelated branch `audit/ui-api-fix` (commit
`30894395`) and could be cherry-picked/merged in — or (b) gate the `desktop` job (e.g.
`if: false` or a path filter) until that scaffold is actually present on this branch, so CI
doesn't run a build that is guaranteed to fail.

### 2. [CRITICAL] Frontend job's Terraform step has no working AWS auth — will fail `terraform init`
**Location:** `.github/workflows/ci.yml` lines 262–271 (inside the `frontend` job)

```yaml
- name: Terraform Init & Plan (infra)
  uses: hashicorp/setup-terraform@v2
  with:
    cli_config_credentials_token: ${{ secrets.AWS_ACCESS_KEY_ID }}
- name: Run terraform plan
  working-directory: ./infra/terraform
  run: |
    terraform init -input=false
    terraform validate
    terraform plan -out=tfplan
```

`cli_config_credentials_token` configures a Terraform Cloud/Enterprise token in `~/.terraformrc`
— it is not how you authenticate the `aws` provider or an S3 backend, so passing an AWS access
key ID there does nothing useful. There is no `aws-actions/configure-aws-credentials` step and
no `AWS_SECRET_ACCESS_KEY` anywhere in the workflow. Meanwhile `infra/terraform/backend.tf`
configures an S3 backend (`bucket = "afrera-terraform-state"`, region `us-east-1`), and
`infra/terraform/main.tf` declares the `aws` provider plus `aws_s3_bucket`/`aws_ecr_repository`
resources. Without real AWS credentials in the environment, `terraform init -input=false` has no
way to authenticate to the S3 state backend and will fail before `validate`/`plan` ever run.

This step lives inside the **`frontend` job** ("Frontend - lint, build"), not a dedicated infra
job, so a Terraform auth failure fails frontend lint/build entirely — and `desktop` (`needs:
[frontend]`) and `mlflow_deploy` (`needs: [backend, frontend]`) never run as a result. This
predates commit `b08881d5` (not touched by that diff) but is a current, unaddressed
launch blocker for the pipeline as a whole.

**Remediation:** Move this step to its own job (or behind `if: github.event_name == 'push'`
only, mirroring `docker`/`desktop`), and either wire real AWS auth (OIDC via
`aws-actions/configure-aws-credentials`, or repo secrets `AWS_ACCESS_KEY_ID`/
`AWS_SECRET_ACCESS_KEY` consumed by the AWS provider's standard env vars) or drop the step until
Terraform is actually part of this project's deploy story.

### 3. [MEDIUM] PWA manifest fix applied to an orphaned, unreferenced file
**Location:** `frontend/public/manifest.json` (fixed by b08881d5); `frontend/index.html` line 13;
`frontend/public/manifest.webmanifest`

`frontend/index.html` links `<link rel="manifest" href="/manifest.webmanifest">`. The file
actually served for PWA installability is `frontend/public/manifest.webmanifest`, which already
referenced the real icon files (`icon-192.png`, `icon-512.png`, `icon-maskable-512.png`) before
this commit — confirmed by reading it directly. `manifest.json` is not linked from `index.html`,
not referenced from `frontend/src` or `frontend/public/sw.js`, and there is no `vite-plugin-pwa`
or similar in `frontend/vite.config.js` that would generate or consume it. It is dead weight:
two manifests exist, only one is used, and the commit fixed the unused one. This did not break
or fix any actual PWA behavior — installability was unaffected either way — but leaving two
diverging manifest files in `public/` is a maintenance hazard (the next person to edit "the"
manifest has a 50/50 chance of editing the wrong one again).

**Remediation:** Delete `frontend/public/manifest.json` (or make `index.html` deliberately choose
between the two if there's a reason to keep both, e.g. one for a build tool that isn't wired up
yet) and keep `manifest.webmanifest` as the single source of truth.

### 4. [MEDIUM] docs/OPEN_ITEMS.md is stale — contradicts the actual script and CI wiring
**Location:** `docs/OPEN_ITEMS.md` lines 213–230; `tools/validate-resolution-rules.js`;
`.github/workflows/ci.yml` line 166

`OPEN_ITEMS.md` states `tools/validate-resolution-rules.js` "is **not working**" because "its
SQL tuple parser miscounts parentheses," that it "is deliberately NOT referenced in
`.github/workflows/ci.yml`," and recommends as a fix: "drop the text parsing and query
`information_schema` after migrations apply."

Reading the actual script shows that fix has already been made. Its own header comment says so
explicitly: *"The first version of this tool parsed the INSERT statements out of
990_ai_outcomes.sql... found 4 rules instead of 9... Parsing SQL text to check SQL was the wrong
idea... Ask the database."* The current implementation does exactly that — it connects to
`DATABASE_URL`/`PG*` env vars, reads `ai_resolution_rules` plus `information_schema.columns` live,
and only then compares. No text parsing remains.

And it **is** referenced in CI: `.github/workflows/ci.yml` line 166 runs
`node tools/validate-resolution-rules.js` unconditionally (no `|| true`, no
`continue-on-error`), placed after `Apply database migrations` in the `backend` job, so it does
have a live schema to query when it runs.

Whether this step is currently launch-blocking depends on whether the seeded rules in
`backend/src/database/migrations/990_ai_outcomes.sql` /
`backend/src/database/migrations/063_farmer_credit_risk_resolution.sql` reference real
table/column names. Migration `990_ai_outcomes.sql` itself carries a comment asserting this was
already corrected ("Column names below were checked against the applied schema, not assumed.
The first draft of this seed named gross_revenue, checked_at, batch_id and..."), which lines up
with `OPEN_ITEMS.md`'s own note that "those four are now fixed against the real schema." Based on
static reading of both files, the CI step is very likely to pass — but this was not confirmed by
an actual `psql`-backed run in this audit (no live Postgres instance was stood up), so treat that
as high-confidence, not certain.

The concrete problem is documentation drift, not a proven CI break: `OPEN_ITEMS.md` describes a
version of the tool and workflow that no longer exists, and would mislead anyone who reads it as
the current source of truth into thinking this check is disabled/broken when it is neither.

**Remediation:** Update `docs/OPEN_ITEMS.md` §"KNOWN BROKEN — do not wire into CI yet" to reflect
that the rewrite already happened and the step is live in CI, or delete that section entirely.
Separately, run the `backend` CI job (or `node tools/validate-resolution-rules.js` locally against
a migrated database) once to get a real pass/fail confirmation rather than relying on migration
comments.

### 5. [LOW] Superseded workflow file still committed
**Location:** `backend/.github/workflows/ci-cd.yml`

This file is explicitly marked in its own header as `"SUPERSEDED - THIS FILE NEVER RUNS AND
NEVER HAS"` (GitHub only discovers workflows under `.github/workflows/` at the repo root) and
says `"Kept for reference only. Delete once /.github/workflows/ci.yml is confirmed green on a
real push."` It is inert — not a functional risk — but it's stale config drift left over from
before the root `ci.yml` existed, and it still references `k8s/*.yaml` manifests and a
`ghcr.io`/`IMAGE_NAME` push flow that don't match the current (root) pipeline. Confusing for
anyone who finds it via search rather than by reading `ci.yml`'s comments first.

**Remediation:** Delete `backend/.github/workflows/ci-cd.yml` now that `ci.yml` exists at the
repo root, per the file's own instructions.

### 6. [LOW/MEDIUM] Node version drift between Docker runtime and CI test runtime
**Location:** `backend/Dockerfile` line 6 (`FROM node:18-slim`); `.github/workflows/ci.yml` line
35 (`NODE_VERSION: '20'`); `backend/package.json` / `frontend/package.json` `engines.node`
(`>=18.0.0`)

CI installs dependencies and runs tests/lint/build under Node 20. The production Docker image is
built from `node:18-slim`. `engines` only requires `>=18`, so nothing enforces parity. This means
whatever passes CI on Node 20 is not necessarily what ships in the container on Node 18 — a real
gap for a "launch level" bar, since the tested runtime and the shipped runtime differ.

**Remediation:** Pin the Dockerfile's base image to the same major version CI tests against
(`node:20-slim`), or pin `NODE_VERSION` in CI down to 18 to match the image — pick one and make
both files agree.

### 7. [LOW] No `.dockerignore` for the backend build context
**Location:** `backend/` (file absent); `backend/Dockerfile`

No `.dockerignore` exists anywhere in the repo. The current `Dockerfile` mitigates most of the
risk by using explicit `COPY package*.json ./` and `COPY src ./src` rather than `COPY . .`, so
`node_modules`, `.git`, `.env`, and test fixtures aren't accidentally baked into the image today.
But there's nothing preventing a future edit (e.g. someone adding `COPY . .` for convenience)
from silently pulling `backend/.env.example`-adjacent secrets-ish files, `.git`, or local
`node_modules` into the image or bloating the build context.

**Remediation:** Add a `backend/.dockerignore` (node_modules, .git, .env*, coverage, *.log,
migrations test fixtures if any) as a guardrail independent of how `COPY` is currently written.

### 8. [MEDIUM] No production deployment step exists anywhere in the pipeline
**Location:** `.github/workflows/ci.yml` — `docker` job (lines 305–325), `mlflow_deploy` job
(lines 282–303), trailing comment block (lines 397–404)

By the workflow's own comments, this is intentional-for-now rather than accidental, but it's
still a real launch-readiness gap worth stating plainly: the `docker` job builds the backend
image and explicitly does not push it anywhere (`push: false`, comment: *"Build only - not
pushed. Restore the registry login + push step once a container registry is actually chosen"*);
`mlflow_deploy` only does `kubectl ... --dry-run=client`; and the trailing comment confirms the
previous `deploy-dev`/`deploy-prod` jobs were removed because they referenced a `k8s/` directory
that doesn't exist at the repo root (only `infra/k8s/mlflow-*.yaml` exists, scoped to MLflow).
There is currently no path from a green CI run to anything actually running in an environment
users can reach — for either the backend or the frontend.

**Remediation:** Before calling this "launch level," decide and wire an actual deploy target
(container registry + push step, hosting for the frontend build output, real k8s manifests or a
PaaS like Railway/Render/Fly, etc.), or explicitly document that deployment is a manual,
out-of-CI step for now so it isn't assumed to be automated.

### 9. [LOW] Local dev secrets and obsolete Compose syntax in `docker-compose.yml`
**Location:** `backend/docker-compose.yml`

- Line 1: `version: '3.8'` — the top-level `version` key is obsolete in current Docker Compose
  (v2 CLI ignores it with a warning). Cosmetic only.
- Hardcoded default credentials throughout (`afrera_password`, `JWT_SECRET:
  your-super-secret-key-change-in-production`) are fine for a local-only compose file (not
  consumed by CI, not the production Dockerfile), and the JWT default even says
  "change-in-production" — but worth confirming this file is never reused as-is for anything
  beyond a laptop, since nothing technical stops someone from pointing it at a real environment.

**Remediation:** Drop the `version:` key; no functional change needed for the secrets as long as
this file stays dev-only — consider a comment at the top of the file saying so explicitly if one
isn't already implied elsewhere.

### 10. [INFO] Two CI gates are advisory (`continue-on-error: true`) over known, unresolved issues
**Location:** `.github/workflows/ci.yml` lines 212–214 (Governance check), lines 223–225
(Boundary check)

Both are explicitly commented as temporary: Governance check is advisory "until the flagged
random() calls are cleared," and Boundary check is advisory "until the 2 unguarded modules are
fixed." Not a defect in the workflow itself — the comments are honest about the debt — but for a
"launch level" pass this is worth surfacing as two known, currently-non-blocking issues that
CI will not catch if they regress further, since both checks pass through failures silently.

**Remediation:** Track the underlying fixes (random() calls in AI output paths; the 2 unguarded
modules) as their own follow-up items, then drop `continue-on-error` from both steps once
resolved so CI actually enforces them.

## Metrics

- CI workflow files found: 2 (`.github/workflows/ci.yml` — active; `backend/.github/workflows/ci-cd.yml` — inert/superseded, not discovered by GitHub Actions)
- Jobs in active workflow: 6 (`backend`, `frontend`, `mlflow_deploy`, `docker`, `desktop`, `security`)
- CI jobs verified as currently unable to pass on a normal push: 2 (`desktop` — all 3 OS matrix legs; `frontend` — via the embedded Terraform step)
- CI steps with no failure gate that plausibly should have one investigated: 1 (`validate-resolution-rules.js`, assessed likely-safe on current evidence, not fully confirmed live)
- Dockerfiles: 1 (`backend/Dockerfile`) — multi-stage, non-root not verified/not set, HEALTHCHECK present
- docker-compose services: 7 (postgres, mongodb, redis, backend, rabbitmq, elasticsearch, + implicit network/volumes)
- `.dockerignore` files present: 0
- PWA manifest files present: 2 (`manifest.json` orphaned, `manifest.webmanifest` live)
- Tauri config files present: 1 (`tauri.conf.json`, root) vs. required Rust scaffold present: 0 (`frontend/src-tauri/`, `Cargo.toml` both absent)
- Terraform files: 4 (`backend.tf`, `main.tf`, `outputs.tf`, `variables.tf`) under `infra/terraform/`
- K8s manifests: 4, all MLflow-scoped (`infra/k8s/mlflow-{namespace,configmap,deployment,service}.yaml`) — no manifests exist for backend/frontend app deployment
- Findings total: 10 (Critical: 2, Medium: 3, Low: 4, Info: 1)
