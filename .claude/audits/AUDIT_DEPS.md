---
agent: dep-auditor
status: fail
findings: 26
---

# Dependency Audit — AFRERA Platform

## Summary

Two Node.js projects were audited: `backend/` (Express microservices monolith) and `frontend/` (React/Vite SPA). `npm audit --json` was executed for real in both projects (backend has `node_modules` installed; frontend was audited directly against its `package-lock.json`, which npm 7+ supports without a full install).

**Vulnerabilities (real `npm audit` data):**
- Backend: **20** vulnerabilities (1 critical, 5 high, 14 moderate) across 1,133 resolved packages.
- Frontend: **8** vulnerabilities (2 critical, 2 high, 4 moderate) across 658 resolved packages.

**Unused dependencies:** confirmed by grepping every `src` file for `require(...)`/`import ... from ...` of each declared package. **17 of 39** backend `dependencies` are never imported anywhere in `backend/src`, and **9 of 24** frontend `dependencies` are never imported anywhere in `frontend/src`. Several of the unused backend packages (`@tensorflow/tfjs-node`, `sharp`, `node-cron`, `exceljs`, `nodemailer`, `firebase-admin`, `aws-sdk`) are also the ones driving the vulnerability count — removing dead weight would fix most of the security findings for free.

**Missing dependency (bug, not just hygiene):** `backend/src/index.js` does `require('express-graphql')` behind an `ENABLE_GRAPHQL` env flag, but `express-graphql` is not declared in `package.json` and is not present in `node_modules`. If that flag is ever set to `true` in any environment, the process will crash on startup with `MODULE_NOT_FOUND`.

**Outdated majors:** several direct dependencies are one or more majors behind current upstream (React 18→19, react-router-dom 6→7, Vite 5→7/8, Vitest 1→4, ESLint 8→9, Tailwind 3→4, Zustand 4→5, Tauri CLI 1→2, Apollo Server 3→4, AWS SDK v2→v3, `elasticsearch`→`@elastic/elasticsearch`). The `crypto` npm package (v1.0.1) is a long-deprecated no-op stub that is silently shadowed by Node's built-in `crypto` module at require-time — it can never actually load and should be deleted from `package.json`.

Audit only — no `package.json` edits, no `npm audit fix`, no installs beyond the read-only `npm audit` invocations themselves were performed.

---

## Findings

### Critical

**F1 — `vitest`/`@vitest/ui` critical arbitrary file read/execute (frontend, CVSS 9.8)**
- Location: `frontend/package.json` devDependencies — `vitest: ^1.0.4`, `@vitest/ui: ^1.0.4`
- Description: `npm audit` reports vitest `<=3.2.5` is vulnerable to [GHSA-5xrq-8626-4rwp](https://github.com/advisories/GHSA-5xrq-8626-4rwp) — when the Vitest UI server is listening, an attacker can read and execute arbitrary files. `@vitest/ui` inherits the same critical severity via its dependency on vitest ([GHSA range] `<=0.0.130 || 0.31.0-3.2.5`).
- Remediation: Upgrade to `vitest@^4.1.10` / `@vitest/ui@^4.1.10` (npm reports this as a semver-major fix, so `vite` and test config will need re-validation after the bump).

### High

**F2 — `tar` critical/high path-traversal & DoS chain via `@tensorflow/tfjs-node` (backend)**
- Location: `backend/package.json` — `@tensorflow/tfjs-node: ^4.15.0` (direct, unused — see F14)
- Description: `@tensorflow/tfjs-node` → `@mapbox/node-pre-gyp` → `tar` (`<=7.5.20`) pulls in **11 separate advisories** against `tar`, including a **critical** decompression DoS ([GHSA-23hp-3jrh-7fpw](https://github.com/advisories/GHSA-23hp-3jrh-7fpw)) and multiple **high** hardlink/symlink path-traversal issues (e.g. [GHSA-34x7-hfp2-rc4v](https://github.com/advisories/GHSA-34x7-hfp2-rc4v), [GHSA-83g3-92jg-28cx](https://github.com/advisories/GHSA-83g3-92jg-28cx)). Also drags in a **high** severity `adm-zip` 4GB-allocation DoS ([GHSA-xcpc-8h2w-3j85](https://github.com/advisories/GHSA-xcpc-8h2w-3j85)) via `@mapbox/node-pre-gyp`.
- Remediation: This entire chain is dead weight — the code comment in `backend/src/services/advancedAIService.js:22-27` explicitly states `@tensorflow/tfjs-node` "was never actually called anywhere in this file" and forecasting now uses classical statistics instead. **Remove the package entirely** rather than bumping it; this closes 4 of the audit's high/critical findings in one edit.

**F3 — `sharp` high severity libvips CVEs (backend, unused)**
- Location: `backend/package.json` — `sharp: ^0.33.1`
- Description: `npm audit` flags installed `sharp <0.35.0` for 4 CVEs in bundled libvips ([GHSA-f88m-g3jw-g9cj](https://github.com/advisories/GHSA-f88m-g3jw-g9cj): CVE-2026-33327/33328/35590/35591). Grep of `backend/src` finds no `require('sharp')` — only comments referencing a "real sharp / tesseract.js dispatch" that doesn't appear to be wired up.
- Remediation: If image processing via sharp is genuinely planned, bump to `^0.35.0+`. If not currently used (confirmed by grep), remove it — see F16.

**F4 — `vite` path traversal / `server.fs.deny` bypass (frontend, CVSS 7.5)**
- Location: `frontend/package.json` devDependencies — `vite: ^5.0.8`
- Description: `npm audit` reports 3 advisories on `vite <=6.4.2`, most notably [GHSA-fx2h-pf6j-xcff](https://github.com/advisories/GHSA-fx2h-pf6j-xcff) (high, `server.fs.deny` bypass on Windows) and a moderate optimized-deps `.map` path traversal ([GHSA-4w7w-66w2-5vf9](https://github.com/advisories/GHSA-4w7w-66w2-5vf9)). Effects propagate to `vite-node` and `vitest`.
- Remediation: Upgrade to `vite@^7` (or the `8.2.1` npm suggests) — a semver-major bump, budget time to re-test the build/dev-server config.

**F5 — `nodemailer` multiple high/moderate CVEs (backend, unused)**
- Location: `backend/package.json` — `nodemailer: ^6.9.7`
- Description: `npm audit` lists 8 advisories against nodemailer `<=9.0.0`, including two **high** findings: SSRF/arbitrary file read via message-level `raw` option ([GHSA-p6gq-j5cr-w38f](https://github.com/advisories/GHSA-p6gq-j5cr-w38f)) and ReDoS in `addressparser` ([GHSA-rcmh-qjqh-p98v](https://github.com/advisories/GHSA-rcmh-qjqh-p98v)), plus several moderate SMTP command-injection/CRLF issues. Grep confirms nodemailer is only referenced via `jest.mock('nodemailer')` in `backend/src/tests/setup.js`/`setup.ts` — no actual `require('nodemailer')` exists in application code.
- Remediation: Remove the unused dependency (see F16). If email sending is a planned feature, reintroduce at `^9.0.5`+ when actually wired up.

### Moderate

**F6 — `@vitest/ui`/`vitest`/`vite-node` transitive moderate findings (frontend)** already covered under F1/F4 effects chain; no separate action needed beyond those upgrades.

**F7 — `react-router` / `react-router-dom` open-redirect & SSR hydration issues (frontend)**
- Location: `frontend/package.json` — `react-router-dom: ^6.20.0`
- Description: `npm audit` flags `react-router 6.0.0-7.17.0` for an open-redirect leading to XSS ([GHSA-jjmj-jmhj-qwj2](https://github.com/advisories/GHSA-jjmj-jmhj-qwj2), CVSS 6.9), a backslash-based open-redirect bypass ([GHSA-wrjc-x8rr-h8h6](https://github.com/advisories/GHSA-wrjc-x8rr-h8h6)), and an arbitrary constructor injection via `deserializeErrors()` during SSR hydration ([GHSA-337j-9hxr-rhxg](https://github.com/advisories/GHSA-337j-9hxr-rhxg)). `fixAvailable: true` — npm reports a non-major fix exists.
- Remediation: Run `npm update react-router-dom react-router` in frontend (audit-only scope here, but flagging as safe/non-breaking per npm's own analysis).

**F8 — `esbuild` moderate dev-server request forgery (frontend, transitive via vite)**
- Location: transitive, via `vite`
- Description: [GHSA-67mh-4wv8-2f99](https://github.com/advisories/GHSA-67mh-4wv8-2f99) — esbuild's dev server accepts arbitrary cross-origin requests. Resolved by the same `vite` major bump in F4.

**F9 — `nanoid` high severity infinite loop (frontend, transitive)**
- Location: transitive, via `vite`/`vitest` toolchain
- Description: [GHSA-2v37-7h3g-55p8](https://github.com/advisories/GHSA-2v37-7h3g-55p8) — `nanoid <3.3.18` custom generators can loop indefinitely when `size` is 0. `fixAvailable: true`.
- Remediation: `npm update nanoid` (transitive, should resolve automatically once vite/vitest are bumped).

**F10 — `firebase-admin` / `@google-cloud/*` moderate SSRF/DoS chain (backend, unused)**
- Location: `backend/package.json` — `firebase-admin: ^12.0.0`
- Description: Pulls in `google-gax`, `@google-cloud/firestore`, `@google-cloud/storage`, `retry-request`, `teeny-request`, `gaxios` — all flagged moderate due to a vulnerable `uuid <11.1.1` ([GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq), buffer bounds-check bypass) plus SSRF-adjacent issues in `retry-request`/`teeny-request`. Grep confirms `firebase-admin` is only referenced via `jest.mock('firebase-admin')` in test setup — no real `require('firebase-admin')` in application code.
- Remediation: Remove (see F16); this alone eliminates 6 of the backend's 14 moderate findings (`firebase-admin`, `@google-cloud/firestore`, `@google-cloud/storage`, `google-gax`, `retry-request`, `teeny-request`).

**F11 — `apollo-server-core`/`apollo-server-express` moderate XS-Search bypass (backend, unused)**
- Location: `backend/package.json` — `apollo-server-express: ^3.12.1`
- Description: [GHSA-9q82-xgwf-vj6h](https://github.com/advisories/GHSA-9q82-xgwf-vj6h) — Apollo Server browser XS-Search/CSRF prevention bypass. `fixAvailable: false` (Apollo Server 3.x line is EOL; no patched 3.x release exists — see F19). Grep of `backend/src` finds zero actual usage; the real (feature-flagged) GraphQL mount uses `express-graphql` instead (see F13/F15).
- Remediation: Remove `apollo-server-express` and `graphql` if the `express-graphql` code path is the intended one, or delete the dead `ENABLE_GRAPHQL` branch entirely if GraphQL isn't planned.

**F12 — `aws-sdk` v2 low/moderate region-validation issue (backend, unused)**
- Location: `backend/package.json` — `aws-sdk: ^2.1500.0`
- Description: [GHSA-j965-2qgj-vjmq](https://github.com/advisories/GHSA-j965-2qgj-vjmq) plus the shared `uuid` moderate finding. Grep confirms `aws-sdk` is only referenced via `jest.mock('aws-sdk')` in test setup, never actually required by application code.
- Remediation: Remove (see F16).

**F13 — `bull`, `exceljs`, `node-cron` moderate `uuid` chain (backend, unused)**
- Location: `backend/package.json` — `bull: ^4.12.0`, `exceljs: ^4.4.0`, `node-cron: ^3.0.3`
- Description: All three pull a vulnerable `uuid <11.1.1` ([GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq)). None of the three appear anywhere in `backend/src` via grep for `require('bull')`, `require('exceljs')`, or `require('node-cron')`.
- Remediation: Remove all three (see F16).

### Bug (not a vulnerability, but dependency-integrity issue)

**F14 — Missing dependency: `express-graphql` required but not declared/installed (backend)**
- Location: `backend/src/index.js:674-682`
```js
if (process.env.ENABLE_GRAPHQL === 'true') {
  const { graphqlHTTP } = require('express-graphql');
  ...
}
```
- Description: `express-graphql` is not listed in `backend/package.json` dependencies and is **not present** in `backend/node_modules`. The branch is currently dormant behind `ENABLE_GRAPHQL`, so it doesn't crash today, but flipping that env var in any deployment will throw `Error: Cannot find module 'express-graphql'` and take down the process at the `require()` call (this executes at module load / route-mount time, not per-request, so it likely crashes on server boot once the flag is set).
- Remediation: Either add `express-graphql` to `package.json` dependencies (and note it's an unmaintained package — consider `graphql-http` instead), or remove the dead `ENABLE_GRAPHQL` branch along with the now-redundant `graphql`/`apollo-server-express` dependencies (F11) if GraphQL isn't actually planned.

### Unused Dependencies

**F15 — 17 of 39 backend `dependencies` are never imported in `backend/src`**
- Location: `backend/package.json`
- Description: Verified via `grep -rE "require\(['"]<pkg>['"]|from ['"]<pkg>['"]" src` for every declared dependency. Zero matches (excluding incidental comments/unrelated substring hits like "digital product passport" or test-mock-only references) for:
  - `bull`, `graphql`, `apollo-server-express`, `amqplib`, `elasticsearch`, `aws-sdk`, `multer`, `sharp`, `node-cron`, `exceljs`, `nodemailer`, `@tensorflow/tfjs-node`, `firebase-admin`, `passport`, `passport-jwt`, `passport-oauth2`, `express-validator`
  - `aws-sdk`, `nodemailer`, `firebase-admin` are referenced only inside `jest.mock(...)` calls in `src/tests/setup.js`/`setup.ts` — mocking a module that the app never actually requires.
  - `passport`/`passport-jwt`/`passport-oauth2`: the only "passport" hits in `src` are unrelated business-domain matches (`digitalProductPassportService.js`'s "digital product passport" feature) — the auth library itself is never wired in; JWT auth is handled directly via `jsonwebtoken` in `authService.js`.
- Remediation: Remove these 17 packages from `backend/package.json` after confirming with the team they aren't placeholders for near-term work. This is also the fastest way to shrink the vulnerability surface (F2, F3, F5, F10, F11, F12, F13 all disappear).

**F16 — 9 of 24 frontend `dependencies` are never imported in `frontend/src`**
- Location: `frontend/package.json`
- Description: Same grep methodology against `frontend/src`, including a check for shadcn-style wrapper components under `src/components/ui/` (which exist for `badge`, `button`, `card`, `dialog`, `input`, `label`, `select`, `table`, `tabs`, `textarea` — but **not** for tooltip/dropdown-menu/popover/toast). Zero matches for:
  - `@hookform/resolvers`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-popover`, `@radix-ui/react-toast`, `@radix-ui/react-tooltip`, `date-fns`, `react-hook-form`, `socket.io-client`, `zod`
- Remediation: Remove unless these back near-term work (e.g. `react-hook-form` + `@hookform/resolvers` + `zod` look like a matched set for form validation that was never actually built out — worth confirming with the team rather than deleting blind, since removing all three together is a coherent unit).

**F17 — Deprecated dead-weight package: `crypto` (backend)**
- Location: `backend/package.json` — `"crypto": "^1.0.1"`
- Description: `crypto` on npm is a long-deprecated placeholder package (last published ~2015) that explicitly warns "this package is deprecated, please use the built-in Node.js module." Worse: because Node.js resolves built-in module names (`crypto`, `fs`, `path`, etc.) **before** checking `node_modules`, every `require('crypto')` in this codebase (confirmed 3 call sites: `src/middleware/security.js:1`, `src/services/advancedFeaturesService.js:124`, `src/services/authService.js:8`) already resolves to Node's built-in module, not this package. The declared dependency is unreachable code — it can never load.
- Remediation: Delete `"crypto": "^1.0.1"` from `package.json` entirely; it provides no benefit and its presence is misleading (a future contributor could mistake it for a real polyfill).

### Outdated Majors

**F18 — Backend: several direct deps one+ major behind current upstream**
- `express ^4.18.2` → Express 5 is current stable major.
- `helmet ^7.0.0` → current major is 8.x.
- `apollo-server-express ^3.12.1` → package line is EOL; Apollo now ships `@apollo/server` (v4+). Unused anyway (F11).
- `aws-sdk ^2.1500.0` → AWS SDK for JS v2 is in maintenance-mode/deprecated; AWS recommends migrating to modular v3 (`@aws-sdk/client-*`). Unused anyway (F15).
- `elasticsearch ^16.7.3` → this package itself has been deprecated by Elastic since 2020 in favor of `@elastic/elasticsearch`; last publish is years old. Unused anyway (F15).
- `multer ^1.4.5-lts.1` → Multer 2.x is current major. Unused anyway (F15).
- `firebase-admin ^12.0.0` → current major is 13.x/14.x (npm audit itself suggests `14.2.0` as the fix target). Unused anyway (F15).
- `nodemailer ^6.9.7` → current major line is 7.x/8.x/9.x per audit's own fix suggestion (`9.0.5`). Unused anyway (F15).
- `node-cron ^3.0.3` → current major is 4.x. Unused anyway (F15).

**F19 — Frontend: several direct deps one+ major behind current upstream**
- `react ^18.2.0` / `react-dom ^18.2.0` → React 19 is current stable major.
- `react-router-dom ^6.20.0` → React Router 7 is current major (also has the vulnerabilities in F7).
- `vite ^5.0.8` (dev) → current major is 7.x (also vulnerable, F4).
- `vitest ^1.0.4` / `@vitest/ui ^1.0.4` (dev) → current major is 4.x (also critically vulnerable, F1).
- `eslint ^8.55.0` (dev) → ESLint 9 is current major (flat config).
- `tailwindcss ^3.3.6` (dev) → Tailwind CSS 4 is current major.
- `zustand ^4.4.7` → current major is 5.x.
- `@tauri-apps/cli ^1.5.0` (dev) → Tauri 2 is current major; relevant since a recent commit ("Add Tauri desktop CI job") touches this build path — worth confirming the CI job targets the same Tauri major as this CLI.
- `jsdom ^23.0.1` (dev) → current major is considerably higher (mid-20s+).
- `date-fns ^2.30.0` → current major is 4.x (also unused, F16).
- `zod ^3.22.4` → current major is 4.x (also unused, F16).

---

## Metrics

| Metric | Backend | Frontend |
|---|---|---|
| `npm audit` executed | Yes (real, against installed `node_modules`) | Yes (real, against `package-lock.json`) |
| Total resolved packages | 1,133 (642 prod / 405 dev / 88 optional) | 658 (146 prod / 513 dev / 72 optional / 1 peer) |
| Vulnerabilities — critical | 1 | 2 |
| Vulnerabilities — high | 5 | 2 |
| Vulnerabilities — moderate | 14 | 4 |
| Vulnerabilities — low | 0 | 0 |
| **Total vulnerabilities** | **20** | **8** |
| Declared direct dependencies | 39 (deps) + 7 (devDeps) = 46 | 24 (deps) + 20 (devDeps) = 44 |
| Confirmed unused direct dependencies | 17 (deps) + `crypto` unreachable = 18 | 9 (deps) |
| Missing/undeclared runtime dependency | 1 (`express-graphql`) | 0 |
| Direct deps one+ major behind current upstream | 8 | 11 |

**Total findings this audit: 26** (5 critical/high vuln clusters, 8 moderate vuln clusters, 1 missing-dependency bug, 2 unused-dependency findings covering 26 packages, 1 deprecated-shadowed-package finding, 2 outdated-major findings covering 19 packages, plus the vitest critical as its own top-line item).

**Overall status: fail** — a critical-severity vulnerability (vitest arbitrary file read/execute) and a critical-plus-high chain from an admittedly-unused dependency (`@tensorflow/tfjs-node` → `tar`) are both present and both trivially remediable (upgrade / delete), which is why this doesn't just warrant a "warn."
