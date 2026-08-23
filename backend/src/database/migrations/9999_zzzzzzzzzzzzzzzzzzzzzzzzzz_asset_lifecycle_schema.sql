-- Schema recovery for M110 (backend/src/modules/M110/service.js), Asset
-- Lifecycle Management. Real, complete, non-fabricated logic (straight-line
-- depreciation, book value, replacement timeline) was sitting fully
-- disconnected: controller.js/routes.js were empty stubs
-- ("Add route handlers here") despite service.js being 458 real lines, and
-- these two tables it queries were never created by any migration - same
-- "relation does not exist" class of bug as the M010/M078/M104/M107/M012/
-- M087 recovery migrations. Wired up and recovered together 2026-08-17.

CREATE TABLE IF NOT EXISTS asset_lifecycle (
    asset_registry_id VARCHAR(64) PRIMARY KEY,
    asset_id VARCHAR(100),
    farmer_id VARCHAR(64) NOT NULL,
    asset_type VARCHAR(100),
    asset_name VARCHAR(200),
    brand VARCHAR(100),
    model VARCHAR(100),
    year INTEGER,
    serial_number VARCHAR(100),
    purchase_date DATE,
    purchase_cost NUMERIC(14,2),
    estimated_useful_life INTEGER,
    residual_value NUMERIC(14,2),
    location VARCHAR(200),
    state VARCHAR(100),
    district VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    ai_recommendations JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_asset_lifecycle_farmer ON asset_lifecycle(farmer_id);

CREATE TABLE IF NOT EXISTS asset_lifecycle_stages (
    stage_id VARCHAR(64) PRIMARY KEY,
    registry_id VARCHAR(64) REFERENCES asset_lifecycle(asset_registry_id) ON DELETE CASCADE,
    lifecycle_stage VARCHAR(50),
    condition VARCHAR(20),
    utilization_hours NUMERIC(10,2),
    maintenance_cost NUMERIC(14,2),
    notes TEXT,
    ai_analysis JSONB DEFAULT '{}',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_asset_lifecycle_stages_registry ON asset_lifecycle_stages(registry_id);
