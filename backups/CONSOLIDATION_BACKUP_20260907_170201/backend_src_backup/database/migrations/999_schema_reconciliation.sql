-- ============================================================================
-- 999_schema_reconciliation.sql   (generated 2026-08-03)
--
-- WHY THIS EXISTS
-- 16 tables are defined by more than one migration. Because every definition
-- uses CREATE TABLE IF NOT EXISTS, the FIRST migration to define a table wins
-- and later, richer definitions of that same table are silently skipped.
--
-- The older migrations (009-015) define thinner versions of tables that the
-- newer platform schemas (016-045) define more fully. Without this file, ~100
-- columns that services actually query would not exist at runtime, causing
-- "column ... does not exist" errors.
--
-- This migration is deliberately:
--   * ADDITIVE ONLY - never drops or retypes an existing column
--   * IDEMPOTENT    - ADD COLUMN IF NOT EXISTS is safe to re-run
--   * ORDER-LAST    - numbered 999 so it runs after every other migration
--
-- Deliberately EXCLUDED because they cannot be safely added to a table that
-- may already contain rows: SERIAL types, primary keys, inline REFERENCES,
-- UNIQUE/CHECK constraints, and NOT NULL without a DEFAULT. Add those by hand
-- after backfilling if required.
-- ============================================================================

-- ar_vr_experiences (winning definition: migrations/015_advanced_features.sql)
ALTER TABLE ar_vr_experiences ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE ar_vr_experiences ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE ar_vr_experiences ADD COLUMN IF NOT EXISTS experience_data JSONB;
ALTER TABLE ar_vr_experiences ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE;
ALTER TABLE ar_vr_experiences ADD COLUMN IF NOT EXISTS platform_requirements JSONB DEFAULT '{}';
ALTER TABLE ar_vr_experiences ADD COLUMN IF NOT EXISTS target_entity_id UUID;
ALTER TABLE ar_vr_experiences ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- demand_forecasts (winning definition: migrations/015_advanced_features.sql)
ALTER TABLE demand_forecasts ADD COLUMN IF NOT EXISTS budget_constraints JSONB;
ALTER TABLE demand_forecasts ADD COLUMN IF NOT EXISTS enrollment_data JSONB;
ALTER TABLE demand_forecasts ADD COLUMN IF NOT EXISTS generated_by INTEGER;
ALTER TABLE demand_forecasts ADD COLUMN IF NOT EXISTS historical_data JSONB;
ALTER TABLE demand_forecasts ADD COLUMN IF NOT EXISTS institution_id INTEGER;
ALTER TABLE demand_forecasts ADD COLUMN IF NOT EXISTS menu_requirements JSONB;
ALTER TABLE demand_forecasts ADD COLUMN IF NOT EXISTS seasonal_factors JSONB;
ALTER TABLE demand_forecasts ADD COLUMN IF NOT EXISTS special_events JSONB;
ALTER TABLE demand_forecasts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- dietary_profiles (winning definition: migrations/020_consumer_health_schema.sql)
ALTER TABLE dietary_profiles ADD COLUMN IF NOT EXISTS avoid_nutrients TEXT[];
ALTER TABLE dietary_profiles ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE dietary_profiles ADD COLUMN IF NOT EXISTS nutrient_requirements JSONB;
ALTER TABLE dietary_profiles ADD COLUMN IF NOT EXISTS preferred_foods TEXT[];

-- fleet_vehicles (winning definition: migrations/013_logistics_enhancements.sql)
ALTER TABLE fleet_vehicles ADD COLUMN IF NOT EXISTS last_maintenance_date DATE;
ALTER TABLE fleet_vehicles ADD COLUMN IF NOT EXISTS next_maintenance_date DATE;

-- gst_invoice_items (winning definition: migrations/028_gst_schema.sql)
ALTER TABLE gst_invoice_items ADD COLUMN IF NOT EXISTS item_id INTEGER;

-- gst_invoices (winning definition: migrations/028_gst_schema.sql)
ALTER TABLE gst_invoices ADD COLUMN IF NOT EXISTS buyer_address TEXT;
ALTER TABLE gst_invoices ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE gst_invoices ADD COLUMN IF NOT EXISTS gst_calculation JSONB;

-- iot_devices (winning definition: migrations/015_advanced_features.sql)
ALTER TABLE iot_devices ADD COLUMN IF NOT EXISTS assigned_to UUID;
ALTER TABLE iot_devices ADD COLUMN IF NOT EXISTS battery_level INTEGER;
ALTER TABLE iot_devices ADD COLUMN IF NOT EXISTS device_config JSONB DEFAULT '{}';
ALTER TABLE iot_devices ADD COLUMN IF NOT EXISTS location_id UUID;
ALTER TABLE iot_devices ADD COLUMN IF NOT EXISTS signal_strength INTEGER;

-- shipment_tracking (winning definition: migrations/013_logistics_enhancements.sql)
ALTER TABLE shipment_tracking ADD COLUMN IF NOT EXISTS signal_strength INTEGER;

-- smart_contracts (winning definition: migrations/015_advanced_features.sql)
ALTER TABLE smart_contracts ADD COLUMN IF NOT EXISTS abi JSONB;
ALTER TABLE smart_contracts ADD COLUMN IF NOT EXISTS deployment_block BIGINT;
ALTER TABLE smart_contracts ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- temperature_alerts (winning definition: migrations/013_logistics_enhancements.sql)
ALTER TABLE temperature_alerts ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;
ALTER TABLE temperature_alerts ADD COLUMN IF NOT EXISTS resolution_notes TEXT;
ALTER TABLE temperature_alerts ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP;
ALTER TABLE temperature_alerts ADD COLUMN IF NOT EXISTS resolved_by INTEGER;
ALTER TABLE temperature_alerts ADD COLUMN IF NOT EXISTS triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- tender_bids: entry removed 2026-08-10. This block used to bolt 030's
-- columns onto 023_engineering_schema.sql's incompatible "winning" table
-- (wrong types, a NOT NULL bidder_name the real INSERT never supplies, and a
-- tender_id FK pointed at the wrong parent table) — it silenced the "column
-- does not exist" symptom without fixing the underlying type/constraint
-- mismatch. 023 now creates its dead table as `engineering_tender_bids`
-- instead, so 030's own CREATE TABLE wins cleanly and no bridge is needed.
-- See migrations/999_zz_tender_bids_collision_repair.sql for databases where
-- 023 already ran under the old name before this fix landed.

-- vehicle_maintenance (winning definition: migrations/013_logistics_enhancements.sql)
ALTER TABLE vehicle_maintenance ADD COLUMN IF NOT EXISTS actual_date DATE;

-- voice_commands (winning definition: migrations/015_advanced_features.sql)
ALTER TABLE voice_commands ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE voice_commands ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE voice_commands ADD COLUMN IF NOT EXISTS execution_result JSONB;
ALTER TABLE voice_commands ADD COLUMN IF NOT EXISTS parameters JSONB DEFAULT '{}';
ALTER TABLE voice_commands ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP;
ALTER TABLE voice_commands ADD COLUMN IF NOT EXISTS session_id UUID;
ALTER TABLE voice_commands ADD COLUMN IF NOT EXISTS transcript TEXT;

-- warehouse_inventory (winning definition: migrations/013_logistics_enhancements.sql)
ALTER TABLE warehouse_inventory ADD COLUMN IF NOT EXISTS last_count_date DATE;
ALTER TABLE warehouse_inventory ADD COLUMN IF NOT EXISTS location_id INTEGER;
ALTER TABLE warehouse_inventory ADD COLUMN IF NOT EXISTS received_date DATE;

-- ============================================================================
-- DEFERRED FOREIGN KEYS
-- Constraints whose target table is created by a LATER migration than the
-- table that references it. Declaring them inline fails at migrate time with
-- "relation ... does not exist"; adding them here, after every table exists,
-- is the standard resolution and avoids renumbering migrations that other
-- files already depend on.
-- ============================================================================

-- food_items.gi_id -> gi_products.id
-- food_items is created in 024_food_intelligence_schema; gi_products in
-- 027_gi_intelligence_schema, which runs afterwards.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_food_items_gi_product'
    ) THEN
        ALTER TABLE food_items
            ADD CONSTRAINT fk_food_items_gi_product
            FOREIGN KEY (gi_id) REFERENCES gi_products(id);
    END IF;
END
$$;
