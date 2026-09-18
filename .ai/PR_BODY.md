## Summary

The platform did not run at the start of this work. The backend exited on
startup, no endpoint had ever served a request, authentication was a mock that
persisted nothing, and 361 of 745 migrations had never been applied.

It now runs end to end: **1,235 of 1,346 probed endpoints answer correctly (92%)**,
up from 21%, with the server stable under a full-surface probe that previously
crashed it.

Every figure below is measured against the running server, not inferred from
source.

---

## Boot and request pipeline

The backend was seven stale route paths from starting. Before repointing the
three `_merged` ones I recovered the deleted originals from git and diffed
them — the surviving files are strict supersets, so no route was lost.

Then the request pipeline itself was broken in three ways, each of which
silently disabled or killed the API:

- **`contentNegotiation`** substring-tested the `Accept` header for
  `application/json`, so it rejected `*/*` **and** the standard browser header.
  Every browser request would have returned 406.
- **`trackResponseTime`** set a header inside `res.on('finish')`, after the
  response is flushed. The `ERR_HTTP_HEADERS_SENT` throw escaped into the
  emitter and destroyed the response.
- **`rateLimit` and `standardizeErrorResponse`** are factories that were
  registered uncalled. Both have `.length === 0`, so Express treated the
  factory as middleware, took the returned handler as a return value, and never
  received `next()`. Requests reaching either layer hung forever — and **no
  rate limiting was ever applied**.

Also repaired 255 unresolved imports across 212 files. The resolver refuses
cross-tree repairs: 63 cases where a backend file's only name match lives in
`frontend/` are reported rather than rewritten, because that is an architecture
decision.

## Two crashes that took the process down

Both were error paths that killed the server instead of returning an error.

- **The logger.** `JSON.stringify(metadata)` with no circular handling. An axios
  failure holds a `ClientRequest` whose `res.req` closes the loop; the throw
  happened inside the winston formatter where nothing catches it. Any loggable
  error was a denial of service.
- **An invalid status code.** A service returned a message where a code
  belonged (`res.status('Failed to retrieve subsidy programs')`). `writeHead`
  throws outside any try/catch. Static analysis found no literal offenders, so
  the guard sits in the response pipeline and coerces anything outside 100–599
  to a logged 500 — covering paths not yet written.

## Authentication was a mock

`routes/authRoutes.js` held an in-memory `Map` with **plaintext passwords** and
issued tokens shaped `jwt_<id>_<timestamp>` — not JWTs. It answered
`success: true` to every registration while persisting nothing, and
`middleware/auth.js` rejected its own tokens. **No protected endpoint was
callable by anyone.**

The real implementation already existed — `services/dual-use/authService.js`,
PostgreSQL-backed, hashed passwords, refresh tokens, 2FA, OAuth, and a
5-req/60s brute-force limiter — reachable only at
`/api/v1/dual-use/auth-service/*`, which nothing called. Now wired, plus a
schema fix (`phone` was inserted into `user_profiles`, which has no such
column).

Verified: register → real UUID persisted; login → valid JWT; `/auth/me` → 200.

## Migrations: one bug was failing 311 of them

Only 384 of 745 had ever applied, and the runner halted on the first failure —
one diagnostic per run. Added `--continue`, which reports every failure in a
single pass while still rolling each migration back individually.

That pass showed 337 failures with **one dominant cause: 311 were
`syntax error at end of input`**.

The cause was the runner. `stripTransactionMarkers` removed transaction markers
with line-anchored regexes, and `END;` is not only a transaction marker — it
also closes a PL/pgSQL block:

```sql
CREATE FUNCTION ... RETURNS TRIGGER AS $$
BEGIN
  ...
END;              -- stripped, leaving the $$ body unterminated
$$ LANGUAGE plpgsql;
```

Every migration defining a trigger function was corrupted before Postgres saw
it. Replaced with a scanner that tracks dollar-quoted bodies, string literals
and comments.

**Result: 308 migrations applied, failures 337 → 29. Tables 1,395 → 1,740.**

## Data: 3,327 curated rows existed only in one Docker volume

An earlier count of "17 rows" was wrong — it came from `pg_stat_user_tables`
without an `ANALYZE`. The real content includes the NE variety directory (142),
products (133), crop vocabularies (306), HSN/GST mappings (31), nutrients (30),
the chart of accounts (20) and government schemes (11). None of it was in the
repository.

`tools/export-reference-seed.js` now exports it as idempotent seed SQL — 75
tables, 1,135 rows — excluding per-environment state. Verified by restoring
into a scratch database: the first attempt **failed** on FK ordering, because
several tables carry circular references that no linear order satisfies, so the
seed loads with deferred constraints and validates every foreign key
afterwards. Clean restore, 0 errors.

Wage and payroll tables were checked specifically and are empty.

## Two product models with nothing joining them

`products` (uuid, catalogue) and `product_listings` (varchar, marketplace
offer) existed in parallel, and seven services joined `order_items.product_id`
straight to `product_listings.id` — 15 API 500s.

Both entities are legitimate (a catalogue item can be offered by several
sellers), so the **missing relationship** was added rather than either side
deleted: `product_listings.product_id → products(id)`, with the id and all 16
referencing FK columns moved to uuid. Every affected table was empty, so this
was metadata-only; that window closes once listings carry data.

`operator does not exist: uuid = character varying`: **15 → 0**.

## The agentic layer was built but never switched on

The platform already had `signalBus`, `decisionEngine` (6 correlation rules),
`reflexEngine`, 9 effectors, `mcda`, `erpAgents` and `aiOrchestrator`. Every one
ships a `start()` that was never called. Measured before the change: 30 signals
emitted from 39 files, **one production handler**.

Three calls at startup attach the layer. Verified with a real scenario — three
independent module signals correlated into one auditable decision:

```
Decision [coldchain.compound_breach]
  actions        hold_shipment, trigger_inspection,
                 reprioritise_logistics, open_claim
  confidence     1        requiresHuman  true
```

Two roadmap items closed on top of that:

- **Security.** Fraud probability 0.97 freezes the actor; 0.42 does not;
  unfreeze without naming an authoriser is refused. No new code was needed once
  the reflex layer was attached.
- **Human-in-the-loop.** `decisionEngine` was stamping `requiresHuman: true`
  and the approval queue already existed (`ai_proposals` /
  `v_ai_approval_queue`), but nothing connected them — decisions asking for a
  person were emitted and discarded. `core/humanReviewBridge.js` now files them
  with rationale and causal chain intact.

## Frontend

No `.env` existed, so defaults applied — and five files named four different
ports, none of them the one in use, so the dev proxy forwarded `/api` to a
closed port. Also aligned 1,232 generated module API calls: 314 pages called
`/api/m100/`, a prefix never mounted, while 347 working module routers sat at
`/api/v1/backend-modules/M100`. Handled the zero-padding difference
(`M31` → `M031`) that accounted for 66 of them. Build passes.

---

## Corrections made during this work

Recorded because they changed conclusions:

| Claim | Reality |
|---|---|
| "0 migrations executed" (all project docs) | 384 had been applied |
| "Snapshot folders are byte-identical copies" | 23,554 files were unique; deleting would have destroyed unmerged work |
| "163 lost API endpoints" | The live tree had *replaced* generated stubs with real implementations |
| "2,391 unreachable endpoints" | Read `index.js`, which is not the mounting source of truth |
| "100% reachable" | Probed without a token; the auth guard answers 401 before routing |
| "17 rows of data" | 3,327 — stale statistics, no `ANALYZE` |

Static analysis was wrong every time here. Runtime is the only honest measure,
and the tooling now reflects that.

## New tooling

One canonical inventory replaces ~60 overlapping scanner scripts:
`deep-scan.js` (68,952 files → SQLite), `inventory-report.js`,
`route-reachability-audit.js`, `signal-graph-audit.js`,
`domain-chain-audit.js`, `fix-broken-imports.js`, `fix-lazy-pool.js`,
`fix-module-api-paths.js`, `fix-user-name-column.js`,
`export-reference-seed.js`, `bisect-middleware.js`,
`check-middleware-arity.js`, `check-route-mounts.js`.

## Reviewer notes

- The first commit (`e5ee63e7`) is a **checkpoint snapshot** of 49,598
  pre-existing uncommitted files. It is a restore point, not authored change —
  review the 17 commits after it.
- 29 migrations still fail (10 missing columns, 8 unimplementable foreign keys)
  and 4 tables are defined nowhere: `refresh_tokens`, `insurance_policies`,
  `fisheries`, `forestry`.
- 45 endpoints still return 500 and 49 return 404, including two literal
  `${basePath}` template bugs.
- `M645100_LIBRARYKNOWLEDGE` was a genuine two-way merge; method parity with
  the retired copy was verified.
- Rate limiting is now genuinely active. Load tooling must set
  `RATE_LIMIT_MAX_REQUESTS`.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
