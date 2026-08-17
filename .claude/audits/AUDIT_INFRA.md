---
agent: infra-auditor
status: fail
findings: 10
---

## Summary

Audited Docker/CI/CD/config for drift and launch blockers, including direct verification (not trusting commit messages) of commit `b08881d5`'s claims (PWA manifest icon fix, duplicate CI workflow fix, Tauri desktop CI job) and of a doc/CI contradiction flagged by the doc audit (`docs/OPEN_ITEMS.md` vs `.github/workflows/ci.yml:166` re: `tools/validate-resolution-rules.js`).

## Findings

1. **Verified correct — Duplicate CI workflow fix.** `.github/workflows/ci.yml` is now a single valid YAML document.

2. **High — PWA manifest fix patched the wrong (orphaned) file.** `frontend/index.html` loads `/manifest.webmanifest`, not `/manifest.json`. Commit `b08881d5` fixed icon paths in `manifest.json`, which is referenced nowhere in the codebase. The live manifest (`manifest.webmanifest`) already had correct icons before this commit — the fix touched a dead file and the drift it was meant to address is still live. Remediation: fix icons in `manifest.webmanifest` (the file actually loaded), and either delete `manifest.json` or document why it's kept.

3. **High — Tauri desktop CI job cannot pass; scaffold does not exist on this branch.** The CI job and its commit message claim the Tauri app is "already fully scaffolded (`frontend/src-tauri`)." On this branch there is no `frontend/src-tauri/` directory, no `Cargo.toml` anywhere, and the icon files `tauri.conf.json` requires don't exist (`git ls-files | grep tauri` shows only a bare root `tauri.conf.json`). This job will fail on all three OS matrix legs on every push. A working scaffold exists in commit `30894395` but only on branch `audit/ui-api-fix` (unmerged at the time of the original audit — note this repo's current branch *is* `audit/ui-api-fix`, so re-verify scaffold presence here before trusting this finding as still current). Remediation: either merge/restore the real scaffold before this branch runs the job, or gate the job behind a path-existence check so it skips cleanly instead of failing.

4. **High — `frontend` CI job uses the wrong Terraform auth mechanism; will fail `terraform init`.** The job passes `cli_config_credentials_token: ${{ secrets.AWS_ACCESS_KEY_ID }}` — that input authenticates to Terraform Cloud, not AWS, and no real AWS credentials are configured anywhere. `terraform init` against the S3 backend will fail, taking down the `frontend` job and cascading to any jobs that depend on it (`desktop`, `mlflow_deploy`). This is a pre-existing launch blocker, independent of the Tauri/manifest issues. Remediation: replace with proper AWS credential configuration (e.g. `aws-actions/configure-aws-credentials`) or remove the Terraform step if it's not actually meant to run in CI yet.

5. **Verified, downgraded from doc audit's "high-confidence, not certain" — `tools/validate-resolution-rules.js` claim is outdated.** `docs/OPEN_ITEMS.md` says this script is broken (stale SQL-parser bug) and "deliberately NOT referenced" in CI. Both claims are stale: the script was already rewritten to query `information_schema` live (matching OPEN_ITEMS.md's own recommended fix), and `ci.yml:166` does run it unconditionally. A migration-file comment asserts the seed data was already corrected against the real schema, so the step is likely to pass, but this was not confirmed against a live DB run. Remediation: update `docs/OPEN_ITEMS.md` to reflect the current state; do a live CI run to confirm the step actually passes.

6. **Medium — Stale superseded workflow still committed.** `backend/.github/workflows/ci-cd.yml` still exists alongside the main `ci.yml`, unclear if it still runs or is dead weight.

7. **Medium — Node version drift.** Docker images pin Node 18; CI runs Node 20.

8. **Medium — No `.dockerignore`.** Build context includes unnecessary files, risking bloated/slow image builds and potential secret leakage into images.

9. **Medium — No actual deployment step anywhere in the pipeline.** CI builds and tests but never deploys — there is no path from a green CI run to a running production environment.

10. **Low — Two CI gates run with `continue-on-error` over known unresolved issues,** masking failures that should be visible/blocking.

## Metrics

- CI workflow files reviewed: `.github/workflows/ci.yml`, `backend/.github/workflows/ci-cd.yml`
- Commit `b08881d5` claims verified: 3 (1 correct, 2 incorrect/incomplete)
- Findings by severity: 3 High (pre-existing, launch-blocking), 4 Medium, 1 Low, 2 verification notes
