---
agent: dep-auditor
status: fail
findings: 21
---

# Dependency Audit — EBDESIGN / AFRERA Platform

## Summary

Two Node.js projects were audited: `backend/` (Express microservices monolith) and `frontend/` (React/Vite SPA). `npm audit --json` was run for real against installed `node_modules` in both projects. `npm outdated --json` was also run for real in both. Unused-dependency claims were verified by grepping `require(...)`/`from '...'` of each declared package across `backend/src` and `frontend/src` (not inferred from a prior report).

**Vulnerabilities (real `npm audit` data):**
- Backend: **22** vulnerabilities (3 critical, 2 high, 17 moderate) across 1,123 resolved packages.
- Frontend: **14** vulnerabilities (5 critical, 1 high, 8 moderate) across 1,048 resolved packages.

**Progress since the last audit:** `@tensorflow/tfjs-node` and the deprecated `crypto` shim package have both been removed from `backend/package.json` — this closed the single largest vulnerability cluster from the prior audit (the `tar`/`adm-zip` chain) and the shadowed-package hygiene issue. Good cleanup; no regression found there.

**New/still-open issues found this pass:**
- A **new critical cluster** now affects both projects: `jest-coverage-badges` → `mkdirp` → `minimist` (prototype pollution, CVSS 9.8, GHSA-xvch-5gv4-984h). This wasn't flagged last audit and has no non-major fix.
- The **frontend `vitest`/`@vitest/ui` critical (arbitrary file read/execute)** flagged last audit is still unresolved — versions in `package.json` are unchanged (`^1.0.4`, now resolving to installed `1.6.1`).
- The **`express-graphql` boot-crash bug** flagged last audit is still present and unresolved. It has, however, been *documented* in-line (`backend/src/index.js:1218-1221` now carries a comment explicitly stating the branch would throw `MODULE_NOT_FOUND` if `ENABLE_GRAPHQL=true`) — so it's a known, accepted landmine rather than a silent one. It is still not fixed.
- **Correction to prior audit:** `node-cron` and `graphql` were previously reported as unused backend dependencies. Both are actually used: `node-cron` in `backend/src/services/backupService.js` (and its `legacy/` twin), and `graphql` in `backend/src/graphql/schema.js` (which does exist, contradicting the in-code comment that claims "no schema file exists under src/graphql/"). Do not remove these two.
- **Correction to prior audit:** frontend `react-hook-form`, `@hookform/resolvers`, and `zod` were previously reported as an unused "matched set." They are now wired up together in `frontend/src/components/forms/EnhancedFormValidator.jsx` — no longer unused.
- **New frontend finding:** `@tailwindcss/postcss` (Tailwind v4's PostCSS plugin) is declared as a runtime dependency but `frontend/postcss.config.cjs` still uses the plain `tailwindcss` v3-style plugin entry, and `tailwindcss` itself is pinned to `^3.4.19` in devDependencies. The v4 plugin is installed but never wired in — dead weight, and evidence of a half-finished Tailwind v3→v4 migration.
- Four Radix UI packages (`@radix-ui/react-dropdown-menu`, `-popover`, `-toast`, `-tooltip`) remain declared but are never imported anywhere in `frontend/src` — same as last audit, unchanged.

Audit only — no `package.json` edits, no `npm audit fix`, no installs beyond the read-only `npm audit`/`npm outdated` invocations themselves were performed.

---

## Findings

### Critical

**F1 — `jest-coverage-badges` → `mkdirp` → `minimist` prototype pollution (backend AND frontend, CVSS 9.8)**
- Location: `backend/package.json` devDependencies and `frontend/package.json` devDependencies — both declare `jest-coverage-badges: ^1.1.2`
- Description: `npm audit` reports `jest-coverage-badges` pulls a vulnerable `mkdirp` (`0.4.1-0.5.1`) which pulls a vulnerable `minimist` (`<=0.2.3`), flagged critical for prototype pollution ([GHSA-xvch-5gv4-984h](https://github.com/advisories/GHSA-xvch-5gv4-984h), CVSS 9.8) with a secondary moderate advisory on the same package ([GHSA-vh95-rmgr-6w4m](https://github.com/advisories/GHSA-vh95-rmgr-6w4m)). This is a dev-only dependency (coverage badge generation), so it is not part of the runtime attack surface, but it is a critical finding in both audits and `npm audit` reports **no non-major fix** (`fixAvailable` points to `jest-coverage-badges@1.0.0`, an older major, not a real fix).
- Remediation: `jest-coverage-badges` has not been meaningfully maintained; consider replacing it with a maintained coverage-badge action (e.g. a GitHub Action or `istanbul-badges-readme`) or removing it if coverage badges aren't actually being generated/published anywhere. Verify with `grep -r jest-coverage-badges` in CI/npm scripts — it's declared but not invoked by any `package.json` script in either project, i.e. it may not even be running today.

**F2 — `vitest`/`@vitest/ui` arbitrary file read/execute — still unresolved (frontend, CVSS 9.8)**
- Location: `frontend/package.json` devDependencies — `vitest: ^1.0.4` (installed `1.6.1`), `@vitest/ui: ^1.0.4` (installed `1.6.1`)
- Description: Unchanged from last audit. [GHSA-5xrq-8626-4rwp](https://github.com/advisories/GHSA-5xrq-8626-4rwp) — when the Vitest UI server is listening, an attacker can read and execute arbitrary files. `npm audit`'s suggested fix is `vitest@5.0.0`/`@vitest/ui@5.0.0` (semver-major).
- Remediation: Upgrade to `vitest@^5` / `@vitest/ui@^5` (major bump — will require re-validating the vite/vitest config, since `vite` itself is also several majors behind, see F5).

### High

**F3 — `sharp` high-severity libvips CVEs (backend, unused, unchanged)**
- Location: `backend/package.json` — `sharp: ^0.33.1` (installed `0.33.5`)
- Description: [GHSA-f88m-g3jw-g9cj](https://github.com/advisories/GHSA-f88m-g3jw-g9cj) (CVE-2026-33327/33328/35590/35591), `sharp <0.35.0`. Confirmed via grep: zero `require('sharp')` call sites in `backend/src` — a comment in `backend/src/core/aiOrchestrator.js:425` references sharp only in prose, not as an actual call.
- Remediation: Remove the unused dependency (see F13), or bump to `^0.35.4`+ if image processing via sharp is genuinely planned.

**F4 — `nodemailer` high-severity SSRF/ReDoS (backend, unused, unchanged)**
- Location: `backend/package.json` — `nodemailer: ^6.9.7` (installed `6.10.1`)
- Description: `npm audit` lists 8 advisories, including two high-severity: SSRF/arbitrary file read via the message-level `raw` option ([GHSA-p6gq-j5cr-w38f](https://github.com/advisories/GHSA-p6gq-j5cr-w38f)) and ReDoS in `addressparser` ([GHSA-rcmh-qjqh-p98v](https://github.com/advisories/GHSA-rcmh-qjqh-p98v)). Confirmed via grep: `nodemailer` is referenced only inside `jest.mock('nodemailer')` in `backend/src/tests/setup.js` / `setup.ts` — never actually `require()`'d by application code.
- Remediation: Remove (see F13). Fix target if reintroduced for real use: `^10.0.1`.

**F5 — `vite` path-traversal / `server.fs.deny` bypass (frontend, unresolved)**
- Location: `frontend/package.json` devDependencies — `vite: ^5.0.8` (installed `5.4.21`)
- Description: Unchanged from last audit. [GHSA-fx2h-pf6j-xcff](https://github.com/advisories/GHSA-fx2h-pf6j-xcff) (high, `server.fs.deny` bypass on Windows — directly relevant since this repo is developed on Windows), plus a moderate `.map` path-traversal and a moderate `launch-editor` NTLMv2 hash disclosure on Windows UNC paths. Effects propagate to `vite-node`/`vitest`.
- Remediation: Upgrade to `vite@^8` (npm's suggested fix target) alongside the vitest major bump in F2 — both touch the same dev-server toolchain, do them together.

### Moderate

**F6 — `react-router`/`react-router-dom` open-redirect & SSR hydration issues (frontend, unresolved, non-major fix available)**
- Location: `frontend/package.json` — `react-router-dom: ^6.20.0` (installed `6.30.4`)
- Description: Unchanged from last audit. [GHSA-jjmj-jmhj-qwj2](https://github.com/advisories/GHSA-jjmj-jmhj-qwj2) (open redirect → XSS, CVSS 6.9) and [GHSA-wrjc-x8rr-h8h6](https://github.com/advisories/GHSA-wrjc-x8rr-h8h6) (backslash-based open-redirect bypass). `fixAvailable: true` — npm reports a **non-major** patch fix exists this time (previous audit run showed a possible major).
- Remediation: `npm update react-router-dom react-router` in frontend — should be a safe, non-breaking patch/minor bump per npm's own resolution.

**F7 — `esbuild` moderate dev-server request forgery (frontend, transitive via vite)**
- Location: transitive, via `vite`
- Description: [GHSA-67mh-4wv8-2f99](https://github.com/advisories/GHSA-67mh-4wv8-2f99). Resolved by the same `vite` major bump in F5.

**F8 — `@xmldom/xmldom` XML fragment injection (frontend, transitive, new)**
- Location: transitive dependency, `node_modules/@xmldom/xmldom` (0.9.0–0.9.11)
- Description: New finding not present in the prior audit — [GHSA-6gmq-8vp8-gcm6](https://github.com/advisories/GHSA-6gmq-8vp8-gcm6), XML fragment injection via invalid `EntityReference.nodeName`. `fixAvailable: true` (non-major).
- Remediation: `npm update @xmldom/xmldom` in frontend, or let it resolve automatically once its parent (likely a Capacitor/Android tooling dependency) is updated.

**F9 — `@capacitor/cli` → `xcode` → `uuid` moderate chain (frontend, new since Capacitor was added)**
- Location: `frontend/package.json` — `@capacitor/cli: ^8.5.0` (installed `8.5.0`, a vulnerable nightly-adjacent range per audit)
- Description: New finding — `@capacitor/cli` pulls `xcode`, which pulls a vulnerable `uuid <11.1.1` ([GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq)). This is Capacitor's iOS/Android tooling, not shipped to the browser bundle, so real-world exploitability is limited to the dev/build machine.
- Remediation: `npm update @capacitor/cli @capacitor/android @capacitor/core` to `8.5.1`/latest patch (already flagged as outdated in F17) — npm reports a semver-major fix target (`8.4.3`, oddly *older* than the pinned `8.5.0` — likely an npm audit resolution quirk from the pre-release ranges in the advisory; verify manually before blindly following npm's suggested version).

**F10 — `firebase-admin`/`@google-cloud/*` moderate SSRF/`uuid` chain (backend, unused, unchanged)**
- Location: `backend/package.json` — `firebase-admin: ^12.0.0` (installed `12.7.0`)
- Description: Unchanged from last audit — pulls `@google-cloud/firestore`, `@google-cloud/storage`, `google-gax`, `retry-request`, `teeny-request`, all flagged moderate via a vulnerable `uuid <11.1.1`. Confirmed via grep: only referenced in `jest.mock('firebase-admin')` in test setup, never required by application code.
- Remediation: Remove (see F13) — eliminates 6 of the backend's 17 moderate findings in one edit.

**F11 — `aws-sdk` v2 / `bull` / `exceljs` moderate `uuid` chain (backend, unused, unchanged)**
- Location: `backend/package.json` — `aws-sdk: ^2.1500.0`, `bull: ^4.12.0`, `exceljs: ^4.4.0`
- Description: All three pull a vulnerable `uuid <11.1.1`. Confirmed via grep: zero `require('bull')` or `require('exceljs')` matches anywhere in `backend/src`; `aws-sdk` is referenced only inside `jest.mock('aws-sdk')` in test setup. The real S3 client path uses the modular `@aws-sdk/client-s3` (confirmed in use, e.g. `backend/src/database/backup/backup_manager.js`), so `aws-sdk` v2 is fully redundant with the already-present v3 client.
- Remediation: Remove all three (see F13).

**F12 — `apollo-server-express`/`apollo-server-core` moderate XS-Search bypass (backend, unused, unchanged, no fix available)**
- Location: `backend/package.json` — `apollo-server-express: ^3.12.1`
- Description: [GHSA-9q82-xgwf-vj6h](https://github.com/advisories/GHSA-9q82-xgwf-vj6h). `fixAvailable: false` — the Apollo Server 3.x line is EOL, no patched 3.x release exists. Confirmed via grep: zero usage in `backend/src`. Note: unlike the previous audit's assumption, `graphql` itself **is** used (by `backend/src/graphql/schema.js`, feeding the still-broken `express-graphql` mount — see F14), so don't remove `graphql`, only `apollo-server-express`/`apollo-server-core`.
- Remediation: Remove `apollo-server-express`. This is a separate, dead GraphQL implementation from the one `index.js` actually tries to mount.

### Bug (dependency-integrity issue, not a CVE)

**F13 — Missing dependency: `express-graphql` still required-but-undeclared (backend, unresolved from last audit)**
- Location: `backend/src/index.js:1218-1226`
```js
// GraphQL endpoint — disabled by default (ENABLE_GRAPHQL unset). Never actually
// built: no schema file exists under src/graphql/ and express-graphql isn't in
// package.json, so this throws MODULE_NOT_FOUND if ever enabled. Left as a
// clearly-failing stub rather than silently no-op-ing.
if (process.env.ENABLE_GRAPHQL === 'true') {
  const { graphqlHTTP } = require('express-graphql');
  const schema = require('./graphql/schema');
  ...
```
- Description: Confirmed `express-graphql` is still not in `backend/package.json` and not present in `backend/node_modules`. The in-code comment claiming "no schema file exists under `src/graphql/`" is now **stale/inaccurate** — `backend/src/graphql/schema.js` does exist (a minimal `GraphQLSchema` with a single `health` query field) and would load fine; it's specifically the `express-graphql` package that's missing. So the actual failure mode is narrower than the comment states, but the crash-on-enable behavior is unchanged: flipping `ENABLE_GRAPHQL=true` in any environment throws `MODULE_NOT_FOUND` at boot. No occurrence of `ENABLE_GRAPHQL=true` was found in tracked env/config files in this repo, but that doesn't protect against someone setting it in a deployment platform's env panel.
- Remediation: Either add `express-graphql` to `package.json` (note: unmaintained upstream — `graphql-http` is the modern replacement) and update the misleading comment, or delete the dead `ENABLE_GRAPHQL` branch, `backend/src/graphql/schema.js`, and the `graphql`/`apollo-server-express` dependencies together if GraphQL isn't actually planned for this platform.

### Unused Dependencies

**F14 — Backend: 12 declared `dependencies` never imported in `backend/src`**
- Location: `backend/package.json`
- Description: Verified via `grep -rE "require\(['\"]<pkg>['\"]\)"` for every declared dependency (not inherited from the prior audit's list — re-verified fresh, and corrected: `node-cron` and `graphql` are now confirmed **used**, removed from this list).
  - Confirmed unused: `apollo-server-express`, `amqplib`, `elasticsearch`, `aws-sdk`, `multer`, `sharp`, `exceljs`, `nodemailer`, `bull`, `firebase-admin`, `passport`, `passport-jwt`, `passport-oauth2`, `express-validator` (14 packages; the two prior false positives on "passport" text were a comment match on the word "passport" inside `digitalProductPassportService`-adjacent code, not the passport library).
  - `aws-sdk`, `nodemailer`, `firebase-admin` are referenced only inside `jest.mock(...)` in `src/tests/setup.js`/`setup.ts` — mocking a module the app never actually requires.
- Remediation: Remove these 14 packages after confirming with the team they aren't near-term placeholders. This closes F3, F4, F10, F11, F12 for free.

**F15 — Frontend: 4 declared `dependencies` never imported in `frontend/src`, plus 1 mis-wired**
- Location: `frontend/package.json`
- Description: Re-verified fresh via grep against `frontend/src`, including checking `src/components/ui/` wrapper components (which exist and import `@radix-ui/react-dialog`, `-label`, `-select`, `-slot`, `-tabs` — confirmed used).
  - Confirmed unused (zero imports anywhere in `frontend/src`): `@radix-ui/react-dropdown-menu`, `@radix-ui/react-popover`, `@radix-ui/react-toast`, `@radix-ui/react-tooltip`, `date-fns`.
  - **Correction to prior audit:** `react-hook-form`, `@hookform/resolvers`, `zod` are **no longer unused** — all three are imported together in `frontend/src/components/forms/EnhancedFormValidator.jsx`. Do not remove.
  - `@tailwindcss/postcss` (new finding, see Summary) is installed but not referenced by `postcss.config.cjs`, which still configures the plain v3-style `tailwindcss` plugin — effectively unused and evidence of an incomplete Tailwind v3→v4 migration attempt.
- Remediation: Remove the 4 unused Radix packages and `date-fns` (5 packages) if no near-term UI work needs them. For `@tailwindcss/postcss`: either finish the Tailwind v4 migration (swap `postcss.config.cjs` to use `@tailwindcss/postcss` and bump `tailwindcss` to `^4`) or remove the v4 plugin package and stay on v3 — pick one, the current half-state provides no benefit.

### Outdated Majors

**F16 — Backend: direct deps one+ major behind current upstream**
- `@anthropic-ai/sdk ^0.27.0` → latest `0.124.0` (large gap; worth checking for breaking API changes given this is the core AI SDK per `CLAUDE.md`'s Claude AI coordinator).
- `express ^4.18.2` → Express 5 is current stable major.
- `helmet ^7.0.0` → current major is 8.x.
- `ioredis ^5.3.2` → current major is 6.x.
- `mongodb ^6.3.0` → current major is 7.x.
- `express-rate-limit ^7.1.5` → current major is 8.x.
- `joi ^17.11.0` → current major is 18.x.
- `bcryptjs ^2.4.3` → current major is 3.x.
- `dotenv ^16.3.1` → current major is 17.x.
- `eslint ^8.56.0` (dev) → current major is 10.x.
- `typescript ^5.3.3` (dev) → current major is 7.x.
- `jest ^29.7.0` (dev) → current major is 30.x.
- `sharp ^0.33.1` → 0.35.x current (unused anyway, F14).
- `firebase-admin ^12.0.0` → 14.x current (unused anyway, F14).
- `nodemailer ^6.9.7` → 10.x current (unused anyway, F14).
- `node-cron ^3.0.3` → 4.x current (used — see F14 correction, worth a real upgrade here since it's live in `backupService.js`).
- `multer ^1.4.5-lts.1` → 2.x current (unused anyway, F14).
- `elasticsearch ^16.7.3` → package itself deprecated by Elastic since 2020 in favor of `@elastic/elasticsearch` (unused anyway, F14).
- `aws-sdk ^2.1500.0` → v2 deprecated/maintenance-mode, AWS recommends v3 (unused anyway, F14, and redundant with already-present `@aws-sdk/client-s3`).

**F17 — Frontend: direct deps one+ major behind current upstream**
- `react ^18.2.0` / `react-dom ^18.2.0` → React 19 current.
- `react-router-dom ^6.20.0` → React Router 7 current (also vulnerable, F6).
- `vite ^5.0.8` (dev) → current major 8.x (also vulnerable, F5).
- `vitest ^1.0.4` / `@vitest/ui ^1.0.4` (dev) → current major 5.x (also critically vulnerable, F2).
- `eslint ^8.55.0` (dev) → current major 10.x.
- `tailwindcss ^3.3.6` (dev) → current major 4.x (see F15 — half-migrated already).
- `zustand ^4.4.7` → current major 5.x.
- `@tauri-apps/cli ^1.5.0` (dev) → current major 2.x (installed `1.6.3`) — worth checking whether this is still a live build target alongside the newly-added Capacitor tooling, since the project now appears to be running two different native-shell strategies (Tauri desktop + Capacitor Android) side by side.
- `@capacitor/android`/`@capacitor/cli`/`@capacitor/core ^8.5.0` → `8.5.1` patch available now, and each pulls the moderate `uuid` chain in F9.
- `jsdom ^23.0.1` (dev) → current major considerably higher (30.x).
- `zod ^3.22.4` → current major 4.x (now confirmed in active use per F15 correction — this upgrade matters more than previously thought).
- `lucide-react ^0.294.0` → current major line is 1.x.
- `recharts ^2.10.3` → current major 3.x.
- `@tanstack/react-query ^5.0.0` → up to date on major (5.101.4 installed, 5.102.8 latest — just a patch behind).
- `@hookform/resolvers ^3.3.2` → current major 5.x (now confirmed in active use per F15 correction).

---

## Metrics

| Metric | Backend | Frontend |
|---|---|---|
| `npm audit` executed | Yes (real, against installed `node_modules`) | Yes (real, against installed `node_modules`) |
| `npm outdated` executed | Yes (real) | Yes (real) |
| Total resolved packages | 1,123 (618 prod / 421 dev / 86 optional) | 1,048 (277 prod / 749 dev / 95 optional / 1 peer) |
| Vulnerabilities — critical | 3 | 5 |
| Vulnerabilities — high | 2 | 1 |
| Vulnerabilities — moderate | 17 | 8 |
| Vulnerabilities — low | 0 | 0 |
| **Total vulnerabilities** | **22** | **14** |
| Declared direct dependencies | 34 (deps) + 9 (devDeps) = 43 | 24 (deps) + 20 (devDeps) = 44 |
| Confirmed unused direct dependencies | 14 | 5 (4 Radix packages + `date-fns`; `@tailwindcss/postcss` counted separately as mis-wired, not simply unused) |
| Missing/undeclared runtime dependency (boot-crash risk) | 1 (`express-graphql`, unresolved from last audit) | 0 |
| Direct deps one+ major behind current upstream | 18 | 15 |
| Findings resolved since last audit | 2 (`@tensorflow/tfjs-node` removed, `crypto` shim removed) | 0 |
| New findings vs. last audit | 1 (`jest-coverage-badges`/`minimist` critical, shared with frontend) | 4 (`jest-coverage-badges`/`minimist`, `@xmldom/xmldom`, `@capacitor/cli`→`xcode`→`uuid`, `@tailwindcss/postcss` dead weight) |
| Prior-audit findings corrected (false positives removed) | 2 (`node-cron`, `graphql` are actually used) | 1 (`react-hook-form`/`@hookform/resolvers`/`zod` are actually used) |

**Total findings this audit: 21** (2 critical clusters, 3 high clusters, 7 moderate clusters, 1 missing-dependency boot-crash bug, 2 unused-dependency findings covering 19 packages, 2 outdated-major findings covering 33 packages, plus corrections noted inline).

**Overall status: fail** — two independent critical-severity vulnerability clusters are present (`vitest` arbitrary file read/execute, unresolved from last audit; `jest-coverage-badges`→`minimist` prototype pollution, new this audit), plus a still-unfixed boot-crash bug (`express-graphql`) carried over from the previous audit with no remediation applied in the interim. The `@tensorflow/tfjs-node`/`crypto` cleanup is genuine progress but not enough to change the overall verdict.
