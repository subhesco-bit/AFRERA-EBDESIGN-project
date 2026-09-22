# AFRERA Master TODO — Ultra-Comprehensive Repair, Enhancement and Upgrade

**Repository:** `subhesco-bit/subh-deep`
**Base:** `consolidated/final` @ `6ddaf8f97`
**Created:** 21 September 2026
**Sources:** the stakeholder assessment ("India-first digital economic operating
system / digital super-organism") plus a **runtime audit of this repository**
performed the same day. Where the two disagree, the runtime audit is recorded
as the fact and the divergence is called out explicitly.

---

## Governing rules (apply to every item below)

1. **Nothing is deleted.** Every existing concept, module, file, service, route
   and page is preserved. Work is classification and enhancement, never removal.
2. **Zero templates, nothing generic.** No item may be closed with boilerplate,
   scaffold text, a copied sibling file, or a generic CRUD stub. Every module,
   ERP function and AI capability must be implemented against *this project's*
   domain. Template-derived files are themselves defects (see **T-1**).
3. **No item is complete without evidence** — runtime, data, tests and
   telemetry. File existence, a passing syntax check, a green mocked test or a
   documentation claim does not close an item.
4. **AI must never fabricate.** Unavailable means unavailable. Confidence is
   reported only when a model supplies it. A rule, random number, hardcoded
   response or thin API wrapper is not production AI.
5. **Sensitive characteristics are never inferred.** Religion, health,
   psychology, caste and similar may be used only as voluntarily declared,
   explicitly consented *constraints*, and may never determine price, credit,
   employment, insurance or eligibility.
6. **Classification vocabulary** — every item carries one:
   `VERIFIED` · `PARTIAL` · `SCAFFOLD` · `DOC-ONLY` · `DISCONNECTED` ·
   `DUPLICATE` · `OVERLAPPING` · `CONFLICTING` · `BLOCKED` · `PROPOSED`

---

## Verified inventory of this repository (21 Sep 2026)

Measured, not quoted from documentation:

| Layer | Measured |
|---|---|
| Backend services | 340 (`backend/src/services/*.js`) |
| Backend routes | 785 (`backend/src/routes/*.js`) |
| Module directories | 545 (`backend/src/modules/`), 347 carrying `service.js` |
| SQL migrations | 789 (`backend/src/database/migrations/*.sql`) |
| Frontend pages | 1,594 (`frontend/src/pages/**/*.jsx`) |
| Frontend components | 489 (`frontend/src/components/**/*.jsx`) |
| Files in module graph audit | 4,760 |

**Module layer is genuinely differentiated, not templated.** 347 `service.js`
files have **347 distinct contents**; `controller.js` 342 distinct of 347;
`routes.js` 323 distinct of 347. This repository is materially more developed
than `AFRERA-EBDESIGN-project`, where sibling module controllers were found
byte-identical. Rule 2 therefore applies going *forward*; the existing module
layer is largely not a template problem.

---

## STAGE 1.0 — Boot and runtime integrity

> Nothing above this line can be trusted until the platform starts and serves
> requests. This is finding 14 of the assessment ("production verification is
> missing") reduced to its precondition.

### Completed in this branch

- [x] **1.0.1 Fix boot-blocking constructor misuse** — `VERIFIED`
  `modules/M400_AI_BACKBONE/backend/service.js` defines `class
  AIBackboneService` but exports a singleton accessor object
  (`{ getInstance, initialize, makeDecision, … }`). `routes/m400AiBackboneRoutes.js`
  called `new AIBackboneService()`, throwing *"AIBackboneService is not a
  constructor"* at require time. Because `routes/index.js` aggregates that file,
  **the entire platform failed to boot.** Now uses `getInstance()`.

- [x] **1.0.2 Fix global rate limiter that hung every request** — `VERIFIED` — *severity: critical*
  `rateLimit` is a factory `(maxRequests, windowMs) => (req, res, next)`, but
  `index.js` registered it as `app.use(rateLimit)`. Express invoked the
  *factory* with `(req, res, next)`; it returned the inner middleware and
  **never called `next()`**. Consequence: every API request hung forever **and
  no rate limiting was ever applied**. Proven empirically before the fix
  (`next()` not called, no response sent, a function returned). Now invoked,
  with `RATE_LIMIT_MAX_REQUESTS` / `RATE_LIMIT_WINDOW_MS` overrides because the
  100-per-15-minute default is tight for a SPA issuing many calls per view.

- [x] **1.0.3 Fix response header write that killed the process** — `VERIFIED` — *severity: critical*
  `trackResponseTime` called `res.setHeader('X-Response-Time', …)` inside the
  `'finish'` event, which fires *after* headers flush. It threw
  `ERR_HTTP_HEADERS_SENT` from an event handler — an uncaught exception that
  **terminated the process on every successful response**. The header is now
  set in a patched `writeHead` before flush; slow-request logging stays in
  `'finish'`, where it touches no headers.

- [x] **1.0.4 Fix content negotiation rejecting wildcards** — `VERIFIED`
  `Accept: */*` — curl's default, and what browsers and most load-balancer and
  k8s probes send — was answered `406 Not Acceptable`. `*/*` and
  `application/*` are now accepted.

- [x] **1.0.5 Governed `aiAPI` facade for 172 call sites** — `VERIFIED`
  **172 calls across 68 module services** invoke
  `aiAPI.generateRecommendation({ task, parameters })` and persist the result
  into business columns (e.g. `ai_content_analysis`). The export did not exist —
  172 latent `TypeError`s. Implemented as a governed facade that satisfies
  assessment finding 5 and the Table-4 output contract at every site at once:
  `status`, `output`, `confidence` (**only when the model reports it**),
  `citations`, `assumptions`, `explanation`, `provenance` (provider, model,
  contract version, requestedAt, latencyMs, inputKeys),
  `actionBoundary: 'advisory_only'`, `humanApproval`, `outcome`. With no
  provider configured it returns `status:'unavailable'`, `output:null` rather
  than inventing a recommendation.

- [x] **1.0.6 Module-graph audit tool** — `VERIFIED`
  `tools/audit-module-graph.js` detects unresolvable relative requires and
  destructured imports the target does not export, exiting non-zero for CI.
  **Correction:** its first version masked *all* string literals, including the
  path inside `require('./x')` itself, so it matched no requires and reported a
  meaningless PASS (measured: 0 of 4 requires visible in
  `services/ai-integration-service.js`). It now masks comments and template
  literals only — template literals because code generators embed `require(...)`
  in strings describing code they emit. With it actually working it found the
  438 defects repaired in 1.0.12–1.0.15 below.

- [x] **1.0.16 Fix `createProduct`, which had never worked** — `VERIFIED` — *core marketplace action*
  The `INSERT INTO products` column list has **26** entries and the values array
  supplies **26**, but the `VALUES` clause listed only `$1..$25` — one short.
  PostgreSQL rejected every call with *"INSERT has more target columns than
  expressions"*, so **no product could ever be created**. The unbound column was
  `created_by`, which is also the ownership column `assertProductOwnership()`
  authorises against. Found by running the listing pipeline end-to-end; no
  static check would have caught it. Verified: products now insert.

- [x] **1.0.17 Fix signal payload access in `disruptionRoutingAgent`** — `VERIFIED` — *crisis path*
  `signalBus.emitSignal` dispatches the whole envelope
  (`{ type, payload, severity, source, entityId, correlationId, timestamp }`),
  so emitted fields live under `signal.payload`. Both handlers destructured
  straight off the envelope, yielding **`undefined` for every field**.
  Demonstrated before fixing: `disruptionId: undefined` via the old access,
  `DISR-42` via `.payload`. Stakeholder notification, shipment rerouting,
  emergency procurement and insurance-claim acceleration were therefore all
  running on undefined inputs — while `TRUTHPACK.json` describes
  `disruption_crisis_management` as `fully_implemented`.
  `core/reflexEngine.js`, `core/decisionEngine.js` and `core/effectors.js`
  already read `signal.payload` correctly; these now match.
  Verified after fix: `disruptionId: "DISR-42"` arrives.

### Open

- [x] **1.0.7 Confirm full boot and sustained request serving** — `VERIFIED`
  Observed on this branch: **773 routes discovered, 773 mounted, 0 failed**,
  377 services, **startup 427 ms**, `/health` → `200`, **14/14 consecutive
  requests served**, process alive, **0 `ERR_HTTP_HEADERS_SENT`**, and
  **0 "Skipping unavailable route"** (previously the `ai-integration` route was
  silently skipped). PostgreSQL, Redis and Elasticsearch absent throughout, so
  this is the degraded-mode path.

- [ ] **1.0.8 Extend the audit to requires that leave `backend/src`** — `PROPOSED`
  1.0.1 was invisible to the audit because the route requires
  `../../../modules/M400_AI_BACKBONE/backend/service` — *outside* the scanned
  root — and because the defect is a constructor/shape mismatch, not a missing
  name. Add: (a) repo-root `modules/` to the scan, (b) a `new X()` check
  against targets whose export is a plain object.

- [ ] **1.0.9 Add `uncaughtException` / `unhandledRejection` handlers** — `PROPOSED`
  1.0.3 proved a single bad response can kill the platform. The root cause is
  fixed; the safety net still does not exist.

- [ ] **1.0.10 Bound optional-infrastructure startup** — `PROPOSED`
  Confirm Redis/queue init cannot leave an unsettled `await` and block
  `listen()`. (This defect existed and was fixed in `AFRERA-EBDESIGN-project`;
  this repo's variant is unconfirmed.)

- [ ] **1.0.11 Repair the M400 route/service contract mismatch** — `CONFLICTING` — *7 endpoints*
  `routes/m400AiBackboneRoutes.js` calls `execute()`, `coordinateAIRequest()`,
  `makeEnterpriseDecision()`, `generateEnterpriseStrategy()`,
  `getCrossModuleIntelligence()`, `registerModule()`, `unregisterModule()`.
  The service exposes **none** of them; its nearest equivalents are
  `makeDecision(context, options)`, `generateStrategy(objectives, state, options)`
  and `coordinateRequest(request)` — **different names and different argument
  order**. Deliberately *not* silently remapped: guessing a signature would
  produce wrong behaviour that looks like working behaviour. Requires a decided
  contract, then implementation on both sides plus tests.

---

## STAGE 1.1 — Authentication and identity (assessment finding 2)

- [x] **1.1.1 Mock authentication path — closed fail-closed** — `VERIFIED` — *was a live exposure*
  **Verified live against a running server, not inferred.** The assessment's
  finding 2 is confirmed exactly, including the token format it named:

  ```
  POST /api/v1/auth/register -> 201  {"token":"jwt_user_1789976455307_1789976455307"}
  POST /api/v1/auth/login    -> 200  (with the plaintext password)
  ```

  `routes/authRoutes.js` keeps users in a process-local `Map` (line 13),
  compares passwords in plaintext (line 37), stores them in plaintext (line 88)
  and mints fabricated non-JWT `jwt_<userId>_<timestamp>` strings. It is
  required at `index.js:175` with **no `app.use` registration**, but
  `discoverAndMountRoutes(routesDir, '/api/v1')` walks the routes directory, so
  it **was auto-mounted and reachable**.

  **Severity, stated precisely:** this was *not* an authorization bypass. The
  tokens it mints are correctly rejected by the real verifier in
  `middleware/auth.js` — protected routes answered `401` both with and without
  one. The real exposure was a reachable endpoint accepting and retaining
  plaintext credentials, plus a login that appears to succeed while granting no
  access (the two-incoherent-auth-systems problem).

  **Remediation:** per the no-deletion rule the implementation is retained but
  gated behind `ALLOW_MOCK_AUTH=true`, defaulting to **disabled**. Confirmed
  after the change: `503 MOCK_AUTH_DISABLED`, with the platform still healthy
  (`/health` 200, 773/773 routes mounted, 0 failed). The flag is a stopgap —
  1.1.2–1.1.7 replace this with a real identity service; do not enable it.

- [ ] **1.1.2 One identity and session authority** — `CONFLICTING`
  Converge mock login and the real `middleware/auth.js` JWT verification.
- [ ] **1.1.3 Single token contract across all frontend clients** — `PROPOSED`
  Assessment reports differing token names and API paths per client.
- [ ] **1.1.4 Short-lived access token, secure refresh, rotation, revocation** — `PROPOSED`
- [ ] **1.1.5 MFA, device management, recovery** — `PARTIAL`
- [ ] **1.1.6 Server-enforced contextual authorization (RBAC + ABAC) with tests** — `PARTIAL`
- [ ] **1.1.7 Production-safe credential handling / secrets management** — `PROPOSED`

---

## STAGE 1.2 — Migrations and data architecture (explicitly requested)

> "all migrations also be included in todo list to complete the job"

**Verified state:** 789 `.sql` files; `migrate.js` present and it *does* skip
already-executed files; **never executed** (no PostgreSQL in any verified
environment, so every service falls back to in-memory and no persistence claim
is trustworthy).

Two concrete schema-ordering defects found:

Measured by `tools/audit-migrations.js` (added in this branch):

| Check | Count |
|---|---|
| Migration files | 789 |
| Reused numeric prefixes (ambiguous order) | 38 |
| Filename ordering hacks (`z`/`zz`) | 19 |
| Files with no recognisable order key | 11 |
| **Objects created in more than one migration** | **263** |
| `CREATE` without `IF NOT EXISTS` (re-run unsafe) | 237 |
| Empty / placeholder migrations | 0 |

Lexical ordering is being used as a dependency mechanism (e.g.
`000_zz2_roles_early_collision_repair.sql`,
`zzzzz_20260920_ai_collaboration_log.sql`), and 263 multiply-defined objects
mean the resulting schema depends on which definition happens to win.

- [x] **1.2.1 Execute all 789 migrations against a real PostgreSQL** — `VERIFIED` — *no longer blocked*
  PostgreSQL 16 stood up locally and the full set applied continue-on-error, in
  the runner's own order, without modifying any migration file.
  **Result after 1.2.1a: 715 of 789 apply; 74 fail** (initially 714/75), in 10 error classes. Full per-file
  breakdown in `.ai/reports/MIGRATION_EXECUTION_REPORT.md`.
  The project's runner halts on first failure, so before this the schema could
  not get past migration **4 of 789** (`001_skeleton_complete_schema.sql`,
  unique violation on `roles_code_key`, `Key (code)=(farmer) already exists`).

- [x] **1.2.1a Fix the 2 SQL syntax errors** — `VERIFIED`
      Both `42601` failures are gone; applied count 714 → 715.
      - `561_3d_rendering.sql` — declared `CREATE TABLE 3d_rendering` and
        `CONSTRAINT 3d_rendering_user_fk`. Neither is a valid unquoted
        PostgreSQL identifier: the parser reads the leading `3d` as a numeric
        literal (`trailing junk after numeric literal`). **Renamed** to
        `rendering_3d` rather than quoted, because the consuming service
        `modules/M261/service.js` interpolated the name unquoted into SQL
        (`SELECT * FROM ${this.table}`) and hit the identical error at runtime —
        so the table was unusable from both directions. Service and
        `MODULES_REGISTRY.js` updated with it. Verified: migration now commits.
      - `9001_north_east_varieties_comprehensive.sql` — used
        `updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
        on `ne_variety_products` and `ne_variety_media`. **`ON UPDATE
        CURRENT_TIMESTAMP` is MySQL syntax**; PostgreSQL has no such clause, so
        the file could never apply. Replaced with this project's own shared
        trigger function `update_updated_at_column()` (defined in
        `032_knowledge_graph_schema.sql`, already reused by
        `9991_1_logistics_enhancements.sql`; `032` sorts before `9001`).
        It now parses and has advanced to a missing-type dependency, which
        belongs to the 1.2.1c group rather than being unapplicable in principle.
- [ ] **1.2.1b Fix 18 foreign-key type mismatches** — `BLOCKED` by 1.2.1d — *root cause identified*
      `42804` / `42703`. **Not 18 independent defects.** Seven are `village_id`,
      and they fail because `villages.id` materialises as `integer` (from
      `012_governance_module.sql`) while 45 of 51 `village_id` declarations
      across the migration set say `UUID`. `001_skeleton_complete_schema.sql`
      defines `villages.id` as `UUID` but its transaction always rolls back
      (see 1.2.1d), so its definition never exists. Fixing 1.2.1d is expected
      to clear most of this group; patching the FKs individually would cement
      the wrong key type in 45 places.
- [ ] **1.2.1c Consolidate 263 multiply-defined objects, then re-run** — `CONFLICTING` — *largest group*
      47 failures are missing relation/column (`42P01`/`42703`) and most should
      disappear once object ownership is settled. `TABLE users` alone is created
      in **four** migrations (`000_base_schema`, `001_skeleton_complete_schema`,
      `1000_user_management`, `3000_M011_generated`) with divergent columns.
      **A mechanical pass does not work:** a blanket
      `CREATE TABLE IF NOT EXISTS` / `ON CONFLICT DO NOTHING` transformation was
      tried in a throwaway copy and made it worse — base schema creates `users`,
      so 001's richer definition is skipped and its columns never exist.
      Which definition is canonical is a schema decision. Note `000-071` are
      protected by project convention and were not edited.
- [ ] **1.2.1d Decide the canonical core schema: `000_base_schema` vs `001_skeleton_complete_schema`** — `CONFLICTING` — *KEYSTONE; decision required*
      **This is the single highest-leverage item in Stage 1.2.** The two files
      define incompatible versions of `users`, `roles`, `states` and `villages`
      and re-seed the same lookup data. `001` runs as one transaction, so it
      always rolls back, and everything it uniquely defines never exists.
      Measured by clearing each collision in a throwaway database:

      | Collision cleared | `001` then fails on |
      |---|---|
      | *(nothing)* | unique violation `roles_code_key`, `Key (code)=(farmer)` |
      | `roles` | unique violation `states_name_key` |
      | `roles`, `states`, `user_roles` | `column "first_name" of relation "users" does not exist` |

      The last cannot be cleared by deleting rows: `000` already created `users`
      **without** `first_name`, so `001`'s `CREATE TABLE users` never takes
      effect. The files disagree on the core table's shape.

      **Recommendation: make `001` canonical** — 45 of 51 `village_id`
      declarations assume its UUID key; `000_zz2_roles_early_collision_repair.sql`
      exists precisely to add the columns `001` needs, so the project has already
      been patching toward `001`; and `001` supplies the richer taxonomy.
      Not applied here: both files are in the protected `000-071` range, row
      deletion is insufficient and conflicts with the no-deletion rule, and
      `ON CONFLICT DO NOTHING` would silently make `000` win. Needs a
      consolidating migration ordered before both, plus a recorded decision in
      `.ai/decisions/`. Full chain in
      `.ai/reports/MIGRATION_EXECUTION_REPORT.md`.
- [ ] **1.2.1e Resolve 3 already-exists collisions** (`42P07`, `42710`) — `DUPLICATE`
- [ ] **1.2.1f Re-run to green and record the applied count** — `BLOCKED` (needs 1.2.1a–e)
- [ ] **1.2.2 Resolve the 38 duplicate-prefix collisions** — `CONFLICTING`
      Deterministic, explicit ordering. Nothing deleted; renumber or declare
      dependencies.
- [ ] **1.2.3 Replace the 60 `zz` ordering hacks with declared dependencies** — `PARTIAL`
- [ ] **1.2.4 Migration register**: owner, purpose, dependencies, reversibility, applied-at — `PROPOSED`
- [ ] **1.2.5 Idempotency and re-runnability check for every migration** — `PROPOSED`
- [ ] **1.2.6 Down/rollback path per migration; tested restore** — `PROPOSED`
- [ ] **1.2.7 Verify every migration actually applies** (syntax ≠ applies) — `BLOCKED` (needs 1.2.1)
- [ ] **1.2.8 Reconcile 789 migrations against the ~545 modules** — `PROPOSED`
      Which module owns which table; find tables no module owns and modules with
      no schema.
- [ ] **1.2.9 Declare a single source of truth per entity** — `PROPOSED`
      PostgreSQL, MongoDB, Redis and Elasticsearch are all referenced.
- [ ] **1.2.10 Lineage, retention, data-quality and deletion controls** — `PROPOSED`
- [ ] **1.2.11 Transactional-integrity tests on money paths** — `PROPOSED`
      Escrow, wallet, payout, subsidy, claim, loan disbursement.

---

## STAGE 0 — Concept reconciliation (the stated precondition)

> Assessment: *"The most important missing element is a verified
> concept-to-runtime matrix."* Exit condition: every concept has a source,
> a meaning and a classification.

- [ ] **0.1 Build the concept-to-runtime matrix generator** — `PROPOSED` — *highest architectural priority*
  Emit, per concept, the full chain from evidence rather than documentation:
  `concept → module → feature → user → workflow → rules → database → service →
  API → authorization → AI → ERP → page → component → test → telemetry`,
  assigning one classification from Rule 6. Must be re-runnable in CI so the
  matrix cannot drift. `tools/audit-module-graph.js` (1.0.6) is the first
  evidence collector; the matrix generalises it.
- [ ] **0.2 Classify all 545 modules and 340 services against the matrix** — `BLOCKED` (needs 0.1)
- [ ] **0.3 Reconcile every "complete" documentation claim against runtime** — `PROPOSED`
      This repo carries extensive completion reports while the platform could
      not boot. Each claim needs an evidence link or an explicit downgrade.
- [ ] **0.4 Catalogue duplicates without deleting** — `DUPLICATE`
      Known: `services/aiBackboneService.js` is a re-export of
      `services/legacy/aiBackboneService.js`; `aiGatewayService.js` exists in
      two variants that the code comments describe as *deliberately* distinct.
      Record intent and a canonical choice for each.
- [ ] **0.5 Module registry with enforced contracts** — `PROPOSED`
      Declared APIs, events, schemas, permissions, migrations, tests, health
      check and owner per module; CI fails a module that declares nothing.
- [ ] **0.6 Forward and reverse traceability (capability registry)** — `PROPOSED`

---

## STAGE 1.3 — API, testing, observability, reliability

- [ ] **1.3.1 One versioned API contract standard** — `PARTIAL`
      785 route files; routes mounted under multiple prefixes.
- [ ] **1.3.2 OpenAPI generated from code, not hand-maintained** — `PARTIAL`
- [ ] **1.3.3 Schema validation + idempotency keys + consistent error envelope** — `PARTIAL`
- [ ] **1.3.4 Error-code registry** — `PROPOSED`
- [ ] **1.3.5 Make `audit-module-graph.js` a CI gate** — `PROPOSED`
- [ ] **1.3.6 Smoke test: server boots and serves N requests** — `PROPOSED`
      The single highest-value test this repo lacks; it would have caught
      1.0.1–1.0.4.
- [ ] **1.3.7 Real coverage on critical journeys** — `PARTIAL`
      Unit, contract, integration, migration, authorization, E2E,
      accessibility, resilience gates.
- [ ] **1.3.8 Correlation IDs, metrics, traces, SLOs, redaction, alert ownership** — `PARTIAL`
- [ ] **1.3.9 Backup restore, graceful shutdown, failover, DR, rollback drills** — `PROPOSED`
- [ ] **1.3.10 Threat model, dependency controls, penetration tests, incident playbooks** — `PARTIAL`
- [ ] **1.3.11 Central consent and purpose architecture** — `PROPOSED`
      Consent receipts, purpose binding, retention, deletion, data-subject rights.
- [ ] **1.3.12 Content governance** — `PROPOSED`
      Effective-dated, reviewed, cited knowledge with ownership, approval,
      expiry, source confidence and correction workflow.

---

## STAGE 2 — Sector excellence: industry-native journeys

> Exit condition: complete agriculture, marketplace, finance, insurance,
> logistics and government journeys. **Pages and CRUD endpoints do not
> constitute a journey.** Each needs a formal state machine with valid
> transitions, authorization, timeout, retry, escalation, compensation and
> audit evidence (assessment finding 6).

- [ ] **2.1 Agriculture lifecycle** — `PARTIAL`
      `plot → plan → finance → procure → operate → monitor → harvest → grade → store → sell → settle`
- [x] **2.2 Farmer product-listing AI pipeline — orchestration built** — `PARTIAL` (4 of 9 stages blocked on schema)
      Requested flow: `listing → AI image → attribute extraction → (if food)
      nutrient valuation → nutrient-based and per-unit pricing → AI premium
      page copy/slogan`.

      **The components all existed and worked. Nothing called them in sequence.**
      Three separate reasons the flow never ran:
      - `middleware/productImageAutoGenerationHooks.js` exports
        `registerAutoGenerationHooks(productService)` with the comment *"Call
        this during app initialization"* — **nothing ever required or called it.**
      - It registers via `productService.on('created', …)`, but `productService`
        is **not an EventEmitter and emits nothing**, so the registration would
        have silently no-opped behind its own `typeof … === 'function'` guard.
      - `nutritionIntelligenceService.calculateNutritionPricing` had **zero
        callers** anywhere in the codebase.

      Built `core/productListingPipelineAgent.js`, following this project's own
      signal-agent pattern (`core/disruptionRoutingAgent.js`): added
      `commerce.product.listed` / `commerce.product.enriched` to the `SIGNAL`
      catalog, emitted the first from `createProduct`, and registered the agent
      at boot. Stage 1 (image generation) is deliberately **not** duplicated —
      `createProduct` already fires it best-effort and records `not_configured`
      honestly.

      **Honesty properties, each tested:** food is never inferred from a product
      name ("Organic Rice 5kg" → `isFood: null` → nutrient stages skipped, not
      assumed); a stage that cannot run records `unavailable`/`skipped` with a
      reason rather than a plausible number; a malformed signal is handled
      without throwing; a failing stage cannot fail the farmer's listing.

      **Verified end-to-end against live PostgreSQL:** product created → signal
      → 9 stages in 24 ms. Food listing: `food_classification`,
      `nutrition_profile`, `value_per_nutrient` → **ok**; `attribute_extraction`
      and `listing_copy` → **unavailable** (no AI key, correctly not
      fabricated). Non-food listing correctly skips 6 stages.

      **Remaining 4 stages are blocked by the schema, not the pipeline:**
      `nutrition_score` (FK violation on `product_nutrition_scores`),
      `nutrient_value_price` (`column "product_name" does not exist`),
      `nutrition_pricing` (cascades from score), `premium_tier`
      (`column "nutrient_density_score" does not exist`). All four are
      consequences of the 74 failing migrations — unblocked by **1.2.1d**.
- [x] **2.3 Consumer order fulfilment with cold chain and insurance — orchestration built** — `PARTIAL`
      Requested flow: `order → payment/escrow → cold-storage allocation →
      cold-chain monitoring → logistics → in-transit insurance → exception →
      claim → settlement`.

      **Every component existed. Nothing connected them.**
      - `commerce.order.placed` was in the `SIGNAL` catalog but **nothing ever
        emitted it**. `core/decisionEngine.js` reads it when correlating order
        and shipment-delay signals, so that logic could never fire either.
      - `services/orderService.js` emits nothing at all.
      - `createOrder` referenced **neither escrow, nor cold storage, nor
        insurance, nor shipment**.

      Built `core/orderFulfilmentPipelineAgent.js`, subscribing to
      `commerce.order.placed` and `iot.temperature.breach`, emitting
      `commerce.order.fulfilment_assessed`, registered at boot.

      **Action boundaries — what it will NOT do, and why.** Each is recorded on
      every stage and was verified by spying on the forbidden calls:
      - creates an escrow **hold** but never releases or refunds — releasing
        requires delivery verification against the escrow's own
        `release_conditions`;
      - **assesses** transit cover but never issues a policy — `issuePolicy()`
        binds cover and charges a premium, which an agent should not commit
        someone to as a side effect of ordering;
      - on a cold-chain breach records the exception and **recommends** a claim
        but never submits one — a claim is a financial assertion against an
        insurer; a temperature reading is evidence for it, not authority.

      **Honesty properties, each tested:** perishability is never guessed
      ("Fresh Tomatoes" with no field → `perishable: null` → cold-chain stages
      skipped, because wrongly assuming "not perishable" spoils produce and
      wrongly assuming "perishable" bills a farmer for storage they did not
      need); a stage that cannot run records `unavailable`/`skipped` with a
      reason; malformed signals are handled without throwing.

      **`shipments.temperature_requirement` is a `NUMERIC` column** but a
      cold-chain requirement is naturally a range. `"2-8C"` is stored as `null`
      and the loss is reported on the stage
      (`temperatureRequirementStated` / `...Stored`) rather than narrowed to a
      midpoint, which would assert a precision the order never gave. `"4C"` and
      `"-18 C"` parse to `4` and `-18`. **The column type is a schema
      limitation worth revisiting** — see 1.2.x.

      **Verified against live PostgreSQL:** `escrow_hold` **ok** (real escrow
      row), `cold_chain_requirement` **ok**, `transit_insurance_assessment`
      **ok** with a genuinely risk-factored quote (`baseRate`, `routeRisk`,
      `durationRisk`, `goodsRisk` — not canned), `cold_storage_allocation`
      **unavailable** ("no cold-storage facility has 40 free units" — honest,
      no facilities seeded). Breach handler: both stages **ok**.
      Forbidden operations invoked across all runs: **none**.

      **Open:** `shipment_creation` builds the correct payload and reaches the
      database, failing only on the `shipments → orders` foreign key because the
      test used a synthetic order id. Verifying it needs a real order fixture
      (cart + user + products), which also needs the schema decision in 1.2.1d.
      `cold_storage_allocation` needs seeded facilities to exercise booking.
- [ ] **2.4 Marketplace / retail** — `PARTIAL`
      `discovery → comparison → trust → cart → payment → fulfilment → return/refund → settlement`
- [ ] **2.5 Insurance journey** — `PARTIAL`
      Need analysis, suitability, coverage/exclusion comparison, policy
      lifecycle, servicing, evidence collection, survey, decision, payout, appeal.
- [ ] **2.6 Banking and rural finance** — `PARTIAL`
      Consented data collection, cash-flow assessment, eligibility, offer
      comparison, sanction, disbursement, monitoring, recovery — explainable.
- [ ] **2.7 Government scheme and subsidy engine** — `PARTIAL`
      Schemes as **cited, effective-dated, computable rules**; eligibility,
      document checklist, application status, grievance, unclaimed-subsidy
      detection. Static descriptions are insufficient.
- [ ] **2.8 Logistics control tower** — `PARTIAL`
      Load consolidation, capacity matching, ETA confidence, chain of custody,
      exceptions, proof of delivery, settlement.
- [ ] **2.9 Engineering platform** — `PARTIAL` (assessment finding 13)
      Standards library, units, assumptions, versioned formulas, CAD/BIM
      ingestion, structural validation, climate-responsive design, cold-storage
      thermal modelling, CFD/airflow, equipment sizing, BOQ and costing, energy
      simulation, constructability, code checking, scheduling, commissioning,
      predictive maintenance, digital twins, **professional approval boundaries**.
- [ ] **2.10 Enterprise ERP as a unified control system** — `PARTIAL` (assessment finding 7)
      Chart of accounts, subledgers, double-entry posting, cost/profit centres,
      tax determination, inventory valuation, three-way matching, bank
      reconciliation, AR/AP, fixed assets, project costing, approval matrix,
      segregation of duties, intercompany controls, period close, audit evidence
      linking every operational transaction to accounts.
- [ ] **2.11 Health and nutrition with clinical safety boundaries** — `PARTIAL`
- [ ] **2.12 Travel discovery, comparison, booking, disruption** — `DOC-ONLY`
- [ ] **2.13 Workflow engine underpinning all of the above** — `PROPOSED`
      Durable orchestration with states, retries, approvals, timers,
      compensating actions. Required by: booking, ordering, payment, refund,
      procurement, RFQ/tender, contract, warehousing, shipment, cold-chain
      exception, policy, claim, loan, subsidy, DPR, engineering approval,
      project execution, certification, recall, grievance, consent withdrawal,
      dispute, accounting reconciliation.

---

## STAGE 3 — Intelligent assistance (governed AI)

- [x] **3.0 AI output governance envelope** — `VERIFIED` (see 1.0.5)
- [ ] **3.1 Canonical model registry** — `PROPOSED`
- [ ] **3.2 AI gateway with model routing, cost and latency governance** — `PARTIAL`
- [ ] **3.3 Permission-aware retrieval** — `PROPOSED`
- [ ] **3.4 Verified knowledge graph** — `PROPOSED`
- [ ] **3.5 Governed vector memory** — `PROPOSED`
- [ ] **3.6 Prompt and policy registry (versioned)** — `PROPOSED`
- [ ] **3.7 Agent / tool permission system** — `PROPOSED`
- [ ] **3.8 AI evidence records** — `PARTIAL` (envelope exists; persistence does not)
- [ ] **3.9 Hallucination detection** — `PROPOSED`
- [ ] **3.10 Human approval workflow** — `PARTIAL` (envelope carries state; no workflow)
- [ ] **3.11 Outcome feedback loop** — `PROPOSED` (`outcome` field reserved)
- [ ] **3.12 Drift and bias monitoring** — `PROPOSED`
- [ ] **3.13 Measurable comparison against a non-AI baseline** — `PROPOSED`
- [ ] **3.14 Remove simulated/random values from business metrics** — `PROPOSED`
      A `MATH_RANDOM_AUDIT.md` exists in the project; findings must be acted on.
      No dashboard may show a business metric without verified source and
      calculation.
- [ ] **3.15 AI-enable every module and every ERP function, non-generically** — `PROPOSED` — *per Rule 2*
      All 545 modules and every ERP area get domain-specific intelligence, not a
      shared wrapper. Tracked per module by the 0.1 matrix.

### Table 4 component-level uplift (each item `PROPOSED`)
- [ ] 3.16 Components → context-aware (explain, detect anomalies, suggest next action, adapt language/accessibility, record feedback)
- [ ] 3.17 Forms → conversational and evidence-aware (OCR prefill, voice, extraction, inconsistency detection, save/resume, explainable validation)
- [ ] 3.18 Search → multimodal intent (voice, image, vernacular, semantic, geographic, task-based, permission-aware)
- [ ] 3.19 Recommendations → causal, contextual, constraint-aware
- [ ] 3.20 Dashboards → adaptive decision workspaces
- [ ] 3.21 Notifications → intelligent intervention (channel, timing, urgency, no fatigue)
- [ ] 3.22 Workflows → AI-assisted and dynamic
- [ ] 3.23 Documents → document intelligence with source coordinates and human verification
- [ ] 3.24 Product page → adaptive trust-and-suitability page
- [ ] 3.25 Insurance page → protection-gap and suitability adviser
- [ ] 3.26 Travel page → contextual journey planner
- [ ] 3.27 Agricultural advisory → farm digital-twin decision system
- [ ] 3.28 Finance → explainable cash-flow intelligence
- [ ] 3.29 Logistics → predictive logistics marketplace
- [ ] 3.30 Marketplace → autonomous demand-supply network
- [ ] 3.31 ERP → continuous intelligent control (anomalies, reconciliation gaps, fraud, margin leakage)
- [ ] 3.32 System → governed AI nervous system
- [ ] 3.33 Project → national rural-economic intelligence network

---

## STAGE 4 — Adaptive experience (assessment finding 4)

- [ ] **4.1 Unified user-context profile** — `PROPOSED`
- [ ] **4.2 Consent and preference ledger** — `PROPOSED`
- [ ] **4.3 Real-time intent engine** — `PROPOSED`
- [ ] **4.4 Page-composition engine** — `PROPOSED`
- [ ] **4.5 Content-ranking service** — `PROPOSED`
- [ ] **4.6 Recommendation explanation** — `PROPOSED`
- [ ] **4.7 Experimentation framework** — `PROPOSED`
- [ ] **4.8 Outcome measurement** — `PROPOSED`
- [ ] **4.9 Preference reset and correction** — `PROPOSED`
- [ ] **4.10 Non-personalized mode** — `PROPOSED`
- [ ] **4.11 Ethical Personalization Constitution (machine-enforced)** — `PROPOSED`
      Enforces Rule 5. No dark patterns, no manipulative urgency, no
      undisclosed behavioural targeting, no discriminatory use.
- [ ] **4.12 Adaptation signals** — `PROPOSED`
      Role, purpose, location, language, device/bandwidth, past activity,
      interests, **voluntarily declared** food/cultural/religious constraints,
      season and weather, business stage, accessibility needs, saved or
      incomplete workflows.

---

## STAGE 5 — India-first and rural access (findings 8, 12)

- [ ] 5.1 Multilingual domain vocabulary, terminology registry, human review — `PARTIAL`
- [ ] 5.2 India geographic hierarchy — `PARTIAL`
- [ ] 5.3 Crop seasons and agro-climatic context — `PARTIAL`
- [ ] 5.4 Mandi and market intelligence — `PARTIAL`
- [ ] 5.5 Land and farmer registries — `PARTIAL`
- [ ] 5.6 Government schemes as effective-dated rules — `PARTIAL` (see 2.7)
- [ ] 5.7 GST / e-invoice / e-way bill workflows — `PARTIAL`
- [ ] 5.8 Regulated payment integration — `PARTIAL`
- [ ] 5.9 FPO / cooperative operations — `PARTIAL`
- [ ] 5.10 GI and provenance — `PARTIAL`
- [ ] 5.11 Indian logistics constraints — `PARTIAL`
- [ ] 5.12 Offline transaction queue, conflict resolution, sync receipts, sync audit trail — `PROPOSED`
- [ ] 5.13 Resumable uploads and store-and-forward workflows — `PROPOSED`
- [ ] 5.14 SMS / IVR interaction state — `PARTIAL`
- [ ] 5.15 Assisted Digital Operator Mode (delegated consent, recorded assistance) — `PROPOSED`
- [ ] 5.16 Shared-device privacy and consent — `PROPOSED`
- [ ] 5.17 Accessible voice confirmation — `PROPOSED`
- [ ] 5.18 Translation quality review — `PROPOSED`
- [ ] 5.19 Recovery after partial connectivity — `PROPOSED`
- [ ] 5.20 WCAG-aligned complete journeys — `PARTIAL`
- [ ] 5.21 Grievance and appeal mechanism — `PROPOSED` (see 7.3)

---

## STAGE 6 — Interface, mobile and design system

- [ ] **6.1 Governed design system** — `PARTIAL`
      Tokens, accessibility primitives, sector templates, composition rules.
- [ ] **6.2 Sector Experience Composer** — `PROPOSED`
- [ ] **6.3 Need-Based Navigation** — `PROPOSED`
      Entry by problem: "sell crop", "find loan", "claim loss", "book
      transport", "reduce electricity cost".
- [ ] **6.4 Verified device coverage and performance budgets** — `PROPOSED`
- [ ] **6.5 PWA baseline and native boundary decision** — `PARTIAL`
      Mobile strategy must be declared (the sibling repo carries Capacitor,
      Tauri and an `android/` tree simultaneously).
- [ ] **6.6 Mobile app** — `PARTIAL`
- [ ] **6.7 Connect 1,594 pages and 489 components to verified backends** — `PARTIAL`
      A page rendering is not evidence its data path works. Driven by 0.1.
- [ ] **6.8 Professional visual/interface design pass, web and mobile** — `PROPOSED`
- [ ] **6.9 Stakeholder-specific page requirements** — `PROPOSED`
      Per stakeholder need, interest, taste, location and **voluntarily
      declared** cultural/religious constraint. Subject to Rule 5.

---

## STAGE 7 — Trust, safety, governance (findings 10, 11)

- [ ] **7.1 Trust Graph** — `PROPOSED`
      Identity levels, credential provenance, transaction-based reputation,
      dispute-adjusted scoring, counterfeit/fraud signals, quality
      certificates, chain of custody, review authenticity, appeal and
      correction, anti-retaliation and anti-popularity-bias, explainable
      indicators.
- [ ] **7.2 Evidence Passport** — `PROPOSED`
      Sources, issuer, date, confidence, consent, ownership and verification
      status attached to products, claims, documents and AI outputs.
- [ ] **7.3 Digital Grievance Spine** — `PROPOSED`
      `complaint → acknowledgement → evidence → decision → escalation → appeal → closure`
- [ ] **7.4 Exception Command Centre** — `PROPOSED`
- [ ] **7.5 Product/Service Suitability Layer** — `PROPOSED`
- [ ] **7.6 Rules-as-Evidence** — `PROPOSED`
      Authority, citation, effective date, jurisdiction, logic, reviewer.
- [ ] **7.7 Benefit Realization Ledger** — `PROPOSED`
      Predicted vs actual cost, income, yield, time, risk, environment.
- [ ] **7.8 Ethical Engagement Engine** — `PROPOSED`
- [ ] **7.9 Analytics integrity** — `PROPOSED`
      Canonical business events, semantic metric definitions,
      source-to-dashboard lineage, data-quality checks, freshness, confidence
      intervals, forecasting validation, causal-vs-correlational labelling,
      experiment assignment, funnel/cohort analytics, model outcome tracking,
      financial reconciliation.
- [ ] **7.10 Sustainability accounting** — `PARTIAL`
      Methodology registry, evidence capture, baselines, emissions factors,
      audit trail, benefit attribution.
- [ ] **7.11 Knowledge platform** — `PARTIAL`
      OCR, structured extraction, rules, sources, graph relationships, vector
      retrieval, permissions, provenance.

---

## STAGE 8 — Digital super-organism: executable mapping (finding 9)

| Concept | Required executable foundation | Status |
|---|---|---|
| Sensory system | Governed ingestion, IoT registry, validation, provenance | `PARTIAL` |
| Nervous system | Event contracts, priority routing, durable workflows | `PARTIAL` |
| Memory | Transactional history, knowledge graph, governed vector memory | `PROPOSED` |
| Brain | Real decision models, simulation, optimization | `PARTIAL` |
| Reflex | Bounded pre-approved automated responses | `PARTIAL` |
| Immune system | Fraud, cyber, quality and compliance response | `PARTIAL` |
| Circulation | Verified payment, inventory, information, logistics flows | `PARTIAL` |
| Conscious control | Human approval, explanation, override, grievance | `PARTIAL` |

- [ ] **8.1 Map every biological concept to services, events, data contracts, workflows, owners, tests and KPIs** — `PROPOSED`

---

## STAGE 9 — Futuristic platform

All `PROPOSED`. Sequenced after Stage 2; recorded to preserve intent.

- [ ] 9.1 Personal Economic Digital Twin
- [ ] 9.2 Village / Cluster Digital Twin
- [ ] 9.3 Autonomous Rural Operations Network (bounded, approval-gated)
- [ ] 9.4 Federated Rural Intelligence
- [ ] 9.5 India Agricultural Knowledge Graph
- [ ] 9.6 Cultural and Dietary Constraint Engine (declared, never inferred)
- [ ] 9.7 Climate Adaptation Autopilot
- [ ] 9.8 Circular Resource Exchange
- [ ] 9.9 Community Benefit Optimizer
- [ ] 9.10 Policy Simulation Laboratory
- [ ] 9.11 Outcome-Based Insurance
- [ ] 9.12 Infrastructure Intelligence Network
- [ ] 9.13 Verifiable AI Decision Passport
- [ ] 9.14 Personal Data Cooperative
- [ ] 9.15 Disaster and Disruption Reflex System
- [ ] 9.16 Synthetic Scenario Exchange
- [ ] 9.17 Natural-Language Enterprise Builder (AI proposes, humans approve)
- [ ] 9.18 Self-Healing Integration Fabric (contracts and telemetry, never speculative edits)
- [ ] 9.19 National Capability Map
- [ ] 9.20 Universal Life-and-Business Event Engine
- [ ] 9.21 Cross-Sector Comparison Engine
- [ ] 9.22 Capability Marketplace (signed modules)
- [ ] 9.23 User-Controlled Digital Profile

---

## Template and genericness debt (Rule 2)

- [ ] **T-1 Replace template-derived module routers in the sibling repository** — `SCAFFOLD`
  In `AFRERA-EBDESIGN-project`, routers for M125, M126, M128, M137, M139, M148
  and M149 were generated by copying sibling M124's router to restore boot.
  That was justified to clear a boot failure but **violates Rule 2** and is
  recorded here as debt: each needs module-specific routing, validation and
  authorization. **This repository is not affected** — its module layer is
  differentiated (347/347 distinct `service.js`).
- [ ] **T-2 Sweep for generic CRUD stubs standing in for domain logic** — `PROPOSED`
- [ ] **T-3 Sweep for scaffold files whose only purpose is making `require()` succeed** — `PROPOSED`
  Known instance pattern: a 3-line `module.exports = {}` with the comment
  *"minimal scaffold so require() succeeds"* was found in the sibling repo.

---

## Maturity sequence and exit conditions

| Stage | Target | Exit condition |
|---|---|---|
| 0 | Concept reconciliation | Every concept has source, meaning, classification |
| 1 | Industry baseline | Identity, data, APIs, workflows, security, testing, observability pass |
| 2 | Sector excellence | Complete industry-native journeys |
| 3 | Intelligent assistance | Grounded recommendations with explanation, confidence, feedback |
| 4 | System intelligence | Events, agents, knowledge, rules, digital twins coordinate safely |
| 5 | Autonomous ecosystem | Low-risk actions automate; consequential actions keep human approval |
| 6 | Futuristic platform | Measurable cross-sector outcomes, resilience, continuous learning |

**Do not generate thousands of new pages or AI services ahead of the baseline.**
Preserve everything, establish the registry, then enhance each accepted concept
at component, feature, system and project level simultaneously.

---

## Immediate next actions, in order

1. **1.0.7** — observe a clean boot and sustained request serving. Until this
   passes, no other claim about this repository is verifiable.
2. **1.1.1a** — determine whether `/api/v1/auth/login` is reachable. Highest
   security exposure; currently unresolved.
3. **1.2.1** — stand up PostgreSQL and execute the 789 migrations. Unblocks
   most of Stage 2.
4. **0.1** — build the concept-to-runtime matrix generator. The assessment's
   stated precondition for everything else.
