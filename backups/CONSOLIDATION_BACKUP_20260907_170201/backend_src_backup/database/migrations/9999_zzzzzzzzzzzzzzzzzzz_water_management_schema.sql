-- Schema for the 5 Water-domain CRUD resources backing
-- backend/src/services/waterManagementService.js. Columns match the
-- ResourceManager `fields` already shipped on
-- frontend/src/pages/WaterManagementPage.jsx - taken directly from that UI,
-- not invented.
--
-- rainwater_harvesting_structures is deliberately separate from
-- rainwater_harvesting_systems (created by the M078 hidden-modules recovery
-- migration) - see waterManagementService.js header comment for why.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS water_budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plot_name VARCHAR(200) NOT NULL,
    source VARCHAR(30) DEFAULT 'Borewell',
    demand_liters NUMERIC(14,2),
    supply_liters NUMERIC(14,2),
    season VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS water_quality_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location VARCHAR(200) NOT NULL,
    parameter VARCHAR(50) NOT NULL DEFAULT 'pH',
    value NUMERIC(14,4),
    unit VARCHAR(30),
    reading_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_water_quality_readings_location ON water_quality_readings(location);

CREATE TABLE IF NOT EXISTS rainwater_harvesting_structures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    structure_name VARCHAR(200) NOT NULL,
    structure_type VARCHAR(30) NOT NULL DEFAULT 'Farm Pond',
    village VARCHAR(200),
    capacity_liters NUMERIC(14,2),
    built_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS watersheds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    area_hectares NUMERIC(12,2),
    status VARCHAR(20) DEFAULT 'Planned',
    villages_covered TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS water_analytics_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric VARCHAR(50) DEFAULT 'Water Table Level',
    period VARCHAR(30) NOT NULL,
    value NUMERIC(14,2),
    unit VARCHAR(30),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);
