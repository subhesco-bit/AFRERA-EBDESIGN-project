# Consolidation Reconciliation — BR-08 Variant Sweep + Tier-1 Divergent-File Triage

**Date:** 2026-09-18
**Branch:** `consolidated/final`
**Scope note (read first):** This session was briefed against two documents —
`docs/consolidation-audit/ULTRACOMPREHENSIVE_CONTENT_AUDIT.md` (claimed: hash-compared
every file on 62 refs against `consolidated/final`, found 11,693 gaps, 4,081
"meaningfully different") and a prior "BR-08 sweep completion" section of this same
report file. **Neither exists anywhere in this repository's working tree or git
history on any of the 63 branches/tags checked.** The real, equivalent prior work
that *does* exist is `.ai/tasks/ACTIVE.md` (duplicate-file collapse pass, ~890 lines,
real and verifiable) and the two live BR-08 commits `d927e594` / `bf49ab52`
(`git show` confirms both). This report was built fresh, re-deriving the audit
methodology from scratch as the original task instructions anticipated ("regenerate
if not, it's cheap") rather than continuing a pass that never happened. Numbers below
are new, not a continuation of a prior count.

---

## Part B — BR-08 variant reconciliation (6 filenames)

Method: for each filename, enumerated every content-distinct blob at every path it
appears under across all 63 branches/tags (`git ls-tree -r <ref>` per ref, deduped by
oid), diffed each variant against the current live copy
(`backend/src/services/legacy/<name>.js` — confirmed the live path for all six via
`services/index.js` require-chain tracing and direct `require()` grep, same method as
the existing `bf49ab52` precedent), and for anything containing `withTransaction`
that current lacked, read the full diff rather than trusting the grep count alone.

| File | Live-path variants found | Outcome |
|---|---|---|
| `offlinePaymentService.js` | 3 (incl. the already-fixed `bf49ab52` state) | No new gap. The 2 older variants are pre-fix baselines, function-set-identical to current. The bare-path (`services/offlinePaymentService.js`, non-legacy) variant is the pre-collapse full duplicate, confirmed by its own in-file comment — already consciously collapsed to a thin re-export. |
| `bulkOrderService.js` | 4 | No gap — current is a **superset**: one variant lacks the `withTransaction` wrap on `rejectQuotation` that current already has. **Flagged (not a BR-08 issue, separate pre-existing problem):** this service has 3 simultaneously-live variants — `services/legacy/` (used by the controller, `bulkOrderDomainRoutes.js`, `marketplaceEnhancements.js`, module `M108100_BULKORDER`), `services/bulkOrderService.js` at root (a full class-based reimplementation, used by `routes/bulkOrders.js`), and `services/commerce/bulkOrderService.js` (used by `routes/commerce/marketplaceEnhancements.js`). Unlike the other 5 BR-08 files, this one was never actually collapsed to a single live path. Out of scope to fix here (a require-graph unification, not a transaction-safety port) — flagged for a dedicated follow-up. |
| `completeERPIntegrationService.js` | 4 | No gap. One variant is an earlier, less-complete version of the same BR-08 pass (4 `withTransaction` call sites vs. current's 14, but the same 5 GL-posting function signatures, no unique content). Two others are pre-fix baselines, function-set-identical to current. |
| `logisticsService.js` | 5 | No gap. The one variant with `withTransaction` present (`registerDriver`) applies the functionally-identical fix with different variable names only. |
| `offlineSyncService.js` | 4 | **Real gap found and ported.** See below. |
| `organicTraceabilityService.js` | 4 | No gap. Same stylistic-only pattern as logisticsService. |

### The real BR-08 gap: `offlineSyncService.resolveSyncConflict`

An older branch variant (blob `ec5db88e`) read the conflict row **inside** the
`withTransaction` boundary and passed `lockTables: ['sync_conflicts']`. The current
live code (pre-fix, blob `abf22710`) reads it via a plain `pool.query()` **before**
`BEGIN`, with no lock. That gap lets two concurrent `resolveSyncConflict` calls for
the same `conflictId` both pass the not-found/status check before either writes,
double-applying the winning data — a real double-apply bug, not just a duplicate
status update.

**Fixed** in `backend/src/services/legacy/offlineSyncService.js` (commit `4624614c`):
moved the `SELECT` inside the transaction and restored
`lockTables: ['sync_conflicts']`, keeping current's cleaner variable naming
otherwise. `node --check` passed.

---

## Part A — Tier-1 divergent-file triage (payment/finance/auth/migrations)

The original 4,081-file gap list could not be re-derived (its source document does
not exist), so this pass re-derived a tier-1-only triage directly: 913 candidate
paths (all `backend/src/*` files matching `payment|finance|wallet|escrow|transaction`,
`auth|security|permission`, plus all 352 files under `backend/src/database/migrations/`),
cross-referenced against every blob at that exact path across all 63 branches/tags.

**Coverage achieved this pass: tier 1 only — the highest-risk tier — screened in
full (913/913 paths); the 176 files found to have any variant were size-delta
ranked; the top ~10 by delta (plus all finance/auth `.js`/`.json` files, which had
zero variants at all) were read and diffed by hand.** Tiers 2 (core services /
`backend/src/core`), 3 (routes/modules), and 4 (frontend/docs/config) — the bulk of
what would correspond to the original "4,081" — were **not** touched this pass.

### Result: JS/JSON finance & auth code — clean
All 72 finance/payment/wallet/escrow/transaction `.js` files and all auth/security
`.js` files are **byte-identical across every one of the 63 branches**. Zero
divergence, zero risk in this slice. (The one JSON hit, `auth_store.json`, is
runtime seed/state data, not source — expected to differ, not a code gap.)

### Result: migrations — 176/352 files have at least one branch variant; 737 are clean
Of the 176, ranked by byte-size delta against current, the top ones read in full:

| File | Verdict |
|---|---|
| `000_base_schema.sql` | Superseded — current is a strict superset (pure index additions, zero removed lines vs. the largest-delta variant). |
| `015_authorization_service.sql` | **Looked like a gap, confirmed already handled.** A variant had a self-healing `ALTER TABLE roles ADD COLUMN ...` block (for `hierarchy_level`, `default_permissions`, etc.) that current's copy of this specific file lacks — because `000_base_schema.sql` declares a narrower `roles` table first, so 015's own `CREATE TABLE IF NOT EXISTS roles` is a no-op and its `CREATE INDEX idx_roles_hierarchy_level` would otherwise fail. Verified this is **already repaired**, correctly, by `backend/src/database/migrations/9999_..._roles_collision_repair.sql`, which restores all the same columns plus the index, later in migration order. No action needed — the fix just lives in a different, better file than the removed comment implied. |
| `014_platform_foundation_modules.sql` | **Real, unfixed, migration-aborting bug — NOT ported (see below).** |
| `094_create_digital_twin_tables.sql` | **Real, unfixed, migration-aborting bug — fixed.** See below. |
| `097_ai_image_generation_enhanced.sql` | No gap — current is a reformatted/idempotency-hardened version (added `IF NOT EXISTS` to indexes), functionally equal or better. |

### Real gap #1 — fixed: `094_create_digital_twin_tables.sql`
`digital_twins`, `iot_devices`, `sensor_readings`, `simulations.farm_id` were typed
`INTEGER REFERENCES farms(id)`, but `farms.id` is `UUID` (per
`001_skeleton_complete_schema.sql`, which runs first). An `INTEGER` FK against a
`UUID` PK is rejected outright by Postgres, aborting the migration run at this file
on any real database. A `claude/*` branch (blob `7fca1baf`, dated 2026-09-12) had
already found and fixed this — retyped all four columns to `UUID` and restored the
idempotent collision-repair `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` block for
`digital_twins`/`iot_devices` (both tables are declared by more than one migration;
first-declaration-wins means the correctly-typed later declaration never took
effect without this repair — same pattern already proven in
`999_schema_reconciliation.sql` for other `iot_devices` columns). That fix never
reached `consolidated/final`. **Ported** in commit `040a45af`. 094 is outside the
`000_071` freeze in `CLAUDE.md`, so this was a normal fix to apply.

### Real gap #2 — found, NOT ported (needs a human decision): `014_platform_foundation_modules.sql`
Same bug class, same root cause: `environments.organization_id` and
`sso_configurations.organization_id` are typed `INTEGER REFERENCES organizations(id)`,
but `organizations.id` is `UUID` (per `001_skeleton_complete_schema.sql`, which also
creates that table first). Same failure mode: migration run aborts at this file. A
`claude/*` branch (blob `1f159b8c`, also dated 2026-09-12, same session as the 094
fix above judging by the identical comment style) has the correct `UUID` retype and
an explanatory comment that explicitly says *"Approved as an exception to
CLAUDE.md's 000-071 freeze"* for making this change.

**This file is `014_...sql` — inside the `000-071` migration freeze this repo's own
`CLAUDE.md` declares (`DO NOT CHANGE: Core database schema migrations (000-071)`).**
The branch that fixed it did so under an explicit, documented exception; this
session was not given that same explicit authorization, so the fix was **not
applied**, in line with `CLAUDE.md`'s constraint and the harness's own permission
system (which independently declined a write to this path as a "shared resource"
modification). **This is the single highest-priority action item from this
session**: someone with authority over the freeze should either grant the same
exception applied on the source branch (cherry-pick blob `1f159b8c`'s two-line
retype + comment) or explicitly confirm the freeze should hold and the bug should be
worked around elsewhere (e.g., a `9999_...` repair migration in the same style as
the `roles` fix above, which would not require touching 014 itself).

### Confirmed already-superseded (no unique content lost)
Beyond the table above: all pre-fix/older variants checked for `bulkOrderService`,
`completeERPIntegrationService`, `logisticsService`, `organicTraceabilityService`
(function-signature-set diffed against current — zero functions present in any old
variant and absent from current, across 10 variant blobs). `000_base_schema.sql`
and `097_ai_image_generation_enhanced.sql` likewise. Total confirmed-superseded
files this pass: **~12** (the ones actually read in full; not claiming this for the
~164 unread lower-delta migration variants).

### Honest remaining count
- **176 migration files with at least one branch variant** — 5 read in full this
  pass (2 real gaps, 3 confirmed clean/superseded), **171 not yet read**. Many of
  these are very small deltas (e.g. the `3000_M0xx_generated.sql` family all show an
  identical ~11-line delta, almost certainly just a generation-timestamp header —
  low-risk, worth a fast batch check rather than individual reads next time, but not
  verified).
- **737 migration files confirmed byte-identical** across all 63 branches — zero
  risk, no further action needed on these, ever, unless a branch is added later.
- **Tiers 2-4 of the original request (core services, routes/modules, frontend,
  docs/config) — 0 files reviewed this pass.** The 913-path tier-1 scope was chosen
  deliberately per the task's own risk ranking (payment/auth/migrations first); the
  broader sweep across `backend/src/services/**`, `backend/src/core/**`, routes, and
  frontend was not started. Given the JS-file result in tier 1 (100% identical
  across all branches, zero gaps), it is plausible — not verified — that a similar
  pattern holds for other backend service files, but that is a hypothesis for the
  next pass to test, not a finding.

**Where the next pass should start:** the 171 unread migration variants (fast,
bounded, same size-delta ranking already computed), then tier 2
(`backend/src/services/**`, `backend/src/core/**`) using the same
ls-tree-across-all-branches method, which this session validated is workable within
a single sitting for a path set of this size.

---

## Commits this session
- `4624614c` — offlineSyncService.resolveSyncConflict transaction/lock fix (Part B)
- `040a45af` — digital_twins/iot_devices/sensor_readings/simulations.farm_id UUID retype (Part A)

## Action items for a human
1. **Decide on `014_platform_foundation_modules.sql`** — apply the same freeze
   exception the source branch used, or fix via a `9999_...` repair migration
   instead of touching 014 directly. Left unfixed pending that decision.
2. Consider whether `bulkOrderService`'s 3-way live-path split (legacy / root /
   commerce) should be unified — flagged, out of scope for this pass.

---

## Systemic FK type-mismatch sweep (70 non-frozen fixes)

**Date:** 2026-09-18
**Tooling:** order-aware FK checker (re-derives `migrate.js`'s `CREATE TABLE IF NOT
EXISTS` "first file wins" semantics per table, then flags any FK column whose type
doesn't match its target's *actually-winning* column type — not just its own file's
declared type). Read-only; run as `node order-aware-fk-check.cjs <db-dir>`.

**Baseline:** 78 total order-resolved mismatches. 8 of these fall inside the
CLAUDE.md freeze on migrations 000-071 (`014_platform_foundation_modules.sql` ×2,
`041_rural_life_os_schema.sql` ×4, `047_gst_tables.sql` ×1,
`061_village_project_dpr_subsidy_intelligence.sql` ×1) and were left untouched —
out of scope, pending explicit human sign-off on the freeze exception. This pass
covers the remaining **70**, all in files with numeric prefix ≥ 072 or no numeric
prefix.

### Clean fixes: 62 of 70

Each is a single `CREATE TABLE` column retype (`INTEGER`→`UUID` or `UUID`→`INTEGER`)
to match the *live* winning declaration of the column it references. Verified via
`localDeclarationLive: true` in the tool's output (this file's own CREATE TABLE for
that table is the one that actually executes) before editing, and regression-checked
against the tool after each batch.

| File | Column(s) fixed | Direction |
|---|---|---|
| `091_create_ai_optimizations_table.sql` | `ai_optimizations.farm_id`, `.farmer_id` | INTEGER→UUID |
| `092_create_ai_analyses_table.sql` | `ai_analyses.farm_id` | INTEGER→UUID |
| `096_create_gdpr_tables.sql` | `data_inventory.user_id`, `user_consents.user_id`, `data_exports.user_id`, `deletion_requests.user_id` | INTEGER→UUID |
| `097_ai_image_generation_enhanced.sql` | `ai_generated_images.product_id`/`.farmer_id`, `product_listings.product_id`, `farmer_image_portfolios.farmer_id`, `farmer_products.farmer_id`, `sku_images.product_id` | INTEGER→UUID |
| `200_m047_irrigation_management.sql` | `water_sources.farm_id`, `irrigation_schedules.farm_id`, `irrigation_delivery_logs.operator_id`, `irrigation_efficiency_metrics.farm_id` | INTEGER→UUID |
| `9994_platform_content_and_m0xx_indexes.sql` | `community_posts.author_id`, `community_replies.author_id`, `community_votes.user_id`, `knowledge_articles.author_id`, `info_announcements.published_by`, `info_announcement_reads.user_id` | INTEGER→UUID |
| `406_production_supply_market_bridge.sql` | `production_supply_lots.crop_plan_id` | INTEGER→UUID |
| `10000_village_external_supply_demand.sql` | `village_external_demands.village_id`, `village_supply_orders.village_id` | INTEGER→UUID |
| `9994_village_completeness_operating_layer.sql` | 14 `village_id` columns (institutions, governance_records, grievances, assets, service_coverage, livelihoods, skill_gaps, financial_access_points, hazard_profiles, emergency_resources, connectivity_profiles, natural_resources, environment_indicators, readiness_snapshots) | INTEGER→UUID |
| `9998_village_erp_operating_system.sql` | 7 `village_id` columns (households, enterprises, budgets, finance_dimensions, operational_kpis, workflow_tasks, ai_insights) | INTEGER→UUID |
| `9996_village_economy_geo_logistics.sql` | `village_production_records.village_id`, `village_economic_flows.village_id`, `village_logistics_routes.village_id`, `village_logistics_profiles.village_id` | INTEGER→UUID |
| `9998_village_production_potential.sql` | `village_commodity_potential_profiles.village_id` | INTEGER→UUID |
| `9996_project_systems_schema.sql` | `project_wbs.project_id`, `project_milestones.project_id` | INTEGER→UUID (`projects.id` is UUID per winning `411_projects.sql`; this file's own `projects` CREATE TABLE is itself a dead no-op, but `project_wbs`/`project_milestones` are live) |
| `9997_cooperative_shares_schema.sql` | `cooperative_share_transactions.member_id`, `.counterparty_member_id` | **UUID→INTEGER** (`cooperative_members.id` is SERIAL/integer per winning `012_governance_module.sql`) |
| `991_aeos_folu_ne_policy.sql` | `yield_actuals.crop_id`, `farmer_revenue.crop_id`, `farmer_listings.crop_id` | UUID→INTEGER (`crops.id` is integer per winning `001_skeleton_complete_schema.sql`) |
| `9999_zzzzzzzzzzzzzzzzzz_irrigation_management_schema.sql` | `irrigation_logs.schedule_id` | UUID→INTEGER (`irrigation_schedules.id` is integer per winning `200_m047_irrigation_management.sql`) |
| `strategic_services_schema.sql` | `pre_season_agreements.crop_id`, `pre_season_opportunities.crop_id` | UUID→INTEGER |

Committed in 5 batches (`4e78dea0`, `caabd04d`, `35972ebf`, `35127e75`, plus one
folded into the irrigation/AEOS batch), each listing the exact table.column retypes.

### Verified moot, no edit made: 8 of 70

These carry `localDeclarationLive: false` — the file's own `CREATE TABLE IF NOT
EXISTS` for that table never executes because an earlier-sorted file already
declared it, so retyping the column in *this* file would be dead code with zero
runtime effect. Per instructions, each was checked against its actual winning
declaration instead of being edited blind:

| File (dead declaration) | Table.column | Winning file | Result |
|---|---|---|---|
| `405_main_operational_erp_reconciliation.sql` | `inventory_movements.inventory_id` | `034_logistics_enhancement_schema.sql` | **Different FK entirely.** The winning declaration's `inventory_id INTEGER REFERENCES warehouse_inventory(id)` — not `inventory(id)` as in the dead file — and `warehouse_inventory.id` is itself `SERIAL`/integer. No mismatch exists in the live schema. |
| `3100_ecommerce_tables.sql` | `gi_marketplace_listings.product_id` | `027_gi_intelligence_schema.sql` | Winning declaration already has `product_id UUID REFERENCES products(id)`, matching `products.id` (UUID). Already consistent. |
| `3100_ecommerce_tables.sql` | `product_reviews.product_id` | `009_marketplace_enhancements.sql` | Winning declaration already `UUID REFERENCES products(id)`. Already consistent. |
| `3102_ecommerce_ai_erp_business_marketing.sql` | `demand_forecasts.product_id` | `015_advanced_features.sql` | Winning declaration already `UUID REFERENCES products(id)`. Already consistent. |
| `3102_ecommerce_ai_erp_business_marketing.sql` | `gst_invoices.order_id` | `028_gst_schema.sql` | Winning declaration's `order_id INTEGER NOT NULL` carries **no FK constraint at all** on this column — no live type mismatch (a missing-FK gap, but out of this sweep's scope). |
| `3102_ecommerce_ai_erp_business_marketing.sql` | `warehouse_inventory.product_id` | `013_logistics_enhancements.sql` | Winning declaration already `UUID NOT NULL REFERENCES products(id)`. Already consistent. |
| `9997_village_economy_flow_intelligence.sql` | `village_production_records.village_id` | `9996_village_economy_geo_logistics.sql` | Winning declaration was itself one of the 62 live fixes above (retyped INTEGER→UUID this pass); once fixed there, this dead duplicate is moot too. |
| `m011_water_irrigation_schema.sql` | `irrigation_logs.schedule_id` | `9999_zzzzzzzzzzzzzzzzzz_irrigation_management_schema.sql` | Winning declaration was itself one of the 62 live fixes above (retyped UUID→INTEGER this pass); once fixed there, this dead duplicate is moot too. |

No item required a full stop for ambiguity, application-code risk, or "possibly
intentional" reasons — every one of the 70 resolved cleanly into either a
straightforward retype or a verified-moot dead declaration.

### Final verified count

Re-running the order-aware checker after all edits: **`realOrderResolvedMismatches`
dropped from 78 to 14.**

14, not 8, remain — this is **not** a discrepancy in the fix count, it's arithmetic:
- 8 are the frozen items (untouched, as instructed).
- 6 are exactly the "verified moot" dead-declaration rows from the table above
  (`405` ×1, `3100` ×2, `3102` ×3) — the checker still *reports* them because it
  flags every FK site regardless of whether its own declaration is live, and their
  *own* file's column genuinely still says `INTEGER`/`UUID` where the target's
  winning type differs. Retyping them would be a no-op against the live schema (as
  shown above) and was correctly not done; they are pre-existing dead code, not a
  live bug, and are not part of the 70 in scope.
- The other 2 dead rows from the original 8 (`9997_village_economy_flow_intelligence.sql`,
  `m011_water_irrigation_schema.sql`) disappeared from the checker's output entirely
  once their live counterparts were retyped, confirming those two really were
  fully resolved.

70/70 items processed: 62 fixed with a real column retype, 8 verified moot
(dead code, zero live effect, correctly left alone). 0 stopped on ambiguity.
