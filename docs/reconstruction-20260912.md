# EBDESIGN / Lumo Earth reconstruction evidence — 12 September 2026

Status: reconstruction in progress. This is a bounded implementation and verification
record, not a platform completion certificate or a replacement master catalogue.

## Source and authority

The supplied ASTRA mandate ends partway through section 21. Its available requirements
preserve the rural/agricultural enterprise operating system, village/farmer/FPO relations,
the full value chain, and historical identities. No entity or legal-name migration was made.

GitHub connection confirmed `subhesco-bit/AFRERA-EBDESIGN-project`. Existing local changes
were present in hundreds of files before this work; they have not been reset or swept into
a commit. Root `backend/` and `frontend/` are the execution target, as recorded in
`.ai/tasks/ACTIVE.md`. `_ACTIVE_PROJECT`, `_UNIFIED_PROJECT`, and `_MERGE_LAB` remain sources
of historical evidence rather than replacement applications.

Authority documents inspected include `.ai/PROJECT_CONTEXT.md`, `.ai/AGENT_PROTOCOL.md`,
`.ai/tasks/ACTIVE.md`, `_EBDESIGN_LIBRARY/_CONTROL/SAFETY_CONTRACT.md`, the existing master
library and catalogue manifests, and the source authority matrix. Their counts describe
different purposes and snapshots; larger or newer does not automatically mean authoritative.

The new `tools/library-authority-audit.py` reads the existing physical identity registry,
physical path index, enterprise discovery index, master card catalogue, and module card index.
It uses streaming CSV parsing and disk-backed SQLite in 5,000-row batches. It measures empty
and duplicate IDs, scoped path duplication, recorded SHA-256 coverage, malformed records,
physical workspace presence, and disagreements between recorded hashes. It preserves all
source bytes and creates a new audit output exclusively, refusing to overwrite an earlier run.
It does not reassign IDs, select canonical implementations, or equate an absent path with junk.

## Feature preservation and implementation

| Existing source | Preserved capability | Repair and destination | Verification |
|---|---|---|---|
| `services/authService.js` and `services/dual-use/authService.js` | Login, registration, token verification, refresh, MFA and historical public exports | Both password-verification paths delegate to existing `services/authService/passwordUtils.js`; plaintext, malformed fixture hashes, and presenting a stored hash as a password fail closed | Real service login tests with a mocked database boundary and real bcrypt/JWT |
| Existing token issuers and verification services | Existing issuer, audience, expiration and token formats | HS256 and issuer/audience constraints apply in tests as in production | Invalid issuer/audience/algorithm/expiry regression tests |
| `middleware/auth.js` and its compatibility wrapper | Protected routes, roles, permissions, optional authentication | One verification path; valid Bearer access credentials required; refresh credentials cannot authorize protected resources or optional user identity | HTTP rejection before database access; valid access token retained |
| Two image smoke scripts | Existing CLI checks and local cache/trigger checks | Jest owns its process and failure result; CLI uses `process.exitCode`; added cache/batch assertions; removed production-readiness claims | Both scripts run as actual Jest tests without prematurely terminating the suite |
| `legacy/villageProfileService.js` → `modules/M041/service.js` | Existing persistent village registry, profile and district/block routes | Search literal registered before `:villageId`; M041 remains the sole service implementation | HTTP search reaches parameterized canonical SQL; profile lookup remains available |
| `modules/M041/service.js` | Village creation/update/lookup | Positive safe IDs and nonempty string master fields validated before SQL | Invalid ID/create/update HTTP cases |
| `frontend/src/services/api.js` | Existing client API and explicit deployment override | Village search uses mounted GET route; unspecified API host defaults to `/api/v1` | Client contract and deployment-address tests |
| `REOSDashboardPage.jsx` | Village profiles within the existing rural enterprise dashboard | Canonical field names, working search, decimal arithmetic, loading/error/retry/empty states, explicit 100-result cap, and queries only for the active tab | Component tests render actual backend field shape and cover error/retry/search |

No source file or unique feature was retired. No mass consolidation, registry replacement,
database migration, production deployment, or GitHub merge has been performed.

## Verification

- 29 authentication boundary/password tests pass across the two service variants.
- 6 existing production-authentication security tests pass.
- 18 village HTTP tests pass using the actual Express routes, authentication and M041
  service, with PostgreSQL calls mocked at the database boundary.
- 2 repaired image-script tests pass. These verify local contracts, not live image generation.
- 10 frontend client/component tests pass.
- 6 library authority audit tests pass, including quoted multiline CSV, scoped duplicates,
  malformed schema/rows, path containment, source preservation and Windows SQLite cleanup.
- The frontend production build passes. Focused ESLint and JavaScript syntax checks pass.

Repeat relevant checks from the appropriate application directory:

```text
# backend/
npm test -- --runInBand --coverage=false --runTestsByPath src/services/__tests__/authService.test.js src/services/__tests__/authService.security.test.js src/tests/villageProfileRoutes.test.js src/__tests__/auto-generation-test.js src/__tests__/services/aiImageGenerator.test.js

# frontend/
npm test -- --runInBand --runTestsByPath src/pages/REOSDashboardPage.test.jsx src/services/__tests__/villageProfileAPI.test.js
npm run build

# repository root; use a fresh output filename for each audit
python -m unittest discover -s tools -p test_library_authority_audit.py -v
python tools/library-authority-audit.py --verify-paths --output .audit/library-authority-NEW-RUN.json
```

The full backend coverage run was stopped after recording 359 failing suites, before final
coverage/result aggregation. Its incomplete diagnostic log is
`.audit/reconstruction-backend-tests.log`; it must not be reported as a completed test run.
Failures include generated CRUD suites that lack valid database setup, module-resolution
failures, and files named as tests that contain only Express routers. Other passing files
contain only `expect(true).toBe(true)`, which is not feature evidence. No coverage thresholds
were lowered, tests disabled, or placeholder success cases added to hide these failures.

## Remaining work and operational limits

1. Complete authority reconciliation, preserve cross-index ID mappings, and verify missing
   paths against retained archives/worktrees before any retirement decision. Discovery IDs
   currently derive from source label and path; relocation-stable identity reconciliation
   remains necessary, rather than claiming path-derived IDs survive renames.
2. Restore trustworthy tests by feature track. Recover substantive historical tests from
   the merge lab when current tests were replaced by generators; do not repair hundreds
   of unrelated domains with fabricated generic CRUD behavior.
3. Prove village → farmer → FPO → farm/plot → production → inventory → order → delivery →
   settlement linkage against a migrated PostgreSQL environment. The village HTTP tests
   in this batch do not prove database migrations, full transactions or tenant isolation.
4. Audit organization/tenant/geographic authorization consistently across M041 and legacy
   routes. Authentication alone is not sufficient evidence of authorized drill-down.
5. Continue the existing feature consolidation tracks, including AI/copilot and unresolved
   frontend clients, followed by mobile/desktop packaging, infrastructure and real E2E checks.
6. Accounts stored with plaintext or malformed password hashes require password reset or
   an audited migration. The previous insecure comparison is deliberately not preserved.
7. The village search response is capped at 100 records. The dashboard labels this cap;
   its displayed counts are not state/program totals. Program-wide roll-ups remain unverified.
8. Real AI providers, payments, logistics integrations, native packaging, production load,
   secrets configuration and release readiness are not certified by this batch.

The user-authorized complete platform reconstruction remains unfinished.
