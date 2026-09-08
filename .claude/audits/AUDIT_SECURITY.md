---
agent: security-auditor
status: fail
findings: 8
---

# Security Audit — OWASP Top 10 Focus (Re-run)

**Date:** 2026-09-08
**Branch:** `audit/ui-api-fix` (HEAD at audit time: `5e2eb01b` + uncommitted working-tree changes from a concurrently-active session — this audit re-ran `git status`/`git diff` immediately before writing findings and audited what was actually on disk, not a cached file list)

Scope: `backend/src` (auth middleware/services, routes, services — with emphasis on files touched since the last audit), root-level `.env*` files, and re-verification of every open item from the prior `AUDIT_SECURITY.md`. This is a **re-run**, not a from-scratch audit — findings already closed are recorded under "Verified Fixed" rather than repeated, per the prior report's own remediation checklist. Every "fixed" claim below was checked against running code (`node -e`, `npx jest`), not just read.

## Summary

The previous audit's punch list is **mostly genuinely closed**: JWT boot-guard (in the file actually mounted), the missing auth-rate-limiter, `trust proxy`, OAuth `state` validation, and the escrow/rural-finance/claim-ownership trio from commit `5e2eb01b` are all real and verified working. A new `backend/src/config/productionConfig.js` boot guard (`assertProductionConfiguration()`, called at `index.js:8`) now fails startup in production if `JWT_SECRET`/`ENCRYPTION_KEY`/`DATABASE_URL` are missing, placeholder, or too short — a solid addition since the last pass.

However, this pass found **two new, concrete, currently-exploitable issues** the previous audit's clean SQL-injection metric ("0 raw string-interpolated queries found") missed, plus confirmation that the H1 JWT-secret fix has a live blind spot the codebase's own regression test already proves is broken:

- **Unauthenticated SQL injection** in the live, mounted product-review listing endpoint (`GET /api/v1/product-reviews/products/:productId`) via the `status` query parameter, string-interpolated into a `COUNT(*)` query.
- **The H1 "hardcoded JWT fallback secret" fix does not cover every path that resolves to it.** `backend/src/services/authService.js` (flat file) still contains the vulnerable `process.env.JWT_SECRET || 'your-super-secret-key-change-in-production'` fallback verbatim, and Node's module resolution means `require('../services/authService')` (used by `services/index.js`, `services/smsAuthService.js`, and indirectly by every `modules/M0XX` service that requires it) resolves to **this vulnerable file**, not the fixed `services/dual-use/authService.js`. Proven empirically: `require.resolve()` confirms the resolution, a direct `require()` with `JWT_SECRET` unset loads with no error, and the codebase's own `backend/src/tests/jwtSecretRequired.test.js` **currently fails 3 of 4 assertions** when actually run.
- **Committed, real-looking hardcoded secrets** in `.env.docker` (tracked in git, not gitignored) — `POSTGRES_PASSWORD`, `REDIS_PASSWORD`, `RABBITMQ_PASSWORD`, `JWT_SECRET`, `ENCRYPTION_KEY` are all set to non-placeholder-looking values (`AfreraSecure2024!...`) rather than the `your_x_here` placeholder pattern used in the sibling `.env.production` files.

## Findings

### 1. [HIGH] Unauthenticated SQL injection in product review listing
**Location:** `backend/src/services/legacy/productReviewService.js:127-133` (`getProductReviews`), reached via `backend/src/routes/productReviewRoutes.js:26-33` (`GET /products/:productId`, **no auth middleware**)
```js
const countQuery = `
  SELECT COUNT(*) as total
  FROM product_reviews
  WHERE product_id = $1
  ${status ? `AND status = '${status}'` : ''}
`;
const countResult = await this.pool.query(countQuery, [productId]);
```
`status` is destructured from `filters` (`getProductReviews(productId, filters = {})`), and `productReviewRoutes.js:28` passes `req.query` directly as `filters` with zero validation and zero auth requirement. An attacker can hit `GET /api/v1/product-reviews/products/1?status=x' UNION SELECT ...--` (or any Postgres injection payload) with no session at all. This is the exact class of bug the previous audit explicitly checked for and reported "0 raw string-interpolated SQL queries found" — this file evidently wasn't in that pass's sample. Note the main `SELECT` query in the same function is correctly parameterized (`$${paramCount}`) two lines above — only the `countQuery`'s copy-pasted status clause was missed when the file was written.
**Remediation:** Parameterize identically to the main query: `WHERE product_id = $1 AND status = $2` with `params = [productId, status]` (conditionally add the clause+param only when `status` is present, mirroring the pattern already used correctly for `rating`/`verified`/`status` a few lines above in the same function). Grep the rest of this file and its former duplicate at `services/commerce/productReviewService.js` (now collapsed to a re-export of this file, per its own header comment — confirmed via `git diff`) for the same copy-pasted pattern before considering this closed.

### 2. [HIGH] H1 JWT-fallback-secret fix does not cover all module-resolution paths to `authService`
**Location:** `backend/src/services/authService.js:28` (still present, unchanged):
```js
secret: process.env.JWT_SECRET || 'your-super-secret-key-change-in-production',
```
vs. the fixed `backend/src/services/dual-use/authService.js:33-37` (throws in production, warns+random-secrets in dev).
**Description:** Both files coexist. `index.js`, `middleware/auth.js`, and the auth test suite (`__tests__/*.test.js`) all correctly use the fully-qualified `require('./services/dual-use/authService')` and are safe. But several other call sites use the **ambiguous** `require('../services/authService')` / `require('./authService')`, which Node resolves to the **file** `services/authService.js` (Node's LOAD_AS_FILE step matches the `.js` file before ever trying the sibling `services/authService/` directory's `index.js`, which is the actually-hardened M11 rewrite). Confirmed three ways:
1. `node -e "console.log(require.resolve('./src/services/authService'))"` → resolves to `services/authService.js`, not `services/authService/index.js`.
2. `node -e "delete process.env.JWT_SECRET; require('./src/services/authService')"` → loads with **no error**, hardcoded fallback active.
3. Running the repo's own regression test, `npx jest src/tests/jwtSecretRequired.test.js`, currently **fails 3 of 4 tests** — including "M012 and M014 modules also refuse to load without JWT_SECRET," which does not throw because those modules (auto-loaded at boot by `index.js:715-723`'s `modules/M0\d{3}` scan) transitively pull in the vulnerable flat file.

Live reachability of the vulnerable file: `services/smsAuthService.js:300,424` and `services/index.js:270` both do `require('./authService')` (ambiguous, resolves to the vulnerable flat file); `modules/M012/service.js` and `modules/M014/service.js` transitively do the same and are `require()`'d unconditionally for every one of the 150 `M0XX` module folders at every server boot (`index.js:716-723`). The flat `services/smsAuthService.js` and `services/index.js` do not currently appear to be `require()`'d themselves from any live route (only their `legacy/` counterparts are, which correctly use `dual-use/authService`), so this is not yet a proven end-to-end unauthenticated bypass of the *live* login flow — but it is a real, provable landmine: any future wiring of M012/M014's own auth-adjacent exports, or of the non-legacy `smsAuthService.js`, silently inherits the pre-fix vulnerable behavior, and the team's own safety net (the regression test) is currently red, not green, so this would not be caught.
**Remediation:** Delete or gut `backend/src/services/authService.js` to `module.exports = require('./dual-use/authService')` (matching what the `services/authService/index.js` directory's own header comment already says is the intended one-source-of-truth pattern), so every ambiguous `require('.../services/authService')` call site — however it's spelled — resolves to the hardened implementation. Re-run `jwtSecretRequired.test.js` and confirm all 4 assertions pass before considering H1 closed.

### 3. [MEDIUM] Hardcoded, non-placeholder-looking secrets committed in `.env.docker`
**Location:** `.env.docker` (repo root) — tracked in git (`git ls-files` confirms), **not** matched by any `.gitignore` rule (`.gitignore` only excludes `.env`, `.env.local`, `.env.*.local`)
```
POSTGRES_PASSWORD=AfreraSecure2024!DB
REDIS_PASSWORD=AfreraSecure2024!Redis
RABBITMQ_PASSWORD=AfreraSecure2024!Rabbit
JWT_SECRET=AfreraSecure2024!JWTSecret
ENCRYPTION_KEY=AfreraSecure2024!EncryptionKey
```
**Description:** Unlike the sibling `backend/.env.production`, `.env.production`, and `frontend/.env.production` (all tracked, but all correctly use `your_production_x_here`-style non-functional placeholders), `.env.docker` ships real-shaped, immediately-usable credentials for Postgres/Redis/RabbitMQ plus the JWT signing secret and the app's AES encryption key. This file is presumably intended only for local `docker-compose` development, but nothing in the repo marks that distinction machine-readably (no `.env.docker.example` naming, no comment saying "local only, never reuse in staging/prod"), and it is permanently in git history now regardless of any future rotation. If this exact compose file / password set was ever copy-pasted into a staging or production `docker-compose.yml` (a very plausible operational shortcut), every one of those services — plus JWT forgery and encrypted-field decryption — would be fully compromised by anyone with read access to the repository (public or not; git history is forever).
**Remediation:** Treat these as burned — rotate all five values before this branch or anything derived from it reaches a real environment. Rename to `.env.docker.example` with placeholder values (matching the pattern already used for `.env.production`), and have local dev generate/inject real values via `docker-compose --env-file` pointed at a gitignored local copy, or via `openssl rand -base64 32` at first-run. Add `.env.docker` (the real one, not `.example`) to `.gitignore`.

### 4. [LOW] Defense-in-depth `middleware/security.js` still dead code (unchanged from last audit)
**Location:** `backend/src/middleware/security.js`
**Description:** Confirmed via fresh grep: still never `require()`'d anywhere in `backend/src`. This is lower priority than in the last report now that real replacements exist and are wired (`middleware/securityHeaders.js` is live at `index.js:499`+, `middleware/rateLimit.js`'s `rateLimiters.auth`/`.api` are live at `index.js:574-575`), so the "false sense of security" risk is reduced — but the CSRF/XSS/SQLi-blocklist code in this specific file is still inert and should either be wired or deleted.
**Remediation:** Unchanged from prior audit — delete the file, or make an explicit, documented decision about CSRF strategy and wire only the pieces that decision needs.

### 5. [LOW] `pg_dump`/`pg_restore` shell command built via unescaped `exec()` string interpolation of `DATABASE_URL`
**Location:** `backend/src/services/legacy/backupService.js:74-92` (`performFullBackup`), `~193` (`restoreCommand`)
```js
const dumpCommand = `PGPASSWORD=${password} pg_dump -h ${host} -p ${port} -U ${user} -d ${database} -F c -f ${backupPath}`;
...
exec(dumpCommand, ...)
```
**Description:** `user`/`password`/`host`/`database` are regex-extracted from `process.env.DATABASE_URL` and interpolated unescaped into a shell command run via `child_process.exec` (which invokes a shell, unlike `execFile`). This is not attacker-reachable from any HTTP input found in this pass — `DATABASE_URL` is an operator-set environment variable, not user input — so this is a defense-in-depth/config-hygiene finding rather than a proven remote vulnerability. It would become one if `DATABASE_URL` is ever built from a value with lower trust (e.g., a secrets-manager value containing shell metacharacters from an upstream system) or if this pattern is copied into any future function using request data.
**Remediation:** Use `execFile('pg_dump', [...args], { env: { ...process.env, PGPASSWORD: password } })` instead of `exec()` with a shell string, eliminating the shell-interpolation surface entirely regardless of what `DATABASE_URL` contains.

## Verified Fixed (from prior `AUDIT_SECURITY.md`, re-checked against current code)

- **Finding #1 (hardcoded JWT fallback secret) — fixed for the code path that matters most** (`index.js` → `services/dual-use/authService.js`, throws in production / warns+randomizes in dev), **but see new Finding #2 above**: the fix does not extend to every module-resolution path to a file also named `authService`.
- **Finding #2 (IDOR on product mutation)** — `productService.js` PUT/DELETE now enforce owner-or-admin checks (confirmed present in current code; matches the "H2 already fixed" note in `.ai/tasks/ACTIVE.md`).
- **Finding #3 (auth endpoints on generic rate limiter)** — fixed: `index.js:574` now applies `rateLimiters.auth` to `/api/v1/auth` specifically before the generic `/api/v1/` limiter.
- **Finding #5 (OAuth `state` never validated)** — fixed properly: `dual-use/authService.js` now generates a signed, TTL-bound `state` (`generateOAuthState`/`verifyOAuthState`, HMAC-style with timestamp, 10-minute expiry) and the callback route (`:1237-1239`) rejects with 400 if verification fails.
- **Finding #7 (adminMiddleware without authMiddleware ordering bug)** — not re-verified file-by-file this pass (out of scope given time budget), no contrary evidence found in files reviewed.
- **Finding #10 (`crypto` npm package)** — fixed: no longer present in `backend/package.json`.
- **Finding #11 (`trust proxy` unset)** — fixed: `index.js:520-522` explicitly sets `app.set('trust proxy', trustProxyHops)` with a documented rationale comment, defaulting to 1 hop, configurable via `TRUST_PROXY_HOPS`.
- **This session's escrow/rural-finance/claim-ownership fixes (commit `5e2eb01b`)** — all three independently re-verified against live code, not just the commit message:
  - Escrow: every route in `escrowService.js`'s `setupRoutes` now requires `authMiddleware`, with buyer/farmer/admin ownership enforcement on create/release/refund/status/get (confirmed via direct grep of the current file).
  - Rural finance: `ruralFinanceService.js` confirmed to use the real schema columns (`reu_id`, `loan_number`, `loan_amount`, etc.) — zero remaining references to the old nonexistent `finance_id`/`village_id`/`service_type`/`provider_id` columns.
  - Insurance claims: `/claims/:id/status` and `/:id/payout` now require `authMiddleware` + `isClaimOwner()` ownership check (privileged roles bypass; confirmed in current `insuranceClaimsService.js`).
- **New since last audit, found positive:** `backend/src/services/aiAgentService.js`'s `calculate` tool previously called raw `eval(params.expression)` on user-supplied strings — this session's working-tree diff replaces it with a real bounded shunting-yard arithmetic evaluator (`evaluateArithmetic`, regex-gated to `[\d\s()+\-*/%.]`, rejects anything else) — this was a live RCE-via-`eval` risk that is now closed, not previously flagged by name in the prior audit's file sample. The same diff also adds an allowlist check to the agent's generic `api_call` tool (blocks non-http(s) protocols always; blocks non-allowlisted hostnames when `NODE_ENV=production`) — reduces but does not fully close SSRF risk in non-production environments, where the allowlist check is skipped entirely (informational, not filed as a numbered finding given it's dev-only exposure).
- **New since last audit, found positive:** `backend/src/config/productionConfig.js` (`assertProductionConfiguration`, called at `index.js:8` before the app is constructed) now hard-fails boot in production if `JWT_SECRET`/`ENCRYPTION_KEY`/`DATABASE_URL` are unset, placeholder-valued, or under 32 characters, and if neither `ALLOWED_ORIGINS` nor `FRONTEND_URL` is configured. Good defense-in-depth layered on top of Finding #2's dual-use guard, though it does not by itself close Finding #2 above since it only runs when `NODE_ENV === 'production'` and doesn't address the module-resolution ambiguity.
- **New since last audit, found positive:** `backend/src/routes/healthRoutes.js`'s `/detailed`, `/checks`, and `/checks/:name` diagnostic endpoints (which expose service-dependency status, timing, and error messages) are now gated behind `authMiddleware` in production (`protectDiagnostics`), previously fully open.
- **New since last audit, found positive:** `backend/src/routes/aiAgentRoutes.js`'s agent/tool registration and mutation endpoints (`POST /agent`, `PUT /agent/:name`, `DELETE /agent/:name/memory`, `POST /tool`) — previously callable by anyone — now require `authMiddleware` + `requireRole('admin')`.

## Secrets Sweep

- `.env`, `.env.local`, `.env.*.local` — correctly gitignored, none tracked (`git ls-files` confirms zero matches).
- `.env.docker`, `.env.production` (root), `backend/.env.production`, `frontend/.env.production` — **tracked in git**. Three of the four use only clearly-fake `your_x_here` placeholders (fine as committed templates). **`.env.docker` is the exception — see Finding #3.**
- Repo-wide regex sweep for API-key-shaped strings (`sk-[A-Za-z0-9]{20,}`, `AKIA[0-9A-Z]{16}`) and the `.env.docker` password string: only hit was `.env.docker` itself plus two documentation files quoting it (`INFRASTRUCTURE_SETUP_COMPLETION_REPORT.md`, `INFRASTRUCTURE_SETUP_GUIDE.md` — expected, they document the same docker-compose setup) and the provenance log. No AWS keys, no Anthropic/OpenAI-shaped API keys, no private key (`BEGIN ... PRIVATE KEY`) blocks found anywhere in the tracked tree.
- No new secrets introduced by the in-flight working-tree changes reviewed (`aiAgentService.js`, `aiFeedbackService.js`, `coldStorageRoutes.js`/`Service.js`, `healthRoutes.js`, `productReviewService.js` family) — all use `process.env.*` correctly, no literals.

## Metrics

| Metric | Value |
|---|---|
| Files reviewed in depth this pass | ~25 (auth family: 3 `authService.js` variants + `authService/` dir, `middleware/auth.js`, `index.js` boot sequence; product-review family: 3 files; cold-storage family: 2 files; AI-agent/feedback services: 2 files; health routes; backup service; analytics-monitoring service; `.env*` root files; `config/productionConfig.js`) |
| New HIGH findings this pass | 2 (#1 SQLi, #2 JWT-fallback resolution gap) |
| New MEDIUM findings this pass | 1 (#3 committed docker secrets) |
| New LOW findings this pass | 2 (#4 dead security middleware — carried over, #5 shell-exec string interpolation) |
| Prior findings independently re-verified fixed | 7 (#1-partial, #2, #3, #5, #7-not-contradicted, #10, #11) + the 3 finance/insurance fixes from commit `5e2eb01b` |
| Empirical verification method | `node -e` direct require + `npx jest` (not just static reading) for Finding #2; `git diff`/`git show` for commit-claim verification; `git ls-files`/`git check-ignore` for the secrets sweep |
| Raw string-interpolated SQL found this pass | 1 confirmed exploitable instance (Finding #1); 1 non-exploitable instance using a fixed internal whitelist map, not attacker input (`analyticsMonitoringService.js`'s `timeRangeMap`, reviewed and cleared) |
| `eval`/`child_process.exec` usage found | 1 `eval()` found **and already fixed** in-session (Finding under Verified Fixed); 2 `exec()` calls with interpolated-but-not-attacker-controlled input (Finding #5) |

### What's left
- [ ] Fix Finding #1 (SQLi) immediately — trivially exploitable, unauthenticated, in a currently-live route.
- [ ] Collapse `services/authService.js` into a re-export of `services/dual-use/authService.js` (Finding #2) and get `jwtSecretRequired.test.js` back to green — currently 3/4 assertions fail when actually run.
- [ ] Rotate the five secrets in `.env.docker` and convert it to an `.example` template (Finding #3).
- [ ] Decide and either wire or delete `middleware/security.js` (Finding #4, carried over).
- [ ] Switch `backupService.js` from `exec()` to `execFile()` (Finding #5, low urgency).
- [ ] Not re-verified this pass (time-boxed out, flagged for the next run): prior Finding #4's full remediation status beyond dead-code confirmation, prior Finding #6 (JSON-file auth-store fallback gating), prior Finding #7's full repo-wide `adminMiddleware`-ordering sweep, prior Finding #9 (Tauri CSP/filesystem scope), and a full pass over the newly-added files this session (`backend/src/services/clinicalNutritionDecisionSupportService.js`, `backend/src/services/medicalCodingReferenceService.js`, migrations `9998_ai_response_feedback.sql`/`9999_..._medical_coding_reference.sql`/`9999_..._clinical_nutrition_decision_support.sql`) — none showed obvious red flags in a quick pass but weren't given the full auth/injection treatment.

*verified by vibecheck*
