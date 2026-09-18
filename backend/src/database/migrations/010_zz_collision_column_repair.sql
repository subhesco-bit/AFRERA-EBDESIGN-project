-- ============================================================================
-- 010_zz_collision_column_repair.sql
--
-- WHY THIS EXISTS
-- Five later core migrations index columns on tables that
-- 001_skeleton_complete_schema.sql already created with a narrower shape.
-- Each of those migrations re-declares the table with CREATE TABLE IF NOT
-- EXISTS, PostgreSQL skips the re-declaration, and the CREATE INDEX that
-- follows then fails with `column "..." does not exist` — aborting the whole
-- run, because migrate.js rethrows on the first failure.
--
--   011_farmer_portal_enhancements.sql  crop_plans(land_record_id|status|crop_type)
--   012_governance_module.sql           villages(district|state)
--   014_platform_foundation_modules.sql organizations(tenant_id), permissions(category)
--   041_rural_life_os_schema.sql        crops(concept_key), buyers(is_active)
--   043_shelf_life_schema.sql           temperature_monitoring(5 columns)
--
-- 053_village_registry_completion.sql and 9996_village_economy_geo_logistics.sql
-- index villages(district|state) too, so they are fixed by the same two lines.
--
-- 000-071 are protected core migrations (see CLAUDE.md) — not edited here.
-- This file sorts between 010_insurance_enhancements.sql and
-- 011_farmer_portal_enhancements.sql under the numeric-aware ordering in
-- backend/src/database/migrationOrder.js, i.e. after 001 has created every
-- table below and before the first index that needs these columns. Same
-- approach as 9999_zzzzzzzzzzzzzzzzzzz_roles_collision_repair.sql.
--
-- Purely additive and idempotent: each column is typed exactly as the
-- migration that indexes it declares it, and no-ops if it already exists.
-- Found by tools/schema-collisions.js.
-- ============================================================================

-- 011: crop_plans is created by 001 as a bare plan header; 011 treats it as a
-- workflow record tied to a land record.
ALTER TABLE crop_plans ADD COLUMN IF NOT EXISTS land_record_id INTEGER;
ALTER TABLE crop_plans ADD COLUMN IF NOT EXISTS status VARCHAR(50);
ALTER TABLE crop_plans ADD COLUMN IF NOT EXISTS crop_type VARCHAR(100);

-- 012: 001's villages carries block_id/code/name; 012's carries the
-- administrative address. Both are the same village.
ALTER TABLE villages ADD COLUMN IF NOT EXISTS district VARCHAR(255);
ALTER TABLE villages ADD COLUMN IF NOT EXISTS state VARCHAR(255);

-- 014: multi-tenancy and permission grouping.
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS tenant_id INTEGER;
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS category VARCHAR(100);

-- 041: concept_key links a crop to the multilingual concept index (migration
-- 992); is_active is buyer lifecycle state.
ALTER TABLE crops ADD COLUMN IF NOT EXISTS concept_key VARCHAR(40);
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS is_active BOOLEAN;

-- 043: 001 declares temperature_monitoring as a bare reading; 043 needs the
-- cold-chain context (what was measured, where, and whether it breached).
ALTER TABLE temperature_monitoring ADD COLUMN IF NOT EXISTS product_id INTEGER;
ALTER TABLE temperature_monitoring ADD COLUMN IF NOT EXISTS batch_id INTEGER;
ALTER TABLE temperature_monitoring ADD COLUMN IF NOT EXISTS location_id INTEGER;
ALTER TABLE temperature_monitoring ADD COLUMN IF NOT EXISTS timestamp TIMESTAMP;
ALTER TABLE temperature_monitoring ADD COLUMN IF NOT EXISTS threshold_violation BOOLEAN;
