-- Schema for the 8 Horticulture-domain CRUD resources backing
-- backend/src/services/horticultureManagementService.js. Columns match the
-- ResourceManager `fields` already shipped on
-- frontend/src/pages/HorticultureManagementPage.jsx - taken directly from
-- that UI, not invented.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS vegetable_production_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crop_name VARCHAR(150) NOT NULL,
    variety VARCHAR(150),
    plot VARCHAR(200),
    area_hectares NUMERIC(12,2),
    sowing_date DATE,
    expected_harvest_date DATE,
    yield_kg NUMERIC(12,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS floriculture_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flower_name VARCHAR(150) NOT NULL,
    variety VARCHAR(150),
    plot VARCHAR(200),
    area_hectares NUMERIC(12,2),
    planting_date DATE,
    bloom_stage VARCHAR(15) DEFAULT 'Bud',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS polyhouse_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    polyhouse_name VARCHAR(200) NOT NULL,
    location VARCHAR(200),
    area_sqm NUMERIC(12,2),
    crop VARCHAR(150),
    construction_date DATE,
    status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hydroponic_systems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    system_name VARCHAR(200) NOT NULL,
    crop VARCHAR(150),
    medium VARCHAR(15) DEFAULT 'NFT',
    ph_level NUMERIC(4,2),
    ec_level NUMERIC(6,2),
    setup_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS aeroponic_systems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    system_name VARCHAR(200) NOT NULL,
    crop VARCHAR(150),
    mist_interval_min NUMERIC(8,2),
    nutrient_solution VARCHAR(200),
    setup_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS precision_horticulture_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field_plot VARCHAR(200) NOT NULL,
    sensor_type VARCHAR(100),
    metric_tracked VARCHAR(100),
    target_range VARCHAR(100),
    current_reading VARCHAR(100),
    recorded_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS protected_cultivation_structures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    structure_type VARCHAR(20) NOT NULL DEFAULT 'Shade Net',
    crop VARCHAR(150),
    area_sqm NUMERIC(12,2),
    setup_date DATE,
    status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS horticulture_analytics_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name VARCHAR(150) NOT NULL,
    crop_category VARCHAR(100),
    value NUMERIC(14,2),
    unit VARCHAR(30),
    period VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);
