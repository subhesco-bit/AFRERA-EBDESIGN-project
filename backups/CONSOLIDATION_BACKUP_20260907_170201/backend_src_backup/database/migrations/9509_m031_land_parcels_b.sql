-- Folded from backend/src/modules/M031/model.sql (AUDIT_DB.md Finding 11/13 remediation)
-- Land Registry Schema (M031) / -- Comprehensive land parcel management with AI-powered land valuation
-- Generated 2026-08-30 — DB linkage fix, see .ai/tasks/ACTIVE.md

CREATE TABLE IF NOT EXISTS land_parcels (
    parcel_id VARCHAR(50) PRIMARY KEY,
    farmer_id VARCHAR(50) NOT NULL,
    village_id VARCHAR(50),
    survey_number VARCHAR(100) NOT NULL,
    area DECIMAL(10,2) NOT NULL,
    area_unit VARCHAR(20) DEFAULT 'hectares',
    location JSONB,
    land_type VARCHAR(50),
    ownership_type VARCHAR(50),
    boundary_details JSONB,
    soil_type VARCHAR(50),
    irrigation_source VARCHAR(50),
    current_crop VARCHAR(100),
    land_use_classification VARCHAR(50),
    market_value DECIMAL(15,2),
    ai_valuation_data JSONB,
    geospatial_data JSONB,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS land_transfers (
    transfer_id VARCHAR(50) PRIMARY KEY,
    parcel_id VARCHAR(50) NOT NULL REFERENCES land_parcels(parcel_id),
    from_farmer_id VARCHAR(50) NOT NULL,
    to_farmer_id VARCHAR(50) NOT NULL,
    transfer_date DATE NOT NULL,
    transfer_type VARCHAR(50),
    transfer_amount DECIMAL(15,2),
    transfer_details JSONB,
    documents JSONB,
    approval_status VARCHAR(20),
    approved_by VARCHAR(50),
    approval_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_land_parcels_farmer ON land_parcels(farmer_id);

CREATE INDEX IF NOT EXISTS idx_land_parcels_village ON land_parcels(village_id);

CREATE INDEX IF NOT EXISTS idx_land_parcels_survey ON land_parcels(survey_number);

CREATE INDEX IF NOT EXISTS idx_land_parcels_type ON land_parcels(land_type);

CREATE INDEX IF NOT EXISTS idx_land_transfers_parcel ON land_transfers(parcel_id);

CREATE INDEX IF NOT EXISTS idx_land_transfers_from ON land_transfers(from_farmer_id);

CREATE INDEX IF NOT EXISTS idx_land_transfers_to ON land_transfers(to_farmer_id);
