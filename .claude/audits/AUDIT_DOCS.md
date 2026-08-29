---
agent: doc-auditor
status: warn
findings: 11
---

# Documentation Audit — AFRERA Platform

## Summary

The repository has real, current documentation in places (`backend/.env.example` is
generated from an actual scan of `process.env` usage, `docs/OPEN_ITEMS.md` is dated
2026-08-04 and honestly tracks known gaps, `backend/scripts/generate-openapi.js`
derives `openapi.json` from live route definitions). But the top-level docs a new
developer or stakeholder would read first — root `README.md`, the 150 per-module
`README.md` files, and the relationship between `afrera/` and the actual
`backend/`+`frontend/` app — are stale, incomplete, or self-contradictory relative to
the code and to other docs in the repo. None of the issues found are unrecoverable,
but several would cause a new developer's first `npm install && npm run dev` to fail
or mislead, and one causes a real CI-configuration doc to assert something the
workflow file directly contradicts. No files were modified — this is audit-only.

Overall status: **warn**. No single finding is launch-blocking on its own, but the
volume of stale onboarding/setup documentation is inconsistent with "launch level."

## Findings

### 1. `docs/OPEN_ITEMS.md` misstates its own CI wiring — HIGH
- **Location:** `docs/OPEN_ITEMS.md` (lines ~213-219) vs `.github/workflows/ci.yml` (line 166)
- **Description:** `OPEN_ITEMS.md` documents `tools/validate-resolution-rules.js` as
  "**KNOWN BROKEN** — do not wire into CI yet" and states it is "deliberately NOT
  referenced in `.github/workflows/ci.yml`." In fact `ci.yml` runs it directly and
  unconditionally: `run: node tools/validate-resolution-rules.js` (step "Validate AI
  resolution rules against live schema", no `|| true` fallback). If the script is
  actually as broken as documented (miscounts parentheses, finds 4 rules instead of
  9, emits a false error), this CI step will fail every build — a documentation
  claim that is not just stale but actively contradicted by the workflow file it
  describes.
- **Remediation:** Reconcile the two: either confirm the script was fixed and update
  `OPEN_ITEMS.md`'s "KNOWN BROKEN" status, or remove/guard the CI step per the
  doc's original intent (the doc even proposes the fix: query
  `information_schema` after migrations instead of parsing SQL text).

### 2. Root README documents an env var that doesn't exist in code — MEDIUM/HIGH
- **Location:** `README.md` lines 166-168 vs `backend/.env.example` and `backend/src/**`
- **Description:** Root README's setup walkthrough lists `ANTHROPIC_API_KEY=your_anthropic_api_key`
  under an "# AI" section as a required/example env var. A repo-wide search of
  `backend/src` and `backend/.env.example` finds zero references to
  `ANTHROPIC_API_KEY` — it is not read by any code path and not listed in the
  actual (auto-generated-from-code) `.env.example`. A developer following the
  README would configure a credential the app never uses.
- **Remediation:** Remove `ANTHROPIC_API_KEY` from the README env block, or if AI
  features are intended to use it, wire it into the actual AI service and add it to
  `backend/.env.example`.

### 3. Root README's env var walkthrough omits most of the real required/optional vars — MEDIUM
- **Location:** `README.md` lines 134-176 vs `backend/.env.example` (105 lines, ~40 vars)
- **Description:** `backend/.env.example` states it was "Generated 2026-08-03 from the
  59 process.env references found in backend/src" and includes `DATABASE_URL`,
  `TEST_DATABASE_URL`, `MONGODB_URI`, `ENCRYPTION_KEY`, `OFFLINE_PAYMENT_SECRET`,
  `SYNC_SECRET`, `TRUSTED_IPS`, `JWT_ISSUER`/`JWT_AUDIENCE`, full Google/Facebook
  OAuth blocks, Twilio SMS/voice vars, and SAP/Oracle/Custom-ERP blocks. The
  README's inline `.env` example shows only ~12 vars and mentions none of these.
  A developer who only reads the README (rather than discovering `.env.example`)
  will hit silent/confusing failures when OAuth, Twilio, or ERP-enabled code paths
  are exercised, and will miss the security note that `JWT_SECRET` falls back to an
  insecure default if unset (documented only in the `.env.example` comment, not the
  README).
- **Remediation:** Either point the README setup section directly at
  `backend/.env.example` ("copy `.env.example` to `.env`") instead of hand-listing a
  subset, or regenerate the README block from the same source of truth.

### 4. No `frontend/.env.example` despite a required env var — MEDIUM
- **Location:** `frontend/` (no `.env*` file present); `frontend/src` uses `import.meta.env.VITE_API_URL`
- **Description:** The frontend has exactly one env var in use (`VITE_API_URL`,
  confirmed by searching `frontend/src` for `import.meta.env.*`), and the README
  tells developers to "Create a `.env` file" with it inline. Unlike the backend,
  there is no `frontend/.env.example` to copy, so there is nothing in the repo a
  developer can `cp .env.example .env` from — inconsistent with the backend's
  setup pattern and easy to typo/miss silently (Vite will just fall back to
  `undefined` at build time with no error).
- **Remediation:** Add `frontend/.env.example` with `VITE_API_URL=http://localhost:3001/api/v1`.

### 5. README documents a `test:e2e` command that doesn't exist — LOW/MEDIUM
- **Location:** `README.md` lines 364-371
- **Description:** The "E2E Tests (planned)" section shows a runnable command block
  `npm run test:e2e`, but no `test:e2e` script exists in the root, or in
  `backend/package.json` or `frontend/package.json` (only `test`, `test:watch`,
  `test:coverage`/`test:ui` are defined). Labeling the section "(planned)" signals
  intent, but presenting it as a copy-pasteable command is misleading — running it
  fails with "missing script: test:e2e".
- **Remediation:** Remove the command block until the script exists, or replace it
  with plain text noting it's not yet implemented.

### 6. Root README "Project Structure" section is drastically out of date — MEDIUM
- **Location:** `README.md` lines 76-104
- **Description:** The documented tree shows only `backend/`, `frontend/`,
  `afrera_platform_v43.html`, and `README.md`. The actual repo root additionally
  contains: `docs/` (30+ files including the important `OPEN_ITEMS.md` and
  `master-module-catalogue.md`), `DOCUMENTATION/` (30+ "Volume_N_*" architecture
  specs), `afrera/` (an entire second 11-package monorepo — see finding 8),
  `infra/` (k8s + terraform), `tools/` (10+ CI/audit scripts), `workflows/`,
  and well over 100 root-level specification markdown files
  (`AFRERA_*_SPECIFICATION.md`, `TISMP_*`, `EVGA_PHASE*`, etc.). A newcomer using
  the README as a map of the repository will not discover most of it.
- **Remediation:** Either update the tree to reflect the real layout, or (better,
  given the volume of legacy specs) add a short "Documentation Map" section
  pointing to `docs/`, `DOCUMENTATION/`, and `docs/OPEN_ITEMS.md` explicitly, and
  note that most root-level `*.md` files are historical/planning artifacts rather
  than current reference docs.

### 7. All 150 per-module READMEs contain a literal escaped `\n` instead of real newlines — LOW
- **Location:** `backend/src/modules/M0**/README.md` (150 of 150 files, e.g. `M100/README.md`)
- **Description:** Confirmed by grepping all module READMEs: every one contains a
  literal backslash-n string, e.g. `M100/README.md`'s entire content is one line:
  `# M100 - M100 Module\n\nAuto-generated module template. Domain: TBD.\n\nFiles:
  controller.js, service.js, routes.js, migrations/3000_M100_generated.sql`. This
  renders as a single unbroken line on GitHub/any Markdown viewer instead of the
  intended multi-paragraph layout — a generator script wrote `\n` as two literal
  characters instead of an actual line break.
- **Remediation:** Fix the generator (likely in `tools/` or a scaffold script) to
  emit real newlines, then regenerate the 150 files.

### 8. Module READMEs disclose 49 stub modules with no top-level index of which — MEDIUM
- **Location:** `backend/src/modules/M0**/README.md` (49 of 150 say `Status: ABSENT`, e.g. `M001/README.md`)
- **Description:** 49 of the 150 module READMEs self-report `Status: ABSENT`
  ("This folder contains backend scaffolding for the module. Add controllers,
  services, routes, and SQL models as needed.") — i.e., no real implementation.
  `docs/OPEN_ITEMS.md` corroborates this at the domain level (item 3: "ERP domains
  with no module: AF-CO, AF-AA, AF-PS"). However there is no top-level document
  (README, docs/, or otherwise) that lists which of the 150 modules are real vs.
  stub — a reader has to open all 150 READMEs individually to find out. For a
  "launch level" pass this matters because the root README's feature list (GI
  Marketplace, Financial Services, ERP Integration, etc.) reads as if these are
  uniformly delivered.
- **Remediation:** Generate a single status table (module ID, domain, status) from
  the existing README `Status:` lines — the data already exists, it just isn't
  aggregated anywhere.

### 9. `afrera/` is an entire second, unrelated-looking "AFRERA platform" doc tree with unfilled placeholders — MEDIUM
- **Location:** `afrera/README.md` and its 11 sub-package READMEs (`afrera-web`, `afrera-app`, `afrera-desktop`, `afrera-mobile`, `afrera-api`, `afrera-ai`, `afrera-docs`, `afrera-infrastructure`, `afrera-devops`, `afrera-design-system`, `afrera-platform`)
- **Description:** `afrera/README.md` describes a full separate platform ("public
  website, enterprise web application, desktop application, and mobile
  application") with its own getting-started instructions, including an unfilled
  placeholder clone URL: `git clone https://github.com/yourusername/afrera.git`.
  The root `README.md` never mentions the `afrera/` directory or explains its
  relationship to the actual `backend/`+`frontend/` application it documents (same
  product name, apparently different/aspirational scaffold). This is confusing for
  onboarding and for anyone assessing what is actually shippable.
- **Remediation:** Add a note to the root README clarifying whether `afrera/` is
  legacy, aspirational scaffolding, or a parallel initiative, and fix the
  placeholder GitHub URL if the sub-tree is kept.

### 10. Root README's database section understates the real schema surface — LOW/MEDIUM
- **Location:** `README.md` line 270 ("See `backend/src/database/schema.sql` for complete schema.")
- **Description:** `backend/src/database/` actually contains 31 `*.sql` files
  (`schema.sql` plus 30 domain-specific schema files: `ai_copilot_schema.sql`,
  `blockchain_traceability_schema.sql`, `gst_schema.sql`,
  `food_safety_schema.sql`, `engineering_schema.sql`, etc.), applied via
  `migrate.js`. Calling `schema.sql` alone "the complete schema" understates where
  most of the domain-specific tables actually live and will send a reader looking
  in the wrong single file.
- **Remediation:** Update the line to point at `backend/src/database/*.sql` (or
  `migrate.js`, which enumerates the real apply order) rather than a single file.

### 11. `docs/OPEN_ITEMS.md` — the most important gap register in the repo — isn't linked from the README — LOW
- **Location:** `README.md` (no reference to `docs/OPEN_ITEMS.md`)
- **Description:** `docs/OPEN_ITEMS.md` is dated 2026-08-04 and is a genuinely
  current, honest account of what's left before launch: 44 modules with
  unguarded multi-statement writes, frontend has "0 ARIA, 0 error boundaries"
  across 71 components, 92 unported v43 routes, DPI integrations (ONDC, Aadhaar,
  DigiLocker, Agmarknet, IMD, ISRO) "all zero," and more. None of this is
  discoverable from the root README, which instead presents a "Roadmap" section
  with only high-level, optimistic phase markers (✅/🔄/⏳) that don't surface
  these specifics.
- **Remediation:** Link `docs/OPEN_ITEMS.md` from the README's Roadmap or a new
  "Known Issues" section so it isn't only found by browsing `docs/`.

## Metrics

| Metric | Value |
|---|---|
| Root-level README/doc files reviewed directly | README.md, README-DESKTOP.md, docs/OPEN_ITEMS.md, backend/.env.example, backend/_removed_2026-08-04/README.md, afrera/README.md |
| Module READMEs scanned | 150 / 150 (`backend/src/modules/M0**/README.md`) |
| Module READMEs with literal `\n` corruption | 150 / 150 |
| Module READMEs self-reporting `Status: ABSENT` | 49 / 150 |
| Backend `.env.example` variables (generated from code scan) | ~40 across 8 sections |
| Of those, covered by root README's setup walkthrough | ~12 (missing OAuth, Twilio, ERP, secrets/security vars) |
| Env vars in README not found anywhere in backend code | 1 (`ANTHROPIC_API_KEY`) |
| `frontend/.env.example` present | No (0 files) |
| `openapi.json` declared paths | 567 (generator script exists at `backend/scripts/generate-openapi.js` but is not wired into `package.json` scripts or CI, so drift is not automatically caught) |
| `backend/src/database/*.sql` schema files vs. README's "the schema" reference | 31 files vs. 1 referenced |
| CI workflow doc/config contradictions found | 1 (`docs/OPEN_ITEMS.md` vs `.github/workflows/ci.yml` re: `validate-resolution-rules.js`) |
| Findings total | 11 (1 high, 6 medium, 4 low) |
