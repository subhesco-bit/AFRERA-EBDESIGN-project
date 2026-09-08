-- Schema for the 6 Crop-domain CRUD resources backing
-- backend/src/services/cropManagementService.js. Columns match the
-- ResourceManager `fields` (or hand-rolled form, for sowing_records)
-- already shipped on each dedicated page - taken directly from that UI,
-- not invented.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS crop_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crop_name VARCHAR(150) NOT NULL,
    crop_code VARCHAR(50),
    crop_type VARCHAR(30) NOT NULL DEFAULT 'Cereal',
    botanical_name VARCHAR(200),
    duration_days INTEGER,
    status VARCHAR(20) DEFAULT 'Active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_crop_registrations_status ON crop_registrations(status);

-- 2026-09-08 (DB audit follow-up): `crop_varieties` collides with the
-- EARLIER `CREATE TABLE IF NOT EXISTS crop_varieties` in
-- 001_skeleton_complete_schema.sql (id SERIAL, crop_id/code/name/
-- description/average_yield_kg_per_acre - a completely different shape,
-- no crop_name column). 001 sorts first and wins, so the CREATE TABLE
-- below is a silent no-op, and the index that used to follow it
-- (`idx_crop_varieties_crop` on crop_name) would throw "column crop_name
-- does not exist" on a real run - halting every migration after this
-- file, per migrate.js's archive-and-throw failure handling. Discovered
-- statically while fixing the M044 module-schema gap. Index removed here;
-- crop_name is added to the real (001) table, with an equivalent index,
-- by 9999_zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz_module_schema_gaps_batch1.sql
-- (idx_crop_varieties_crop_name), which runs last by filename order.
CREATE TABLE IF NOT EXISTS crop_varieties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crop_name VARCHAR(150) NOT NULL,
    variety_name VARCHAR(150) NOT NULL,
    developer VARCHAR(200),
    yield_potential VARCHAR(10) DEFAULT 'Medium',
    disease_resistance VARCHAR(15) DEFAULT 'Moderate',
    maturity_days INTEGER,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS seed_planning_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crop_name VARCHAR(150) NOT NULL,
    season VARCHAR(20) NOT NULL DEFAULT 'Kharif',
    planned_area_ha NUMERIC(12,2),
    seed_rate_kg_per_ha NUMERIC(10,2),
    seed_source VARCHAR(30) DEFAULT 'Certified Dealer',
    status VARCHAR(20) DEFAULT 'Planned',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS nurseries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nursery_name VARCHAR(200) NOT NULL,
    nursery_type VARCHAR(20) DEFAULT 'Seedling',
    village VARCHAR(200) NOT NULL,
    district VARCHAR(200),
    capacity NUMERIC(12,2),
    crops_raised TEXT,
    status VARCHAR(20) DEFAULT 'Active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sowing_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crop VARCHAR(150) NOT NULL,
    variety VARCHAR(150),
    field_name VARCHAR(200) NOT NULL,
    area_hectares NUMERIC(12,2),
    season VARCHAR(20) DEFAULT 'Kharif',
    method VARCHAR(30) DEFAULT 'Line Sowing',
    sowing_date DATE NOT NULL,
    expected_germination_date DATE,
    seed_rate_kg NUMERIC(10,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_sowing_records_season ON sowing_records(season);

CREATE TABLE IF NOT EXISTS crop_monitoring_observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crop_name VARCHAR(150) NOT NULL,
    field_reference VARCHAR(200),
    observation_type VARCHAR(30) NOT NULL DEFAULT 'Growth Stage',
    severity VARCHAR(10) DEFAULT 'None',
    observed_date DATE,
    observer_name VARCHAR(200),
    findings TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_crop_monitoring_observations_severity ON crop_monitoring_observations(severity);
