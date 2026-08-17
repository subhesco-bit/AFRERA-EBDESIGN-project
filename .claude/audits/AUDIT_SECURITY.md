---
agent: security-auditor
status: fail
findings: 11
---

# Security Audit — OWASP Top 10 Focus

Scope: `backend/` (Express/Node API, 818 JS files across 150 `src/modules/M0xx` domains plus `src/services`, `src/middleware`, `src/routes`), `frontend/`, and the Tauri desktop shell (`tauri.conf.json`). Audit-only — no files were modified. Given the scale of the backend (818 files), this was a targeted review of the shared auth/security infrastructure (`authService.js`, `middleware/auth.js`, `middleware/admin.js`, `middleware/security.js`, `middleware/rateLimiter.js`, `index.js` bootstrap) plus representative sampling of route handlers (`productService.js`, `orderService.js`, `formService.js`) rather than an exhaustive pass over every one of the 150 modules. The patterns found in the sampled files (missing ownership checks, unwired security middleware) should be assumed to recur elsewhere and merit a follow-up sweep before launch.

## Summary

The authentication core (JWT issuance/verification, bcrypt password hashing, TOTP 2FA with proper HMAC-SHA1 and random secrets, transaction handling with rollback/connection-release guarantees) is well-built. However, several gaps would be exploitable in production:

- A hardcoded fallback JWT signing secret ships in `authService.js`, so any deployment that forgets to set `JWT_SECRET` silently runs with a public, guessable key.
- A dedicated, purpose-built defense-in-depth module (`middleware/security.js` — CSRF protection, SQL-injection/XSS filtering, AES-256 helpers) is never imported anywhere in the app and is completely inert.
- A dedicated auth-endpoint brute-force limiter (`authRateLimit`, 5 req/min) exists but is never wired to the `/api/v1/auth/*` routes; those routes fall back to the generic 100 req/min limiter, which is far too permissive for login/register/2FA-verify.
- Broken access control (IDOR) on product mutation endpoints: any authenticated user, regardless of role or ownership, can update or soft-delete any product in the marketplace by ID.
- OAuth2 `state` parameter is generated but never validated on the callback, leaving the OAuth login flow open to CSRF.
- The Tauri desktop shell disables CSP (`"csp": null`) while granting broad filesystem (APPDATA/DESKTOP/DOCUMENTS/DOWNLOAD/PICTURES, full read/write/delete) and unrestricted-host HTTPS network scope to the webview.

No committed secrets, `.env` files, private keys, or cloud credentials were found in the repository. Parameterized queries (`$1, $2...`) are used consistently everywhere sampled — no raw SQL string interpolation of user input was found in `backend/src`.

## Findings

### 1. [HIGH] Hardcoded fallback JWT secret
**Location:** `backend/src/services/authService.js:28`
```js
secret: process.env.JWT_SECRET || 'your-super-secret-key-change-in-production',
```
and re-read at verify time, `backend/src/services/authService.js:133`:
```js
const secret = process.env.JWT_SECRET || JWT_CONFIG.secret;
```
**Description:** If `JWT_SECRET` is unset at runtime (misconfigured deploy, missing secret in an orchestrator, a container started without its env file), the server silently signs and verifies tokens with a well-known, public string that is committed to source control. Anyone can then forge valid access tokens for any user/role, including `admin` (which has the wildcard `*` permission — see `getUserPermissions`), giving full account takeover and privilege escalation. `.env.example` documents this risk in a comment but the unsafe fallback is still live in code.
**Remediation:** Fail fast instead of falling back — throw at startup if `process.env.JWT_SECRET` is missing/short, e.g. `if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is required')`. Never ship a real-looking default secret in source.

### 2. [HIGH] Broken access control / IDOR on product mutation endpoints
**Location:** `backend/src/services/productService.js:476-501` (routes), `backend/src/services/productService.js:221-328` (`updateProduct`, `deleteProduct`)
```js
router.put('/:id', authMiddleware, async (req, res) => {
  const product = await updateProduct(req.params.id, req.body);
  ...
router.delete('/:id', authMiddleware, async (req, res) => {
  const product = await deleteProduct(req.params.id);
```
**Description:** These routes only require *any* valid, logged-in session (`authMiddleware`) — there is no role check and no check that `req.user.id` (or their seller/company) owns the product referenced by `req.params.id`. `updateProduct`/`deleteProduct` themselves also perform no ownership filtering in their SQL (`WHERE id = $1` only). Any authenticated consumer account can therefore edit or soft-delete (`is_active = FALSE`) any other seller's product by iterating IDs — a textbook OWASP A01 Broken Access Control / IDOR. `formService.js:388-407` has the identical shape (`router.put('/:id', authMiddleware, ...)`, `router.delete('/:id', authMiddleware, ...)`) and should be checked for the same gap.
**Remediation:** Require ownership or role at the route (`req.user.role === 'admin' || product.seller_id === req.user.id`) and enforce it in the SQL (`WHERE id = $1 AND seller_id = $2`), returning 404/403 on mismatch rather than leaking existence. Apply the same review to every other `router.put/delete('/:id', authMiddleware, ...)` pattern across the 150 modules — this file-by-file pattern was only spot-checked in three services.

### 3. [MEDIUM] Auth endpoints rely on the generic rate limiter, not the dedicated brute-force limiter
**Location:** `backend/src/middleware/rateLimiter.js:24-28` (`authRateLimiter`, unused) vs. `backend/src/index.js:345,410` (`app.use('/api/', rateLimiter)` then `mountRoute('/api/v1/auth', authService)`)
**Description:** A stricter limiter tuned for auth (5 requests/60s, 5-minute block) is defined and exported as `authRateLimit` but is never imported or attached anywhere in `index.js` or `authService.js`. `/api/v1/auth/login`, `/register`, and `/2fa/verify` (which takes a raw 6-digit `code` in the body with no `authMiddleware`) are only covered by the blanket `/api/` limiter (100 req/min per IP). At that rate, exhausting the ~1,000,000 possible 2FA codes or running a credential-stuffing pass against `/login` is materially easier than intended, and multiple attacking IPs remove even that limit. `strictRateLimiter` (10/min) is similarly defined but unused anywhere in the codebase (confirmed via repo-wide search).
**Remediation:** Attach `authRateLimit` to `/register`, `/login`, `/refresh`, and especially `/2fa/verify` (which currently also lacks the `lazyAuth` gate that `/2fa/setup` and `/2fa/disable` have). Consider per-account lockout for 2FA in addition to per-IP limiting.

### 4. [MEDIUM] Defense-in-depth security middleware module is completely unused
**Location:** `backend/src/middleware/security.js` (297 lines: `SecurityUtils.encrypt/decrypt`, `sanitizeInput`, `preventSQLInjection`, `preventXSS`, `csrfProtection`, `securityHeaders`, `securityMiddleware(logger)`)
**Description:** A repo-wide search shows this file is never `require()`'d by any other file in `backend/src` — `securityMiddleware`, `csrfProtection`, `sanitizeInput`, `preventSQLInjection`, and `preventXSS` are all dead code. In particular there is **no CSRF protection anywhere in the running app** (this file was the only implementation), and the app relies solely on parameterized queries for injection defense (which is correct and sufficient for SQLi, but means the intended layered defense doesn't exist). This is a "false sense of security" risk: a future engineer may believe CSRF/XSS middleware is active because the module exists and looks complete.
**Remediation:** Either wire the needed pieces into `index.js` (at minimum decide explicitly on a CSRF strategy — note the existing `csrfProtection` implementation depends on `req.session.csrfToken`, but no session middleware is configured anywhere either, so it would 100%-reject all mutating requests as written) or delete the dead module to avoid the misleading appearance of protection. Recommend a double-submit-cookie or SameSite=Strict cookie + custom-header CSRF strategy sized to whether the frontend uses cookie or bearer-token auth (currently bearer tokens in `Authorization` header, which are inherently more CSRF-resistant — if that remains the only auth transport, formal CSRF middleware may be unnecessary, but this should be a documented decision, not an accidental one).

### 5. [MEDIUM] OAuth2 `state` parameter is never validated on callback (OAuth CSRF)
**Location:** `backend/src/services/authService.js:870-883` (`getOAuthAuthUrl`, issues `state`), `:1125-1146` (`/oauth/:provider/url` and `/oauth/:provider/callback` routes)
**Description:** `getOAuthAuthUrl` forwards a client-supplied `state` query value straight into the provider authorization URL, but the `/oauth/:provider/callback` handler never receives, checks, or compares a `state` value against anything stored server-side — `oauthAuthenticate(provider, code, redirect_uri)` ignores `state` entirely. This defeats the purpose of the OAuth `state` parameter (CSRF protection for the login flow) and allows login CSRF / session-fixation-style attacks where an attacker tricks a victim into completing an OAuth flow initiated by the attacker.
**Remediation:** Generate `state` server-side, store it (session or short-lived signed cookie) keyed to the browser, and verify it on callback before exchanging `code`.

### 6. [LOW-MEDIUM] Insecure-by-default JSON file falls back for the entire auth system when Postgres is unavailable
**Location:** `backend/src/services/authService.js:51-90` (`AUTH_STORE_PATH`, `readAuthStore`/`writeAuthStore`), used throughout `registerUser`/`loginUser`/`refreshAccessToken`/`/me`
**Description:** When `getPostgreSQL()` returns falsy, the entire authentication system (registration, login, token refresh, "me") transparently falls back to reading/writing a plaintext JSON file (`backend/src/database/auth_store.json`) containing bcrypt hashes and PII (email, phone, name). This file is not listed in `.gitignore` (only `.env*`/`*.log`/`*.sqlite*` are ignored at the repo root), so if it's ever created in a checked-out working tree during local testing it could be accidentally committed. More importantly, this fallback means a DB outage doesn't fail the auth system closed — it silently switches to an unaudited, non-transactional, file-based user store with no account-lockout logic (the lockout-after-5-failed-attempts logic present in the Postgres path is absent in the fallback path), no `two_factor_enabled` handling and no failed-login tracking at all.
**Remediation:** Confirm this fallback is intentionally dev/test-only (it reads as such, given comments elsewhere in the file) and gate it explicitly behind `NODE_ENV !== 'production'` so it can never activate in prod if Postgres has a transient outage. Add `auth_store.json` (or `backend/src/database/*.json` state files) to `.gitignore` defensively. Port the account-lockout logic into the fallback path or block it from production entirely.

### 7. [LOW] Route-level auth middleware ordering bug leaves at least one admin route permanently 401 (fail-closed, but indicates fragile wiring)
**Location:** `backend/src/services/orderService.js:778`
```js
router.put('/:id/status', adminMiddleware, async (req, res) => {
```
**Description:** `adminMiddleware` (`backend/src/middleware/admin.js`) only checks `req.user.role`; it does not itself verify a JWT or populate `req.user`. Every other route in this file explicitly chains `authMiddleware` before role/permission checks, but this one uses `adminMiddleware` alone, and `authMiddleware`/`optionalAuth` is not applied globally anywhere in `index.js`. As written, `req.user` will always be `undefined` here, so `adminMiddleware` always returns 401 — meaning order-status updates are currently unusable by anyone, including real admins (fails closed, so not itself an exploit, but it's a symptom of inconsistent auth-middleware composition that, if "fixed" by a future engineer who reorders things without understanding the dependency, could just as easily fail open).
**Remediation:** Change to `router.put('/:id/status', authMiddleware, adminMiddleware, async (req, res) => {...})`. Consider a single composed `requireAdmin = [authMiddleware, adminMiddleware]` export used everywhere admin routes are declared, to remove the class of bug entirely (146 other `M0xx` modules were not individually checked for the same mis-ordering — recommend a repo-wide grep for `adminMiddleware` / `requireRole` usages not preceded by `authMiddleware` on the same route).

### 8. [LOW] Regex/blocklist-based SQL-injection and XSS filters (currently dead code, see Finding 4) are trivially bypassable if ever wired in as the primary defense
**Location:** `backend/src/middleware/security.js:183-256` (`preventSQLInjection`, `preventXSS`)
**Description:** `preventSQLInjection` blocklists patterns like `SELECT|INSERT|...`, `;`, `--`, `/* */`, and `OR 1=1`; `preventXSS` does a single-pass `.replace()` of `<script>`, `<iframe>`, `javascript:`, and `on\w+=` patterns. Both are classic blocklist approaches: `preventXSS`'s single-pass replace is bypassable with nested tags (e.g. `<scr<script>ipt>` becomes `<script>` after one pass), and `preventSQLInjection` would false-positive on completely legitimate business text (e.g., a product description containing the word "select" or "and") while doing nothing a parameterized query doesn't already do better. Not currently exploitable since the module is unwired (Finding 4), but flagged so it isn't reused as-is if the module is revived.
**Remediation:** If this module is wired in per Finding 4's remediation, drop the custom SQLi blocklist (parameterized queries already handle this correctly) and replace the XSS sanitizer with a maintained library (e.g. `dompurify` via `isomorphic-dompurify`, or output-encode on render rather than mutate-on-input).

### 9. [LOW] Tauri desktop shell: CSP disabled with broad filesystem + network scope
**Location:** `tauri.conf.json:96` (`"csp": null`), `:36-50` (`fs` allowlist: `readFile/writeFile/readDir/createDir/removeDir/copyFile/moveFile/removeFile` over `["APPDATA","LOCALDATA","DESKTOP","DOCUMENTS","DOWNLOAD","PICTURES"]`), `:58-62` (`http` allowlist: `scope: ["https://**", ...]`)
**Description:** The webview's Content-Security-Policy is explicitly disabled (`null`), while the app is granted essentially full read/write/delete access to the user's Desktop, Documents, Downloads, Pictures, and AppData folders, plus the ability to make HTTPS requests to *any* host. In a Tauri app, the webview and the privileged Rust/native side are separated specifically so a webview compromise (e.g., XSS from a rendered claim/shipment record containing attacker-controlled text) can't automatically become a full-filesystem/network-exfiltration primitive. With CSP off and this scope, a single stored-XSS bug anywhere in the rendered claims/shipment UI becomes a much higher-severity issue (arbitrary file read/exfiltration to attacker infrastructure) than it would be in a browser tab.
**Remediation:** Set an explicit CSP (`default-src 'self'; connect-src 'self' https://your-api-domain`), and scope `http.scope` down to only the actual backend API origin(s) rather than `https://**`. If broad Desktop/Documents/Downloads access is a genuine product requirement (e.g., attaching claim documents), scope it to specific Tauri dialog-selected paths instead of blanket directory access where feasible.

### 10. [LOW] `crypto` listed as an npm dependency
**Location:** `backend/package.json` (`"crypto": "^1.0.1"` in `dependencies`)
**Description:** `crypto` is a deprecated, empty/placeholder package on npm (the real `crypto` is a Node.js built-in and does not need to be installed). Declaring it as a dependency risks shadowing the built-in module depending on module resolution/hoisting, and is flagged by npm itself as deprecated with a security advisory recommending removal. No exploitation was confirmed (the codebase's `require('crypto')` calls appear to resolve to the built-in in the files reviewed), but this is exactly the kind of dependency-confusion-adjacent footgun worth removing before launch.
**Remediation:** Remove `"crypto": "^1.0.1"` from `backend/package.json` dependencies — it is unnecessary and only adds risk.

### 11. [LOW] `TRUSTED_IPS` rate-limit bypass keyed on `req.ip` without confirmed `trust proxy` configuration
**Location:** `backend/src/middleware/security.js:106-110` (unused, see Finding 4, but the same `req.ip`-keying pattern is used by the live `rateLimiter`/`authRateLimiter` in `backend/src/middleware/rateLimiter.js:35,67,92`)
**Description:** All rate limiters key on `req.ip`. If the app is deployed behind a reverse proxy/load balancer (typical for a production logistics platform) without Express's `app.set('trust proxy', ...)` correctly configured, `req.ip` can be attacker-controlled via the `X-Forwarded-For` header, allowing rate-limit bypass (and, if the unused `TRUSTED_IPS` skip-list in `security.js` is ever wired in, spoofing a trusted IP entirely). A repo-wide search did not find `trust proxy` configured anywhere in `backend/src/index.js`.
**Remediation:** Explicitly set `app.set('trust proxy', <n>)` (or the specific proxy count/CIDR your infra uses) so `req.ip` reflects the real client only when behind your known proxy layer, and confirm this before any `TRUSTED_IPS`-based bypass logic is ever activated.

## Metrics

| Metric | Value |
|---|---|
| Backend JS files (`backend/src`) | 818 |
| Backend feature modules (`src/modules/M001`–`M150`) | 150 |
| Files reviewed in depth | ~12 (auth core, middleware stack, `index.js` bootstrap, 3 sample route services, `tauri.conf.json`, `.env.example`, `package.json`) |
| Committed secrets / private keys found | 0 |
| `.env` files committed | 0 |
| Raw string-interpolated SQL queries found in `backend/src` | 0 (all sampled queries parameterized with `$1..$n`) |
| `eval`/`new Function`/`child_process.exec*` usage found | 0 |
| Findings by severity | High: 2, Medium: 3, Low-Medium: 1, Low: 5 |
| Findings by OWASP category | A01 Broken Access Control: 3 (#2, #7, #11), A02 Cryptographic Failures: 1 (#1), A05 Security Misconfiguration: 4 (#4, #8, #9, #10), A07 Identification & Auth Failures: 2 (#3, #6), CSRF (A01/legacy): 1 (#5) |
| Coverage caveat | Only 3 of 150 feature modules were sampled for the IDOR/ownership-check pattern (Finding #2); a full sweep of all `router.put/delete('/:id', ...)` handlers across `src/modules/M001`–`M150` is recommended before declaring launch-ready |

### What's left
- [ ] Full repo-wide sweep of all 150 `src/modules/M0xx` for the same IDOR/missing-ownership-check pattern found in `productService.js` and `formService.js` (Finding #2)
- [ ] Full repo-wide sweep for `adminMiddleware`/`requireRole` usages not preceded by `authMiddleware` on the same route (Finding #7)
- [ ] Decide and implement a CSRF strategy, or formally document why bearer-token-only auth makes it unnecessary (Finding #4/#5)
- [ ] Wire `authRateLimit` onto `/api/v1/auth/*` routes, especially `/2fa/verify` (Finding #3)
- [ ] Remove or gate the hardcoded JWT fallback secret behind a startup assertion (Finding #1)
- [ ] Frontend (`frontend/src`) was not deeply audited beyond a `dangerouslySetInnerHTML`/hardcoded-secret sweep (both clean) — recommend a follow-up pass focused on client-side auth-token storage and API-response rendering

*verified by vibecheck*
