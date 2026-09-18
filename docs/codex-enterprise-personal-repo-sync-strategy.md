# AFRERA Enterprise And Personal Repository Strategy

Generated: 2026-09-12

## Goal

Use the GitHub Enterprise trial repository as the active collaboration and testing target, while keeping a complete personal repository copy so no work is lost after the trial window.

## Current Local Finding

- `C:\Users\DIYA GOEL\Downloads\EBDESIGN` currently has `origin` set to `https://github.com/subhesco-bit/AFRERA-EBDESIGN-project.git`.
- `C:\Users\DIYA GOEL\Documents\GitHub\AFRERA-EBDESIGN-project` also points to `https://github.com/subhesco-bit/AFRERA-EBDESIGN-project.git`.
- `C:\Users\DIYA GOEL\Downloads\EBDESIGN.worktrees` contains worktree variants of the same root repository.
- The Enterprise remote URL is not currently configured in this local checkout.

## Required Remote Shape

Use explicit remote names so pushes never go to the wrong repository:

```text
origin      = personal GitHub safety copy
enterprise  = GitHub Enterprise trial repository
```

## Merge And Mirror Workflow

1. Keep all raw project-bearing folders indexed in the EBDESIGN Library:
   - `Downloads\EBDESIGN`
   - `Downloads\EBDESIGN.local-backups`
   - `Downloads\EBDESIGN.worktrees`
   - `Documents\GitHub`
2. Compare worktree/backup/repo variants by content hash and feature key.
3. Promote candidate feature versions into `_MERGE_LAB/features/<feature>/` with renamed paths.
4. Build one final production version in `_ACTIVE_PROJECT/current`.
5. Run build, smoke tests, backend tests, route checks, and library AI-context checks.
6. Push final tested branch to Enterprise first for trial collaboration/testing.
7. Immediately mirror the same tested commit to the personal repo.

## Branch Convention

Use:

```text
codex/unified-enterprise-main
```

for the current unified project branch.

## Safety Rules

- Never push the full 4 lakh-file raw folder.
- Never push `node_modules`, `dist`, backup folders, old build folders, local agent caches, or secrets.
- Never overwrite same-name files from different agents; rename and evaluate first.
- Never trust Enterprise as the only copy during a trial.
- The personal repo must receive the same tested commit after Enterprise push.

## Commands After Enterprise URL Is Known

```powershell
git remote add enterprise <ENTERPRISE_REPO_URL>
git fetch enterprise
git checkout -B codex/unified-enterprise-main
git add .
git commit -m "Consolidate AFRERA unified project library and operations"
git push enterprise codex/unified-enterprise-main
git push origin codex/unified-enterprise-main
```

If `enterprise` already exists, use:

```powershell
git remote set-url enterprise <ENTERPRISE_REPO_URL>
```

## Publication Flow

Enterprise is used for:

- GitHub Enterprise trial testing
- branch protection
- Actions CI
- Pages preview or deployment workflows
- reviewer collaboration

Personal repository is used for:

- permanent safety copy
- trial-expiry fallback
- future migration source
- independent branch archive

