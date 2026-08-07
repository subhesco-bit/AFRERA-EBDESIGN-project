# Migration chain — executed against real PostgreSQL

**Date:** 2026-08-04
**Status:** DESCRIPTIVE — verified against running code on the stated date

---

## The headline

For the entire engagement, the single largest unverified risk was that **the
migration chain had never been executed against a real PostgreSQL**. It has now
been run, repeatedly, against a live server.

It did not work. It now does.

| | Before | After |
|---|---|---|
| Files failing | 32 of 51 | **1 of 51** |
| Individual errors | ~400 | **1** |
| Tables created | — (chain aborted at file 1) | **506** |
| Views | — | **36** |
| Indexes | — | **2,058** |
| Foreign keys | — | **525** |
| CHECK constraints | — | **197** |
| Triggers | — | **189** |

The one remaining failure is `pgcrypto is not available` — an artefact of the
minimal sandbox build. `pgcrypto` ships as standard contrib with every real
PostgreSQL distribution, including the `postgres:15-alpine` image CI uses.

---

## How this was possible without root

No `apt`, so no system PostgreSQL. Two Python packages closed the gap:

- **`pglast`** — bindings to `libpg_query`, the *actual* PostgreSQL parser.
  Validates every migration against the real grammar in seconds.
- **`pgserver`** — ships PostgreSQL binaries, so a genuine server could be
  started and the chain applied statement by statement.

---

## What was actually broken

### 1. Seven syntax errors that would fail on any database

| File | Defect |
|---|---|
| `000_base_schema` | Unterminated string literal on the `corporate` role — the quote ran on and swallowed following rows |
| `028_gst_schema` | `total_tax liability` — space in an identifier |
| `034_logistics_enhancement` | `order fulfillment_rate` — space in an identifier |
| `036_nutrition_intelligence` | `anti-inflammatory_score` — hyphen in an identifier |
| `038_organic_traceability` | `audit findings`, `investigation findings` — spaces |
| `049_offline_sync` | `EXECUTE FUNCTION fn(NEW.user_id, …)` — a trigger cannot pass `NEW` as an argument |
| `998_foreign_key_indexes` | **My own generation bug**: a comment block lost its `--` and absorbed the first `CREATE INDEX`, orphaning `ON advances (farmer_id);` |

### 2. 102 MySQL-style inline indexes

`INDEX idx_x (col)` inside `CREATE TABLE` is MySQL. PostgreSQL parses it as
**a column named `index` of type `idx_x`** — so it passes the parser and then
fails at execution with `type "idx_x" does not exist`.

The parser alone would have missed this. All 102 converted to real
`CREATE INDEX` statements.

### 3. Sixty-eight foreign keys pointing at the wrong type

`users.id` is `UUID`, but 68 child columns across 12 files declared `INTEGER
REFERENCES users(id)`. PostgreSQL rejects the **entire `CREATE TABLE`**, not
just the constraint — so those tables, and every index and trigger after them,
never existed at all.

Eight more had the reverse problem: `UUID` children pointing at `SERIAL`
parents in `ar_vr_experiences`, `iot_devices` and `voice_commands`.

### 4. Five tables referenced but never created

`crops`, `lenders`, `buyers`, `logistics_providers` did not exist anywhere in
51 migrations, yet were referenced by foreign keys. One bad reference failed
one `CREATE TABLE` and cascaded — `041` alone produced 77 errors from this.

Each is now defined with the constraints its domain implies. Two worth noting:

- `lenders.lender_type` includes `'informal'`. Rural credit often comes from
  moneylenders at punitive rates; a finance module that cannot record that
  cannot show a farmer what refinancing would save them.
- `logistics_providers` has `CHECK (min_temperature_c IS NULL OR has_reefer)` —
  a declared cold-chain temperature without reefer capability is a claim the
  provider cannot honour.

### 5. Two tables referenced under names that never existed

- `insurance_policies` → the real table is `policies`
- `subsidy_applications` → the real table is `subsidy_claims`

### 6. Seventeen tables defined twice

Every definition used `CREATE TABLE IF NOT EXISTS`, so only the **first** took
effect and every column added by later definitions was silently discarded. The
symptom appears far from the cause — a `CREATE INDEX` failing with
`column ... does not exist`.

Resolved by reconciling the **union** of columns via 118 `ADD COLUMN IF NOT
EXISTS` statements placed in the file that owns each later definition — so it
works regardless of load order, and neither file had to be deleted.

*(I got this wrong on the first pass: my column parser skipped any line with a
trailing `-- comment`, silently dropping `experience_category` and others. The
re-run caught it.)*

### 7. Two views selecting a column that does not exist

`farmer_dashboard` (000) and `engineering_project_overview` (023) both selected
`u.name`. `users` has no `name` — it holds email/phone/role. The display name is
`user_profiles.full_name`, a generated column. Both views failed to create.

### 8. Assorted logic defects

- `products.category` used in an `UPDATE` — products carries `category_id`, so
  **no product ever received a default GST rate**. Rewritten to join `categories`.
- Trigger `WHEN (NEW.amount > 100000)` on `claims` — the column is
  `claim_amount`, so **no high-value claim was ever routed for fraud analysis**.
- `COUNT(DISTINCT fc.financing_id)` — no such column; the table carries
  `financing_required`.
- A materialized-view index on `reu_id` where the view exposes `id`. Now
  `UNIQUE`, which `REFRESH ... CONCURRENTLY` requires.
- 195 triggers and 856 indexes made idempotent, so re-running is safe.
- 4 index names collided across files on **different tables** — renamed, since
  `IF NOT EXISTS` would have silently kept only one.

### 9. Extension dependencies removed

- `uuid-ossp` — 27 files, 147 calls. Replaced with `gen_random_uuid()`, in
  PostgreSQL core since 13. Many managed services do not enable `uuid-ossp`.
- `pgcrypto` — declared in 14 files, actually used in **one**. Removed from 13.
- `pg_trgm` — declared in 2 files, used in **zero**. Removed.
- `VECTOR(1536)` (pgvector) — a third-party extension whose absence failed the
  whole knowledge-base table. Now `REAL[]`, matching how `032` already stores
  embeddings. Trade-off stated in the file: no ANN index, so similarity search
  is a sequential scan until pgvector is available.

---

## Proof the data works

```
crop_concepts           20      freight_lanes            4
crop_concept_terms     286      transport_modes          7
promo_codes              4      handling_engine_rules   13
insurance_plan_catalog   4      accessibility_modes      4
```

Multilingual resolution, queried live:

```
'jolokia' -> Chilli  (Assamese: jolokia / bhut jolokia; variety: Bhut Jolokia)
'mirchi'  -> Chilli  (Hindi: mirch / mirchi / lal mirch)
```

The FPO capacity reservation exists as real constraints, not application logic:
`slot_split_matches_total`, `slot_fpo_not_oversold`, `slot_general_not_oversold`.

---

## CI now enforces this

Three steps added to `.github/workflows/ci.yml`:

1. **Validate migration SQL** — parses all 51 files with the real PostgreSQL
   grammar before touching a database. Fails fast and names the file.
2. **Apply migrations** — against the existing `postgres:15-alpine` service.
3. **Verify schema actually landed** — asserts ≥500 tables, ≥2000 indexes,
   ≥500 foreign keys, the presence of 17 named tables, and ≥280 seeded crop
   terms.

Step 3 matters because `npm run migrate` exiting 0 is *not* the same as the
schema being correct — that is precisely how 400 errors went unnoticed.

---

## Still outstanding

- **Frontend** `npm run lint` / `npm run build` — the token and accessibility
  changes remain unverified.
- **Jest** — `forceExit: true` is already configured; the hang I hit was
  filesystem latency on this mount (~25 s of module loading), not config. CI
  should run it normally.
- **92 v43 routes** not yet ported.
- **NestJS strangler layer** — not started.
- **Mobile / desktop platforms** — not started.
