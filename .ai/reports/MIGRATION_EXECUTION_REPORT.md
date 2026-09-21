# Migration Execution Report — evidence, not inference

**Repository:** `subhesco-bit/subh-deep`  
**Date:** 21 September 2026  
**Method:** PostgreSQL 16 stood up locally; all 789 migrations in
`backend/src/database/migrations/` applied in the runner's own order
(`localeCompare` with `numeric: true`), each in its own transaction,
**continue-on-error** so that every blocker is enumerated rather than only
the first. Migration files were NOT modified.

## Result

| | Count |
|---|---|
| Migrations applied successfully | **714** |
| Migrations that failed | **75** |
| Total | 789 |

The project's own runner halts on the first failure, so before this report
the schema could not get past migration 4 of 789
(`001_skeleton_complete_schema.sql`).

## Why a mechanical fix does not work

A blanket `CREATE TABLE IF NOT EXISTS` / `ON CONFLICT DO NOTHING` pass was
tried in a throwaway copy and made things worse: `000_base_schema.sql`
creates `users`, so 001's richer `CREATE TABLE users` is then skipped and its
columns never exist, causing later statements to fail with
`column ... does not exist`. **263 objects are created in more than one
migration** (`TABLE users` in four separate files), with divergent columns.
Which definition is canonical is a schema-design decision, not a
transformation. Note also that migrations `000-071` are protected by project
convention and are not edited.

## Failures by class

### `42703` — Missing column — statement references a column no applied migration created (28 files)

- `015_authorization_service.sql`  
  column "hierarchy_level" does not exist
- `090_create_ai_predictions_table.sql`  
  column "farm_id" does not exist
- `337_warehouses.sql`  
  column "deleted_at" does not exist
- `342_drivers.sql`  
  column "deleted_at" does not exist
- `367_land_records.sql`  
  column "deleted_at" does not exist
- `376_cooperatives.sql`  
  column "deleted_at" does not exist
- `405_main_operational_erp_reconciliation.sql`  
  column "occurred_at" does not exist
- `410_contracts.sql`  
  column "deleted_at" does not exist
- `417_vendors.sql`  
  column "deleted_at" does not exist
- `420_assets.sql`  
  column "deleted_at" does not exist
- `453_ai_predictions.sql`  
  column "deleted_at" does not exist
- `461_smart_contracts.sql`  
  column "deleted_at" does not exist
- `488_trend_analysis.sql`  
  column "deleted_at" does not exist
- `510_anomaly_detection.sql`  
  column "deleted_at" does not exist
- `519_recommendations.sql`  
  column "deleted_at" does not exist
- `521_sensor_data.sql`  
  column "deleted_at" does not exist
- `545_transactions.sql`  
  column "deleted_at" does not exist
- `994_recovered_capabilities.sql`  
  column "owner_type" does not exist
- `3010_m041_village_connectivity_mapping.sql`  
  column "village_id" referenced in foreign key constraint does not exist
- `3100_ecommerce_tables.sql`  
  column "seller_id" does not exist
- `9500_m001_platform_core.sql`  
  column "enabled" does not exist
- `9519_m058_m058.sql`  
  column "order_id" does not exist
- `9532_m086_monitoring_alerts.sql`  
  column "metric_id" referenced in foreign key constraint does not exist
- `9997_cooperative_shares_schema.sql`  
  column "society_id" does not exist
- `m010_soil_nutrient_land_schema.sql`  
  column "id" referenced in foreign key constraint does not exist
- `m011_water_irrigation_schema.sql`  
  column "created_by" does not exist
- `m028_vendor_procurement_schema.sql`  
  column "risk_level" does not exist
- `strategic_services_schema.sql`  
  column "supplier_type" does not exist

### `42P01` — Missing relation — statement references a table/view that does not exist at this point (22 files)

- `010_zz_collision_column_repair.sql`  
  relation "crop_plans" does not exist
- `042_rural_procurement_logistics_mobility_schema.sql`  
  relation "rural_economic_units" does not exist
- `054_village_projects_schemes_ngo.sql`  
  relation "government_schemes" does not exist
- `059_yield_management_pricing.sql`  
  relation "price_intelligence" does not exist
- `061_decision_support_data_gaps.sql`  
  relation "buyers" does not exist
- `063_farmer_credit_risk_resolution.sql`  
  relation "ai_resolution_rules" does not exist
- `091_create_ai_optimizations_table.sql`  
  relation "farms" does not exist
- `092_create_ai_analyses_table.sql`  
  relation "farms" does not exist
- `094_create_digital_twin_tables.sql`  
  relation "farms" does not exist
- `200_m047_irrigation_management.sql`  
  relation "farms" does not exist
- `991_aeos_folu_ne_policy.sql`  
  relation "crops" does not exist
- `997_geospatial_indexes.sql`  
  relation "rural_economic_units" does not exist
- `998_foreign_key_indexes.sql`  
  relation "enterprise_feasibility_analysis" does not exist
- `1001_platform_configuration.sql`  
  relation "platform_configurations" does not exist
- `3200_hr_module_schema.sql`  
  relation "departments" does not exist
- `9995_village_commodity_master_seed.sql`  
  relation "village_production_commodities" does not exist
- `9998_driver_location_telemetry_columns.sql`  
  relation "driver_location" does not exist
- `9998_village_production_potential.sql`  
  relation "village_production_records" does not exist
- `9999_api_warning_system.sql`  
  relation "migration_log" does not exist
- `9999_zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz_farms_crop_plantings_schema.sql`  
  relation "crops" does not exist
- `9999_zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz_org_tenant_management_columns.sql`  
  relation "organizations" does not exist
- `zzzz_20260913_product_listing_link.sql`  
  relation "dietitian_collection_products" does not exist

### `42804` — Foreign key type mismatch — FK column type differs from the referenced key (16 files)

- `014_platform_foundation_modules.sql`  
  foreign key constraint "environments_organization_id_fkey" cannot be implemented — detail: Key columns "organization_id" and "id" are of incompatible types: uuid and integ
- `041_rural_life_os_schema.sql`  
  foreign key constraint "farm_consumables_crop_id_fkey" cannot be implemented — detail: Key columns "crop_id" and "id" are of incompatible types: integer and uuid.
- `061_village_project_dpr_subsidy_intelligence.sql`  
  foreign key constraint "village_projects_village_id_fkey" cannot be implemented — detail: Key columns "village_id" and "id" are of incompatible types: uuid and integer.
- `406_production_supply_market_bridge.sql`  
  foreign key constraint "production_supply_lots_crop_plan_id_fkey" cannot be implemented — detail: Key columns "crop_plan_id" and "id" are of incompatible types: uuid and integer.
- `3101_ecommerce_integration_tables.sql`  
  foreign key constraint "dietitian_collection_products_product_id_fkey" cannot be implemented — detail: Key columns "product_id" and "id" are of incompatible types: character varying a
- `3102_ecommerce_ai_erp_business_marketing.sql`  
  foreign key constraint "inventory_optimization_product_id_fkey" cannot be implemented — detail: Key columns "product_id" and "id" are of incompatible types: character varying a
- `3103_nutrient_value_sales.sql`  
  foreign key constraint "nutrient_content_verification_product_id_fkey" cannot be implemented — detail: Key columns "product_id" and "id" are of incompatible types: character varying a
- `9994_village_completeness_operating_layer.sql`  
  foreign key constraint "village_institutions_village_id_fkey" cannot be implemented — detail: Key columns "village_id" and "id" are of incompatible types: uuid and integer.
- `9996_project_systems_schema.sql`  
  foreign key constraint "journal_lines_project_id_fkey" cannot be implemented — detail: Key columns "project_id" and "id" are of incompatible types: integer and uuid.
- `9996_village_economy_geo_logistics.sql`  
  foreign key constraint "village_production_records_village_id_fkey" cannot be implemented — detail: Key columns "village_id" and "id" are of incompatible types: uuid and integer.
- `9997_village_economy_flow_intelligence.sql`  
  foreign key constraint "village_economic_activities_village_id_fkey" cannot be implemented — detail: Key columns "village_id" and "id" are of incompatible types: uuid and integer.
- `9998_village_erp_operating_system.sql`  
  foreign key constraint "village_households_village_id_fkey" cannot be implemented — detail: Key columns "village_id" and "id" are of incompatible types: uuid and integer.
- `9999_zzzzzzzzzzzzzzzzzz_irrigation_management_schema.sql`  
  foreign key constraint "irrigation_logs_schedule_id_fkey" cannot be implemented — detail: Key columns "schedule_id" and "id" are of incompatible types: integer and uuid.
- `9999_zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz_module_schema_gaps_batch1.sql`  
  foreign key constraint "variety_performance_variety_id_fkey" cannot be implemented — detail: Key columns "variety_id" and "id" are of incompatible types: integer and uuid.
- `10000_village_external_supply_demand.sql`  
  foreign key constraint "village_external_demands_village_id_fkey" cannot be implemented — detail: Key columns "village_id" and "id" are of incompatible types: uuid and integer.
- `10010_national_listing_origin.sql`  
  column "id" is of type integer but default expression is of type text

### `42601` — SQL syntax error — this file cannot apply in any order (2 files)

- `561_3d_rendering.sql`  
  trailing junk after numeric literal at or near "3d_rendering"
- `9001_north_east_varieties_comprehensive.sql`  
  syntax error at or near "ON"

### `42P07` — Relation already exists — object created by an earlier migration too (2 files)

- `3031_phase12_future.sql`  
  relation "edge_computing" already exists
- `mfa_schema.sql`  
  relation "idx_mfa_secrets_user_id" already exists

### `23505` — Unique violation — seed data inserted twice by competing migrations (1 file)

- `001_skeleton_complete_schema.sql`  
  duplicate key value violates unique constraint "roles_code_key" — detail: Key (code)=(farmer) already exists.

### `23503` — Foreign key violation — seed row references a parent that does not exist (1 file)

- `016_advanced_ponds_iot.sql`  
  insert or update on table "pond_sensors" violates foreign key constraint "pond_sensors_pond_id_fkey" — detail: Key (pond_id)=(1) is not present in table "ponds".

### `23502` — Not-null violation — required column has no value (1 file)

- `1000_user_management.sql`  
  null value in column "code" of relation "roles" violates not-null constraint — detail: Failing row contains (9, admin, Platform administrator, [], 2026-09-21 07:48:01.

### `42710` — Trigger already exists (1 file)

- `9991_1_farmer_health_welfare_module.sql`  
  trigger "trigger_farmer_health_records_updated_at" for relation "farmer_health_records" already exists

### `42704` — Undefined type — CREATE TYPE missing or ran later (1 file)

- `unified_ai_schema.sql`  
  type "vector" does not exist

## Priority order for repair

1. **`42601` SQL syntax errors (2 files)** — these can never apply in any
   order or environment. Fix first; they are unambiguous.
2. **`42804` / FK type mismatches (18 files)** — a declared foreign key whose
   column type does not match the referenced key. Mechanical once the
   canonical parent type is decided.
3. **`42P01` / `42703` missing relation or column (47 files)** — the large
   group, and the one that requires the duplicate-object consolidation above.
   Resolve `TABLE users` and the other 262 multiply-defined objects first;
   most of these should disappear with it.
4. **Seed-data collisions (`23505`, `23503`, `23502`)** — decide the canonical
   taxonomy (e.g. base schema's 5 permission-based roles vs 001's 15
   code-based roles) rather than making inserts tolerant.
5. **`42P07` / `42710` already-exists (3 files)** — safe to make idempotent
   once ownership of each object is settled.

## Reproducing this report

```bash
node tools/audit-migrations.js      # static: ordering and duplicate objects
# then, against a live PostgreSQL, apply continue-on-error to enumerate
# runtime failures (see .ai/tasks/AFRERA_MASTER_TODO.md item 1.2.7)
```

## Keystone finding: why 74 failures trace to two files

Added after the initial report, from targeted experiments against a live
database. The 74 failures are not 74 independent defects. A large share trace
to a single conflict between two protected core migrations.

### The causal chain

1. `000_base_schema.sql` creates `users`, `roles`, `states` and seeds role and
   state lookup data.
2. `001_skeleton_complete_schema.sql` defines **incompatible versions of the
   same core tables** and re-seeds the same lookup data. Every statement in it
   runs in one transaction, so one conflict rolls back the whole file.
3. `001` therefore never commits. Measured, in order, by clearing each
   collision in a throwaway database and re-running:

   | Collision cleared | `001` then fails on |
   |---|---|
   | *(nothing)* | `23505` unique violation on `roles_code_key`, `Key (code)=(farmer) already exists` |
   | `roles` | `23505` unique violation on `states_name_key` |
   | `roles`, `states`, `user_roles` | `42703` `column "first_name" of relation "users" does not exist` |

   The last one cannot be cleared by deleting rows: `000_base_schema.sql`
   already created `users` **without** `first_name`, so `001`'s own
   `CREATE TABLE users` does not take effect and its `INSERT` has nowhere to go.
   The two files disagree on the shape of the core `users` table.

4. Because `001` rolls back, **everything it uniquely defines never exists** —
   including `villages` with `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`.
5. `012_governance_module.sql` then creates `villages` with `id SERIAL`
   (integer). Confirmed in the live database:
   `information_schema` reports `villages.id` as **`integer`**.
6. Downstream migrations declare `village_id UUID` and cannot form a foreign
   key to an integer primary key — hence
   `foreign key constraint ... cannot be implemented`.

### The ecosystem has already voted

Across all 789 migrations:

| `village_id` declared as | Files |
|---|---|
| `UUID` | **45** |
| `INTEGER` | 5 |
| `SERIAL` | 1 |

All six failing `village_*` migrations declare `village_id UUID`. The schema the
code expects is `001`'s, but the schema that actually materialises is
`000_base_schema.sql` + `012`'s.

### The decision this requires

Which file is canonical for the core tables `users`, `roles`, `states` and
`villages`: `000_base_schema.sql` or `001_skeleton_complete_schema.sql`?

**Recommendation — make `001` canonical**, on this evidence:

- 45 of 51 `village_id` declarations assume `001`'s UUID key.
- `000_zz2_roles_early_collision_repair.sql` already exists specifically to add
  the `code` / `is_system` / `parent_role_id` columns **that `001` needs** — the
  project has already been patching toward `001`'s model.
- `001` is named `skeleton_complete_schema` and supplies the richer taxonomy
  (~15 role codes vs 5 permission-based names).

**This cannot be applied mechanically, and is not applied here**, because:

- Both files are inside the protected `000-071` range.
- Deleting the base rows is not sufficient (step 3, last row) and deleting data
  conflicts with the project's no-deletion rule.
- Making `001`'s inserts tolerant with `ON CONFLICT DO NOTHING` would silently
  let `000`'s weaker definitions win — the opposite of the recommendation — and
  leave the UUID/integer split in place.

The likely shape of the fix is a consolidating migration ordered before both,
plus an explicit decision recorded in `.ai/decisions/`. That is a schema-owner
call, not a transformation.
