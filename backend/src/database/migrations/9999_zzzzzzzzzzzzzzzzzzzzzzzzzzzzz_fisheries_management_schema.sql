-- Schema for 9 of the 10 Fisheries-domain CRUD resources backing
-- backend/src/services/fisheriesManagementService.js. Columns match the
-- ResourceManager `fields` already shipped on
-- frontend/src/pages/FisheriesManagementPage.jsx - taken directly from
-- that UI, not invented. Pond Management (M132) already has its own real
-- `ponds` table with an incompatible schema and is untouched here - see
-- fisheriesManagementService.js.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS biofloc_farm_tanks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tank_id VARCHAR(100) NOT NULL,
    species VARCHAR(150) NOT NULL,
    stocking_density NUMERIC(10,2),
    floc_volume_index NUMERIC(8,2),
    water_temp_c NUMERIC(5,2),
    setup_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hatchery_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hatchery_name VARCHAR(200) NOT NULL,
    species VARCHAR(150) NOT NULL,
    batch_size NUMERIC(12,2),
    spawning_date DATE,
    hatch_rate_pct NUMERIC(5,2),
    status VARCHAR(15) DEFAULT 'Incubating',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fish_feed_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feed_name VARCHAR(200) NOT NULL,
    pond_tank VARCHAR(200) NOT NULL,
    feed_type VARCHAR(20) DEFAULT 'Pellet',
    quantity_kg NUMERIC(12,2),
    feeding_date DATE,
    cost NUMERIC(12,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fisheries_water_quality_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pond_tank VARCHAR(200) NOT NULL,
    ph_level NUMERIC(4,2),
    dissolved_oxygen NUMERIC(6,2),
    ammonia_level NUMERIC(8,4),
    temperature_c NUMERIC(5,2),
    tested_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fish_health_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pond_tank VARCHAR(200) NOT NULL,
    species VARCHAR(150),
    issue_observed TEXT NOT NULL,
    treatment TEXT,
    mortality_count INTEGER,
    recorded_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fisheries_harvest_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pond_tank VARCHAR(200) NOT NULL,
    species VARCHAR(150) NOT NULL,
    harvest_date DATE,
    quantity_kg NUMERIC(12,2),
    average_weight_g NUMERIC(10,2),
    buyer VARCHAR(200),
    sale_price NUMERIC(14,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fish_processing_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id VARCHAR(100) NOT NULL,
    species VARCHAR(150) NOT NULL,
    processing_type VARCHAR(20) DEFAULT 'Cleaning',
    quantity_kg NUMERIC(12,2),
    processing_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cold_fish_chain_shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id VARCHAR(100) NOT NULL,
    origin VARCHAR(200),
    destination VARCHAR(200) NOT NULL,
    temperature_c NUMERIC(5,2),
    dispatch_date DATE,
    arrival_date DATE,
    status VARCHAR(15) DEFAULT 'In Transit',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_cold_fish_chain_shipments_status ON cold_fish_chain_shipments(status);

CREATE TABLE IF NOT EXISTS aquaculture_analytics_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name VARCHAR(150) NOT NULL,
    pond_tank VARCHAR(200),
    value NUMERIC(14,2),
    unit VARCHAR(30),
    period VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);
