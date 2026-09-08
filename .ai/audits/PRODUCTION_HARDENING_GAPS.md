---
agent: security-auditor
status: fail
findings: 10
---

# Production Hardening Gaps

Audit date: 2026-09-03

Scope: backend security middleware, configuration and secrets, health/readiness, shutdown, and frontend API authentication. This is a static review of the current checkout. No application code was changed.

## Verified baseline

- The checked-in `TRUTHPACK.json` says PostgreSQL migrations have not executed, MongoDB is not running, Redis is not running, and Elasticsearch is configured but not running.
- `.ai/PROJECT_CONTEXT.md` and `.ai/architecture/CURRENT_IMPLEMENTATION.md` also record missing infrastructure and zero test coverage.
- The expected `.vibecheck/truthpack/` directory is absent. The checked-in `TRUTHPACK.json` was therefore used as the available truthpack source.
- Existing hardening that was verified: production JWT startup failure when `JWT_SECRET` is absent; Socket.IO JWT handshake verification; auth-specific rate limiting; Helmet plus custom security headers; explicit Express proxy configuration.
- `git ls-files` did not report `.env.production`, `backend/.env.example`, `frontend/.env.example`, or `backend/src/database/auth_store.json` as tracked. Secret values were not printed or copied into this report.

## Findings

### F-01 - Critical - Public registration accepts caller-controlled role and status

**Evidence:** [backend/src/services/dual-use/authService.js](../../backend/src/services/dual-use/authService.js#L300-L329), [backend/src/services/dual-use/authService.js](../../backend/src/services/dual-use/authService.js#L350-L401), [backend/src/services/dual-use/authService.js](../../backend/src/services/dual-use/authService.js#L1135-L1142)

`registerUser()` spreads request data and only appears to force values before the shown block; the persisted fallback user and PostgreSQL insert use `registrationData.role` and `registrationData.status`. The public `/register` handler passes `req.body` directly. A caller who supplies a privileged role and active status can receive tokens carrying that role. `getUserPermissions('admin')` grants `*`.

**Remediation commands:**

```powershell
git grep -n "registrationData\.role\|registrationData\.status" -- backend/src/services/dual-use/authService.js
git grep -n "router\.post('/register'" -- backend/src/services/dual-use/authService.js
```

Change the public path to an allowlisted fixed role/status, add an authenticated admin-provisioning route for privileged roles, then run:

```powershell
Set-Location backend
npm test -- --runInBand
npm run lint
```

### F-02 - Critical - Canonical password comparison still permits plaintext passwords and a known fixture password

**Evidence:** [backend/src/services/dual-use/authService.js](../../backend/src/services/dual-use/authService.js#L189-L208)

`comparePassword()` returns true when the stored value equals the supplied password, treats every non-bcrypt value as plaintext, and accepts the known `$2a$10$test` plus `password` pair. `getUserPasswordHash()` also accepts plaintext field aliases. This defeats the bcrypt boundary if any legacy or fallback record contains a plaintext value.

**Remediation commands:**

```powershell
git grep -n "comparePassword\|password_hash\|passwordHash\|passwordhash" -- backend/src
Set-Location backend
npm test -- --runInBand
```

Remove compatibility acceptance from production code, migrate all non-bcrypt records through a one-time controlled reset, and add tests proving plaintext and fixture values are rejected.

### F-03 - High - Database outage changes authentication security semantics

**Evidence:** [backend/src/services/dual-use/authService.js](../../backend/src/services/dual-use/authService.js#L326-L329), [backend/src/services/dual-use/authService.js](../../backend/src/services/dual-use/authService.js#L460-L512), [backend/src/services/dual-use/authService.js](../../backend/src/services/dual-use/authService.js#L584-L606), [backend/src/services/dual-use/authService.js](../../backend/src/services/dual-use/authService.js#L670-L684)

The fallback JSON store is used whenever PostgreSQL is unavailable. Registration/login can continue from a local file, while refresh issues new tokens without consulting the persisted refresh-token table and logout returns success without revocation. In production this can leave stolen refresh tokens usable through a database outage and removes lockout/revocation guarantees.

**Remediation commands:**

```powershell
git grep -n "if (!pg)\|AUTH_STORE_PATH\|refreshAccessToken\|logoutUser" -- backend/src/services/dual-use/authService.js
Set-Location backend
npm test -- --runInBand
```

Gate the fallback explicitly to `NODE_ENV=test` or `development`; fail closed in production. Add outage tests for login, refresh, and logout, and verify revocation with a live PostgreSQL instance before release.

### F-04 - High - Frontend login stores a token key the API client never reads

**Evidence:** [frontend/src/components/forms/LoginForm.jsx](../../frontend/src/components/forms/LoginForm.jsx#L20-L25), [frontend/src/services/api.js](../../frontend/src/services/api.js#L15-L20)

Login writes `localStorage.token`, but the Axios request interceptor reads `localStorage.access_token`. The successful login path therefore does not attach the returned bearer token to subsequent API calls. Refresh also expects `access_token`/`refresh_token`, while the login form does not persist either canonical key.

**Remediation commands:**

```powershell
git grep -n "localStorage\.setItem\|localStorage\.getItem" -- frontend/src
Set-Location frontend
npm run build
npm test -- --runInBand
```

Use one token contract across login, refresh, logout, route guards, and the Axios interceptor; add an integration test asserting that a post-login protected request contains `Authorization: Bearer ...`.

### F-05 - High - Bearer tokens are exposed to JavaScript through localStorage

**Evidence:** [frontend/src/services/api.js](../../frontend/src/services/api.js#L15-L20), [frontend/src/services/api.js](../../frontend/src/services/api.js#L35-L53)

Access and refresh tokens are read and written in `localStorage`. Any XSS in the SPA or a compromised dependency can extract both tokens. The backend already has custom input sanitization, but that is not a substitute for output encoding, dependency controls, or protected token transport.

**Remediation commands:**

```powershell
git grep -n "localStorage.*access_token\|localStorage.*refresh_token" -- frontend/src
Set-Location frontend
npm audit --audit-level=high
npm run build
```

Prefer an HttpOnly, Secure, SameSite refresh cookie and short-lived in-memory access tokens, with an explicit CSRF design for cookie-authenticated requests. If localStorage is retained, document the risk and enforce a strict CSP plus an XSS regression suite.

### F-06 - High - Health readiness and manual checks are unauthenticated

**Evidence:** [backend/src/index.js](../../backend/src/index.js#L1068-L1070), [backend/src/routes/healthRoutes.js](../../backend/src/routes/healthRoutes.js#L241-L266), [backend/src/routes/healthRoutes.js](../../backend/src/routes/healthRoutes.js#L315-L365)

`/health` is mounted without authentication. `/health/ready` performs a database query without `requireDiagnosticsAccess`; `/health/checks/:name` is also public and can execute registered checks. The basic and readiness responses expose environment/version and database status. Detailed diagnostics are token-protected only in production, and the required `HEALTHCHECK_TOKEN` is not validated at startup.

**Remediation commands:**

```powershell
git grep -n "app\.use('/health'\|router\.get('/ready'\|router\.post('/checks/:name'" -- backend/src
Set-Location backend
node -e "const {app}=require('./src/index'); console.log(app._router.stack.filter(x => x.route).map(x => Object.keys(x.route.methods).join(',')+' '+x.route.path).join('\\n'))"
```

Expose only a minimal liveness response publicly. Restrict readiness, detailed, checks, and manual-trigger endpoints to the private probe network or authenticated monitoring identity; return generic external errors. Add startup validation for `HEALTHCHECK_TOKEN` in production and configure the load balancer probe accordingly.

### F-07 - Medium - Production rate limiting is process-local

**Evidence:** [backend/src/middleware/rateLimit.js](../../backend/src/middleware/rateLimit.js#L18-L21), [backend/src/middleware/rateLimit.js](../../backend/src/middleware/rateLimit.js#L285-L297), [backend/src/index.js](../../backend/src/index.js#L548-L551)

The live limiter defaults to a module-global in-memory store. It resets on restart and each application instance has independent counters, so horizontal scaling multiplies the allowed request volume. The proxy hop count is parsed without range/topology validation.

**Remediation commands:**

```powershell
git grep -n "memoryStore\|TRUST_PROXY_HOPS\|rateLimiters\.api" -- backend/src
Set-Location backend
npm audit --audit-level=high
```

Use the existing Redis dependency for a shared production limiter, key authentication attempts by a combination of IP/account/device, and reject invalid `TRUST_PROXY_HOPS` values at startup. Verify limits across two backend instances behind the actual proxy.

### F-08 - Medium - Shutdown closes HTTP only and does not close all resources

**Evidence:** [backend/src/index.js](../../backend/src/index.js#L1424-L1475)

The graceful shutdown clears two timers, shuts down database enhancements, and calls `httpServer.close()`. It does not close Socket.IO, the WebSocket service, the primary PostgreSQL pool, Redis/Mongo/Elasticsearch clients, or other service-owned timers. The 30-second forced exit can therefore terminate active work and leave connections or queued messages in an undefined state.

**Remediation commands:**

```powershell
git grep -n "gracefulShutdown\|\.end()\|\.close()\|shutdown" -- backend/src/index.js backend/src/database backend/src/services
Set-Location backend
npm test -- --runInBand
```

Create one idempotent shutdown coordinator that stops intake, closes Socket.IO/WebSocket listeners, drains workers, closes every client/pool, and exits only after completion or a bounded timeout. Add SIGTERM integration tests and verify the container's stop timeout exceeds the drain budget.

### F-09 - Medium - Environment validation checks too few production secrets and dependencies

**Evidence:** [backend/src/routes/healthRoutes.js](../../backend/src/routes/healthRoutes.js#L206-L235), [backend/src/services/dual-use/authService.js](../../backend/src/services/dual-use/authService.js#L25-L45), [backend/src/index.js](../../backend/src/index.js#L1387-L1420)

The health environment check requires only `DATABASE_URL` and `NODE_ENV`; it does not validate `JWT_SECRET`, `HEALTHCHECK_TOKEN`, encryption keys, OAuth credentials when enabled, or provider configuration. Startup catches database-enhancement and AI initialization failures and continues listening. This can produce a process that reports live while security or required persistence features are unavailable.

**Remediation commands:**

```powershell
git grep -n "requiredVars\|process\.env\.[A-Z_]*SECRET\|Continuing without" -- backend/src
Set-Location backend
npm run lint
npm test -- --runInBand
```

Add a fail-fast production configuration validator before binding the port, with conditional checks for enabled integrations. Keep optional capabilities degraded only when explicitly configured as optional, and make readiness fail for every dependency required by the deployed role.

### F-10 - Medium - Request and authentication logs may retain PII or sensitive URL data

**Evidence:** [backend/src/utils/logger.js](../../backend/src/utils/logger.js#L79-L98), [backend/src/services/dual-use/authService.js](../../backend/src/services/dual-use/authService.js#L409-L412), [backend/src/services/dual-use/authService.js](../../backend/src/services/dual-use/authService.js#L520-L530)

The HTTP logger records the complete request URL and client IP. Authentication logs include user email and error stacks. The current review found no centralized redaction of query strings, authorization headers, emails, phone numbers, or database/provider details. URLs can carry accidental tokens or personal data even when request bodies are not logged.

**Remediation commands:**

```powershell
git grep -n "logger\.(info|warn|error|http).*email\|req\.url\|req\.headers" -- backend/src
Set-Location backend
npm test -- --runInBand
```

Redact query strings and sensitive fields before logging, use stable user/request identifiers instead of email, suppress stack traces in external responses, and define log retention/access controls in the deployment platform. Add a log-redaction test with authorization, refresh-token, email, and phone fixtures.

## Unavailable infrastructure and unverified runtime checks

These are not counted as additional code findings because the available verified docs state the dependencies are not running:

- PostgreSQL migration state, connection-pool behavior, refresh-token revocation, RLS policies, and transaction/shutdown behavior could not be validated against a live database.
- Redis-backed distributed rate limiting could not be exercised; the source currently defaults to the in-memory implementation.
- MongoDB, Elasticsearch, queue consumers, external OAuth providers, payment providers, SMS, WhatsApp, and Claude provider behavior were not live-tested.
- TLS termination, reverse-proxy `X-Forwarded-For` behavior, private health probe reachability, container signal delivery, and multi-instance draining require the deployed topology.
- No committed environment files or auth-store JSON were reported by `git ls-files`; secret values were not inspected. This does not prove runtime secret-manager configuration or rotation.
- The repository context records zero test coverage. Build/lint/test commands are remediation/verification commands above, not claims that these checks passed in this audit.

## Metrics

| Metric | Value |
|---|---:|
| Verified findings | 10 |
| Critical | 2 |
| High | 4 |
| Medium | 4 |
| Application files changed | 0 |
| Runtime dependency checks completed | 0 |
| Tracked environment/auth-store files found | 0 |

## Release gate

Do not certify production readiness until F-01 through F-06 are remediated and covered by tests. F-07 through F-10 require deployment-specific verification before exposing the service to untrusted traffic.