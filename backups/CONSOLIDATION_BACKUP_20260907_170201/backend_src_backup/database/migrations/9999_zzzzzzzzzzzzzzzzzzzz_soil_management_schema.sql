-- Schema for the 3 Soil-domain CRUD resources backing
-- backend/src/services/soilManagementService.js. Columns match the
-- ResourceManager `fields` already shipped on
-- frontend/src/pages/SoilManagementPage.jsx - taken directly from that UI,
-- not invented. M072 Soil Testing already has real tables via
-- soilTestingService.js and is untouched here.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS soil_health_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plot_name VARCHAR(200) NOT NULL,
    ph_level NUMERIC(4,2),
    organic_matter_percent NUMERIC(5,2),
    rating VARCHAR(20) DEFAULT 'Moderate',
    card_date DATE,
    recommendation TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS nutrient_management_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plot_name VARCHAR(200) NOT NULL,
    crop VARCHAR(120),
    focus VARCHAR(50) DEFAULT 'Balanced NPK',
    dose_recommendation TEXT,
    plan_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fertility_management_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plot_name VARCHAR(200) NOT NULL,
    nitrogen_status VARCHAR(10) DEFAULT 'Medium',
    phosphorus_status VARCHAR(10) DEFAULT 'Medium',
    potassium_status VARCHAR(10) DEFAULT 'Medium',
    assessed_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);
