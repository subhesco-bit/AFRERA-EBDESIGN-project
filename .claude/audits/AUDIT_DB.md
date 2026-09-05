---
agent: db-auditor
status: fail
findings: 10
---

# DB Audit — Migration Order, Dependencies, and Schema Consistency (3 Sep 2026)

## Current Audit Summary

The migration set is not executable as a clean PostgreSQL bootstrap without broader schema reconciliation. There are 352 SQL files, 40 repeated executable table ownership findings, and 68 mixed-type FK warnings. The ten mechanically certain UUID/integer foreign-key blockers were corrected in five migration files by aligning each FK column with its authoritative UUID primary key. The two runners now share one canonical `schema_migrations` definition with additive compatibility upgrades. Repeated filename prefixes and legacy duplicate table ownership are explicit deterministic warnings; mixed-type FK targets remain ambiguous warnings rather than asserted blockers.

PostgreSQL execution was blocked because no `DATABASE_URL` or credentials were available. No `psql` binary or SQL AST parser was installed.

### Current Findings

- **PASS (10 resolved blockers):** Static preflight initially found 10 unambiguous UUID/integer FK mismatches in `014_platform_foundation_modules.sql`, `3017_m017_consent_management.sql`, `3019_m019_profile_management.sql`, `3100_ecommerce_tables.sql`, and `mfa_schema.sql`. Each was corrected mechanically by changing the local FK column from `INTEGER` to `UUID`; no constraints were removed and no product behavior was changed.
- **WARN:** 40 duplicate table ownership findings and 8 repeated filename-prefix groups remain. They are classified as historical `CREATE TABLE IF NOT EXISTS` no-op/collision diagnostics and execute in lexical filename order, which is logged by both runners.
- **WARN:** 68 FK references point at targets with both matching and conflicting historical types. They are intentionally ambiguous and are not treated as mechanically certain failures.
- **PASS:** `schema_migrations.js` is the only executable definition. Both runners use it and add missing enhanced columns to installations created by the legacy runner.
- **PASS:** Confirmed PostgreSQL datatype/FK failures are recorded non-destructively under `migrations/quarantined/<filename>.sql.json`; original migrations are retained and the run stops for explicit repair.
- **WARN:** No dependency metadata exists, so dependency correctness remains unproven.

### Validation

`node backend/src/database/migration_preflight.js --json` exits `0` with 0 blockers, 0 UUID/integer FK mismatches, 68 ambiguous FK warnings, 40 duplicate-ownership warnings, and 8 prefix-collision warnings. `node backend/src/database/migrations/enhanced_migrate.js up --dry-run` exits `0`, enumerates all 352 files, and logs deterministic lexical ordering. The SQL scope report contains exactly 10 type substitutions across five migration files. The targeted SQL diff check is clean; workspace-wide `git diff --check` still reports unrelated pre-existing whitespace in frontend/docs files. PostgreSQL execution remains unavailable without `DATABASE_URL` and a live database.

## Historical Audit Below

All 6 new service files (`advancedAnalyticsService.js`, `predictiveIntelligenceService.js`,
`iotIntegrationService.js`, `blockchainVerificationService.js`, `digitalTwinService.js`,
`enterpriseIntegrationService.js`) were read in full and every SQL table/column they
actually query was cross-checked against `backend/src/database/migrations/` (grepped, not
sampled) and `backend/src/database/schema-decisions.json`.

Devin's own `.ai/enhancements/TIER_1_COMPLETION_REPORT.md` "Database Tables Needed" list is
**incomplete and partially wrong**. It names 9 tables as needed; the real code needs those 9
**plus** it silently depends on three pre-existing tables (`farms`, `harvests`, `products`)
whose real schemas do not match what the new code queries, and on `iot_devices` /
`blockchain_transactions`, which already exist but under **conflicting shapes** the new code
doesn't match either. Nothing here is a scaffold — every one of these code paths will throw
`column "..." does not exist` or `relation "..." does not exist` the first time it runs against
a live database. Route mounting succeeding at boot proves nothing; these are runtime failures
inside the handlers, not import-time failures.

Highest existing sequential migration: **071_animal_health_schema.sql** (the `0NN_` family runs
000→071 with no gaps). The `9xx_`, `3000_M0xx_`, and `9999_zzz...` families are reserved
ranges with their own late-run/generated-batch ordering semantics per this repo's convention —
a new additive migration should **not** be dropped into any of them. Recommended number:
**`072_tier1_m025_m030_schema.sql`**.

## Findings

### 1. [CRITICAL] `farms` table does not exist at all — digitalTwinService farm-twin path is 100% broken
**Location:** `backend/src/services/digitalTwinService.js` — `verifyFarm()` (line 586-589),
`getFarmRealTimeData()` (line 308-324)

`grep -ri "CREATE TABLE.*\bfarms\b"` across all 96+ migrations returns **zero matches**. The
closest tables are `farm_plots` (056), `farm_information` (022), `farm_activities`/`farm_tasks`
(9999 operations schema) — none named `farms`, none with the columns queried
(`area`, `soil_type`, `current_status`). `createFarmDigitalTwin()` calls `verifyFarm(farmId)`
first, which will always return `undefined` because `SELECT id FROM farms WHERE id = $1` fails
with `relation "farms" does not exist` — every farm-twin creation call throws immediately.
`getFarmRealTimeData()` additionally joins `crops c ON f.id = c.farm_id` — the real `crops`
table (041_rural_life_os_schema.sql) has no `farm_id` column either (see Finding 6).

**Remediation:** Either (a) add a genuine `farms` table if none of the farm-adjacent tables
above are meant to be it, or (b) point `digitalTwinService.js` at whichever table Devin
actually intended (likely `farm_plots` from 056, which has an `id`/owner-ish shape — needs a
human decision, not a guess). This is a code-vs-schema mismatch, not purely a missing-migration
problem — flagging for decision rather than silently picking one.

### 2. [CRITICAL] `iot_devices` — new service writes columns that exist on none of its 3 colliding declarations
**Location:** `backend/src/services/iotIntegrationService.js` — `registerDevice()` (line 32-39),
`getDeviceByDeviceId()` (132-136), `updateDeviceActivity()` (268-272), `getFarmerDevices()`
(360-365)

`iot_devices` is declared **three times**:
- `015_advanced_features.sql:33` (winner, SERIAL PK) — columns: `id, device_id, device_type,
  location, capabilities, owner, metadata, status, last_seen, battery_level,
  firmware_version, created_at, updated_at`
- `031_iot_integration_schema.sql:24` (loser, UUID PK — no-op'd) but this file has explicit
  `ALTER TABLE iot_devices ADD COLUMN IF NOT EXISTS ...` lines (49-56) that DO land regardless
  of the collision, adding `assigned_to, device_category, device_config, device_name,
  location_id, manufacturer, model, signal_strength`.
- `3030_m030_farmer_advisory.sql:17` (loser, SERIAL PK, `farmer_id INTEGER REFERENCES
  farmers(id)` — wrong type, `farmers.id` is UUID) — already flagged `deferred` in
  `schema-decisions.json` for exactly this reason.

Net real shape of `iot_devices` today: `id, device_id, device_type, location, capabilities,
owner, metadata, status, last_seen, battery_level, firmware_version, created_at, updated_at,
assigned_to, device_category, device_config, device_name, location_id, manufacturer, model,
signal_strength`.

`iotIntegrationService.registerDevice()` runs:
```sql
INSERT INTO iot_devices (device_id, device_type, farmer_id, location, specifications,
  firmware_version, status, registered_at, last_active) VALUES (...)
```
**`farmer_id`, `specifications`, `registered_at`, `last_active` do not exist anywhere in the
merged shape above.** This INSERT fails on first call with `column "farmer_id" of relation
"iot_devices" does not exist`. Same for every other method that reads/writes those four names
(`getDeviceByDeviceId`, `updateDeviceActivity`, `getFarmerDevices`, `getAggregatedData`'s join).

`registered_at`/`last_active` are near-synonyms of the winning table's `created_at`/`last_seen`
— per this repo's schema-decisions convention that would normally mean "don't duplicate, use
the existing name." But the **service code itself hard-codes the literal names
`registered_at`/`last_active` in raw SQL strings**, so renaming the code is out of scope for a
DB migration; the columns must be added as real columns (or the service code fixed — flag for
code-fixer, not this audit).

**Remediation — add to the new migration:**
```sql
ALTER TABLE iot_devices ADD COLUMN IF NOT EXISTS farmer_id UUID REFERENCES farmers(id);
ALTER TABLE iot_devices ADD COLUMN IF NOT EXISTS specifications JSONB DEFAULT '{}';
ALTER TABLE iot_devices ADD COLUMN IF NOT EXISTS registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE iot_devices ADD COLUMN IF NOT EXISTS last_active TIMESTAMP;
CREATE INDEX IF NOT EXISTS idx_iot_devices_farmer_id ON iot_devices(farmer_id);
```
(`farmer_id` UUID, matching `farmers.id` — do **not** copy 3030's INTEGER type, that's the
already-documented latent bug.)

### 3. [CRITICAL] `digitalTwinService.js` queries `iot_devices.entity_id` — column doesn't exist, and contradicts iotIntegrationService's own model
**Location:** `backend/src/services/digitalTwinService.js` — `getIoTDataForEntity()` (line
350-357)

```sql
SELECT device_id, device_type, last_active FROM iot_devices WHERE entity_id = $1 AND status = 'active'
```
`entity_id` is not a column in any `iot_devices` declaration (Finding 2's merged list), and
`last_active` is the same missing column from Finding 2. Worse: this reveals that Devin wrote
**two services on the same day that disagree with each other** about how `iot_devices` links to
its owner — `iotIntegrationService.js` links devices to a farmer via `farmer_id`;
`digitalTwinService.js` expects a generic `entity_id` link to any twin-able entity (farm or
crop). These are two different data models sharing one table name, same pattern as the
documented `ai_predictions`/`ai_prediction_log` and `promotions`/`employee_promotions`
collisions in `schema-decisions.json`.

**Remediation:** Do not paper over this with a same-night guess. This needs a decision: either
(a) `digital_twin`-linked IoT devices should look up through `farmer_id` (via the twin's
`owner_id`), and `digitalTwinService.js` needs a code fix, not a schema fix — or (b) a genuine
generic `entity_id`/`entity_type` polymorphic link is wanted, in which case it must be added
carefully (an `entity_id` column with no `entity_type` companion is itself ambiguous — a farm
and a crop could collide on the same UUID). Flagging as `deferred` per repo convention rather
than picking one silently.

### 4. [CRITICAL] `blockchain_transactions` already exists — under a completely different shape than the new service uses
**Location:** `backend/src/services/blockchainVerificationService.js` —
`storeTransaction()` (264-280), `getProductTransactionHistory()` (202-225),
`getCurrentCustody()` (230-245), `getBlockchainStats()` (460-494)

`019_blockchain_traceability_schema.sql:15` already declares `blockchain_transactions` with
Ethereum-style columns: `id (UUID), transaction_hash, block_number, block_hash,
transaction_index, from_address, to_address, gas_used, gas_price, transaction_fee, status,
timestamp, metadata`.

`blockchainVerificationService.js` inserts/selects: `transaction_id, transaction_type,
transaction_data (JSONB), block_height, block_hash, timestamp`. Only `block_hash` and
`timestamp` overlap by name — `transaction_id` ≠ `transaction_hash` (service generates
`tx-${Date.now()}-${random}`, not a real 66-char hash — semantically different), `transaction_type`
doesn't exist at all, `transaction_data` JSONB doesn't exist (019 has `metadata` JSONB but that's
not populated the same way), `block_height` ≠ `block_number`. Every query in this service
against `blockchain_transactions` fails at runtime.

Notably, the new service's actual data shape (`product_id` embedded in a JSONB blob, event
type, actor/custody transfer, timestamp) is **much closer to 019's own `traceability_events`
table** (`product_id, event_type, event_timestamp, actor_id, actor_type, transaction_hash FK,
event_data JSONB`) than to `blockchain_transactions` itself. This looks like Devin re-invented
a table that 019 (an earlier migration, same overall feature area) already built correctly.

**Remediation:** Do not merge into `019`'s `blockchain_transactions` — the concepts genuinely
differ (real on-chain tx metadata vs. an internal custody-transfer audit log), same pattern as
the documented `journal_entries` (3102 vs 996) collision. Recommend a **new, distinctly-named
table** `product_custody_transactions` in the 072 migration, matching what the service actually
writes:
```sql
CREATE TABLE IF NOT EXISTS product_custody_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id VARCHAR(100) UNIQUE NOT NULL,
  transaction_type VARCHAR(50) NOT NULL, -- 'product_creation' | 'custody_transfer'
  transaction_data JSONB NOT NULL,
  block_height INTEGER NOT NULL,
  block_hash VARCHAR(64) NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_pct_transaction_type ON product_custody_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_pct_data_product_id ON product_custody_transactions ((transaction_data->>'productId'));
CREATE INDEX IF NOT EXISTS idx_pct_timestamp ON product_custody_transactions(timestamp);
```
and repoint the service's 5 queries at the new name — a rename, not a blind ALTER onto 019's
table (whose `transaction_hash UNIQUE NOT NULL` constraint the service's fake hashes would
violate on collision anyway).

### 5. [CRITICAL] `verifyProduct()` queries columns that don't exist on `products`
**Location:** `backend/src/services/blockchainVerificationService.js` — `verifyProduct()`
(line 250-259)

```sql
SELECT id, product_name, farmer_id, status FROM products WHERE id = $1
```
The real `products` table (`000_base_schema.sql:149`) has `name` (not `product_name`), no
`farmer_id` column at all (products link to `category_id`/`state_id`/`unit_id`/`created_by`,
not directly to a farmer), and no `status` column (has `is_active BOOLEAN` instead). This query
fails with `column "product_name" does not exist` on every call — meaning
`createProductTransaction()` can never succeed; `verifyProduct()` will always throw before
returning `null` gracefully, which the service doesn't guard for (it only guards against
`!product`, not against a thrown error, so this bubbles up as an unhandled DB error, not the
"Product not found" response the code implies).

**Remediation:** Fix the query to the real column names:
```sql
SELECT id, name AS product_name, created_by AS farmer_id, is_active AS status FROM products WHERE id = $1
```
This is a **code fix** (query text), not a migration — flagging here because it blocks
Finding 4's remediation from being testable until fixed. No `farmer_id` exists to alias from,
though — `products.created_by` is the user who created the listing, not necessarily "the
farmer" semantically. Needs product-owner review, not a blind alias.

### 6. [CRITICAL] `predictiveIntelligenceService.js` / `advancedAnalyticsService.js` query columns/tables that don't exist on `orders`, `order_items`, `crops`, and a `harvests` table that doesn't exist anywhere
**Location:** `backend/src/services/predictiveIntelligenceService.js` — nearly every query
(`getSeasonalRecommendations` 145-160, `getHistoricalDemandData` 194-212,
`getMarketPricingData` 217-236, `getFarmerYieldHistory` 241-258); also
`advancedAnalyticsService.js` — `getFarmerPerformanceAnalytics` (28-44), `getMarketTrendAnalytics`
(84-98), `getPlatformAnalytics` (141-154)

- `harvests` table: **zero `CREATE TABLE` matches anywhere** in the migrations directory.
  Queried in `getSeasonalRecommendations`, `getHistoricalDemandData`'s sibling
  `getFarmerYieldHistory`, joined against `crops`. Every call to
  `predictCropYield()`/`getSeasonalRecommendations()` fails with
  `relation "harvests" does not exist`.
- `orders.farmer_id` — real `orders` table (000_base_schema.sql:220) has `user_id`, not
  `farmer_id`. Used in `advancedAnalyticsService.getFarmerPerformanceAnalytics()`
  (`o.farmer_id = f.id` join).
- `orders.region` — does not exist on `orders` at all. Used in
  `getMarketTrendAnalytics`/`getHistoricalDemandData`/`getMarketPricingData`.
- `order_items.crop_id` — real `order_items` (000_base_schema.sql:253) has `product_id`, no
  `crop_id`. Used in every crop/order join in both services.
- `order_items.price_per_kg` — does not exist (`order_items` has `unit_price`/`total_price`).
  Used in `getMarketPricingData`.
- `crops.farmer_id`, `crops.crop_type`, `crops.expected_yield_kg`, `crops.created_at` filter
  usage, `crops.variety`, `crops.growth_stage`, `crops.current_health`,
  `crops.estimated_yield_kg`, `crops.planting_date`, `crops.expected_harvest_date`,
  `crops.growing_period_days`, `crops.climate_requirements` — the one real `crops` table
  (`041_rural_life_os_schema.sql:29`) is a **crop catalog/taxonomy** (`crop_code, common_name,
  scientific_name, category, season, duration_days, is_perishable`), not a per-farmer planted
  crop instance. None of the above columns exist on it.

This is not a missing-migration problem at all — it's that **two brand-new services were
written against an imagined "planted crop instance with yield/harvest tracking" schema that was
never built**, while the real `crops` table is a static catalog. Every analytics/prediction
query in both files will fail at runtime; none of this can work until either a real
farmer-crop-planting-instance table is designed (out of scope to invent here) or these two
services are rewritten against the real schema (`rural_economic_units`, `orders.user_id`, etc.).

**Remediation:** Flag as `deferred` per repo convention — this is a product-schema design gap,
not a one-line ALTER. Recommend a follow-up ticket to design a `crop_plantings`/`crop_cycles`
table (farmer_id, crop_id FK to the catalog, planting_date, expected_yield_kg, growth_stage,
harvest records) before either service can function, rather than bolting 10+ unrelated columns
onto the catalog `crops` table.

### 7. [HIGH] Genuinely missing tables (no CREATE TABLE anywhere, no synonym in schema-decisions.json)
Confirmed via `grep -ri "CREATE TABLE.*\b<name>\b"` across the full migrations directory —
zero matches for all of these:
- `analytics_data` — used by `advancedAnalyticsService.buildCustomQuery()` (dynamic
  metrics/filters/groupBy query against `FROM analytics_data`).
- `digital_twins` — used throughout `digitalTwinService.js`. (023_engineering_schema.sql has
  `digital_twin_sensors`/`digital_twin_data` — different concept, engineering-asset sensor logs,
  not a twin registry with `twin_id/entity_type/entity_id/owner_id/specifications`. Not a
  synonym.)
- `twin_simulations` — used by `storeSimulationResults()`.
- `enterprise_integrations` — used throughout `enterpriseIntegrationService.js`.
- `integration_sync_logs` — used by `logSyncActivity()`/`getRecentSyncActivity()`.
- `payment_records` — used by `storePaymentRecord()`. (`000_base_schema.sql:286` has a
  `payments` table but it's order/checkout payments — `order_id, user_id, payment_method,
  payment_status` — not integration-gateway payment records keyed by `integration_id`. Not a
  safe merge target: different owner concept, `payments.order_id` is `NOT NULL`-implied by
  domain but the new service's payments aren't necessarily tied to a marketplace order.)

**Remediation:** create all 5 as new tables (specs below). None of these have a same-name
collision to resolve — they are simply absent, matching Devin's own completion report on this
point (his report was right about existence, just incomplete on `farms`/`harvests`/
`products`/`iot_devices`/`blockchain_transactions` above).

### 8. [MEDIUM] `iot_sensor_data` — a same-purpose-but-wrong-shape table already exists as `sensor_data`
**Location:** `backend/src/services/iotIntegrationService.js` — `processDataBuffer()` (232-262),
`getRecentDeviceData()` (319-331), `getAggregatedData()` (455-498)

`031_iot_integration_schema.sql:67` declares `sensor_data` (not `iot_sensor_data`):
`id (UUID), device_id INTEGER REFERENCES iot_devices(id), sensor_type, sensor_value,
unit, reading_timestamp, location_id, quality_score, is_anomaly, anomaly_score, metadata,
created_at`.

This is the closest thing to a synonym in this whole audit, but it's **not safe to just
rename/point at**: `sensor_data.device_id` is an `INTEGER` FK to `iot_devices.id` (the SERIAL
surrogate key), while `iotIntegrationService.js` inserts/selects using the **business
`device_id` string** (e.g. `'sensor-001'`) directly as the join key — it never looks up the
surrogate integer id first. Also column names differ: service uses `value`/`quality`/`timestamp`,
table has `sensor_value`/`quality_score` (a different semantic — 0-100 score vs. the service's
`good`/`out_of_range`/`invalid` string enum) /`reading_timestamp`.

**Remediation:** treat as `deferred` in `schema-decisions.json` terms — genuinely the same
concept, real risk (FK type mismatch + enum-vs-score semantic mismatch), not safe to merge
without a live database and a decision on which of the two `quality` representations wins.
Do not create a second `iot_sensor_data` table as a rename target for 031's `sensor_data`;
recommend the new migration create `iot_sensor_data` as its own table (matching what
`iotIntegrationService.js` actually writes) and separately flag `sensor_data` vs
`iot_sensor_data` as a follow-up reconciliation once IoT ingestion is live and one of the two
device-linking strategies (integer-id vs business-id) is chosen platform-wide.

### 9. [INFO] Migration numbering / ordering
Highest sequential (`0NN_`) migration is `071_animal_health_schema.sql` — no gaps 000→071.
The `9xx_` range (991-999) is used for "recovered/reconciliation, run late" migrations; the
`3000_M0xx_generated.sql` range is Devin's generated-module batch (already up to M046 per recent
commits); the `9999_zzzz...` range is explicitly reserved as "run absolutely last" (see
`schema-decisions.json` comments on `roles`/`climate_risk_assessments` collisions). None of
these ranges are appropriate for fresh, non-reconciliation table additions.

**Recommendation:** number the new migration **`072_tier1_m025_m030_schema.sql`**, immediately
following `071_animal_health_schema.sql`, containing the `CREATE TABLE`s from Finding 7, the
`ALTER TABLE iot_devices` from Finding 2, and the renamed `product_custody_transactions` table
from Finding 4 (do **not** touch `019_blockchain_traceability_schema.sql`'s existing
`blockchain_transactions` shape). Do **not** attempt migrations for Findings 1, 3, 6, 8 in this
pass — each requires a product/architecture decision this audit is not positioned to make
unilaterally, consistent with how `schema-decisions.json` already marks comparable cases
`deferred` rather than guessed.

## Proposed CREATE TABLE specs (Finding 7 — safe to migrate as-is)

```sql
-- analytics_data: generic event/metric store queried dynamically by
-- advancedAnalyticsService.buildCustomQuery() — columns are selected/filtered by
-- caller-supplied names, so this needs a flexible base shape.
CREATE TABLE IF NOT EXISTS analytics_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name VARCHAR(100) NOT NULL,
  dimensions JSONB DEFAULT '{}',
  value DECIMAL(20, 4),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_analytics_data_metric ON analytics_data(metric_name);
CREATE INDEX IF NOT EXISTS idx_analytics_data_created_at ON analytics_data(created_at);

-- iot_sensor_data: matches iotIntegrationService.js's actual INSERT/SELECT column list
-- exactly (device_id as the business string id, not iot_devices.id surrogate — see Finding 8).
CREATE TABLE IF NOT EXISTS iot_sensor_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id VARCHAR(100) NOT NULL,
  sensor_type VARCHAR(50) NOT NULL,
  value DECIMAL(15, 4) NOT NULL,
  unit VARCHAR(20),
  quality VARCHAR(20), -- 'good' | 'out_of_range' | 'invalid'
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_iot_sensor_data_device_id ON iot_sensor_data(device_id);
CREATE INDEX IF NOT EXISTS idx_iot_sensor_data_timestamp ON iot_sensor_data(timestamp);
CREATE INDEX IF NOT EXISTS idx_iot_sensor_data_device_type ON iot_sensor_data(device_id, sensor_type);

-- digital_twins: matches digitalTwinService.js's createFarmDigitalTwin/createCropDigitalTwin/
-- getTwinById column list exactly.
CREATE TABLE IF NOT EXISTS digital_twins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  twin_id VARCHAR(100) UNIQUE NOT NULL,
  entity_type VARCHAR(20) NOT NULL, -- 'farm' | 'crop'
  entity_id UUID NOT NULL,
  owner_id UUID REFERENCES farmers(id),
  name VARCHAR(255),
  location JSONB,
  specifications JSONB DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_synced TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_digital_twins_entity ON digital_twins(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_digital_twins_owner ON digital_twins(owner_id);
CREATE INDEX IF NOT EXISTS idx_digital_twins_status ON digital_twins(status);

-- twin_simulations: matches storeSimulationResults() exactly.
CREATE TABLE IF NOT EXISTS twin_simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  twin_id VARCHAR(100) NOT NULL REFERENCES digital_twins(twin_id) ON DELETE CASCADE,
  simulation_id VARCHAR(100) UNIQUE NOT NULL,
  results JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_twin_simulations_twin_id ON twin_simulations(twin_id);

-- enterprise_integrations: matches registerIntegration()/getIntegration() exactly.
CREATE TABLE IF NOT EXISTS enterprise_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id VARCHAR(100) UNIQUE NOT NULL,
  integration_type VARCHAR(50) NOT NULL, -- 'erp'|'payment_gateway'|'logistics'|'analytics'|'communication'
  integration_name VARCHAR(255) NOT NULL,
  endpoint_url TEXT NOT NULL,
  api_key TEXT NOT NULL, -- base64 obfuscated by service, NOT real encryption — see security audit
  config JSONB DEFAULT '{}',
  organization_id UUID,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_tested TIMESTAMP,
  deactivated_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_enterprise_integrations_org ON enterprise_integrations(organization_id);
CREATE INDEX IF NOT EXISTS idx_enterprise_integrations_type ON enterprise_integrations(integration_type);
CREATE INDEX IF NOT EXISTS idx_enterprise_integrations_status ON enterprise_integrations(status);

-- integration_sync_logs: matches logSyncActivity()/getRecentSyncActivity() exactly.
CREATE TABLE IF NOT EXISTS integration_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id VARCHAR(100) NOT NULL REFERENCES enterprise_integrations(integration_id) ON DELETE CASCADE,
  sync_type VARCHAR(50),
  data_type VARCHAR(100),
  sync_direction VARCHAR(20), -- 'push'|'pull'|'bidirectional'
  records_processed INTEGER DEFAULT 0,
  status VARCHAR(20),
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_integration_sync_logs_integration_id ON integration_sync_logs(integration_id);
CREATE INDEX IF NOT EXISTS idx_integration_sync_logs_created_at ON integration_sync_logs(created_at);

-- payment_records: matches storePaymentRecord() exactly. Intentionally NOT merged into the
-- existing marketplace `payments` table — see Finding 7 rationale.
CREATE TABLE IF NOT EXISTS payment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id VARCHAR(100) UNIQUE NOT NULL,
  integration_id VARCHAR(100) NOT NULL REFERENCES enterprise_integrations(integration_id),
  order_id VARCHAR(100),
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  status VARCHAR(20),
  transaction_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_payment_records_integration_id ON payment_records(integration_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_order_id ON payment_records(order_id);
```

## Metrics

- Service files audited: 6/6 (100%), full file read, not sampled
- Migration files searched: ~96 (grep across full directory, not sampled)
- Tables referenced by the 6 services: 16 distinct table names
  - Already exist, shape matches: 0
  - Already exist, shape conflicts (need code fix and/or careful rename, NOT blind ALTER): 5
    (`iot_devices`, `blockchain_transactions`, `products`, `orders`, `order_items`, `crops` —
    listed as 5 because `orders`/`order_items`/`crops` are one connected Finding 6 issue)
  - Missing entirely, safe to create as new tables: 7 (`analytics_data`, `iot_sensor_data`,
    `digital_twins`, `twin_simulations`, `enterprise_integrations`, `integration_sync_logs`,
    `payment_records`)
  - Missing entirely, no safe synonym, needs product decision: 2 (`farms`, `harvests`)
- Critical findings: 6
- High findings: 1
- Medium findings: 1
- Info findings: 1
- Runtime-broken code paths at current schema state: every public method in all 6 services that
  touches the database (registration, sync, analytics, prediction, twin creation/sync,
  blockchain transaction creation/verification) — **0 of the 6 services can complete a real
  database round trip today.**

*Verified By VibeCheck ✅*
