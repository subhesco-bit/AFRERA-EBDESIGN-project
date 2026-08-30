-- Schema for the 5 Climate-domain CRUD resources backing
-- backend/src/services/climateMonitoringService.js. Columns match the
-- ResourceManager `fields` already shipped on
-- frontend/src/pages/ClimateMonitoringPage.jsx (drought/flood/disease/
-- climate-risk/agro-meteorology tabs) - taken directly from that UI, not
-- invented, since the frontend was built first with an honest "backend not
-- built yet" note per tab.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS drought_observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region VARCHAR(200) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'Mild',
    spi_index NUMERIC(6,2),
    start_date DATE,
    affected_area_hectares NUMERIC(12,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_drought_observations_region ON drought_observations(region);

CREATE TABLE IF NOT EXISTS flood_observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region VARCHAR(200) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'Mild',
    water_level_m NUMERIC(6,2),
    rainfall_mm NUMERIC(8,2),
    start_date DATE,
    affected_area_hectares NUMERIC(12,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_flood_observations_region ON flood_observations(region);

CREATE TABLE IF NOT EXISTS disease_forecasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crop VARCHAR(120) NOT NULL,
    disease_name VARCHAR(200) NOT NULL,
    risk_level VARCHAR(20) NOT NULL DEFAULT 'Low',
    region VARCHAR(200),
    forecast_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_disease_forecasts_crop ON disease_forecasts(crop);

CREATE TABLE IF NOT EXISTS climate_risk_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region VARCHAR(200) NOT NULL,
    risk_type VARCHAR(30) NOT NULL,
    risk_score NUMERIC(5,2) CHECK (risk_score IS NULL OR (risk_score >= 0 AND risk_score <= 100)),
    assessment_date DATE,
    mitigation_plan TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);
-- 2026-08-30: removed (deferred collision, see schema-decisions.json "climate_risk_assessments") - indexes column that does not exist on the real (winner) table: CREATE INDEX IF NOT EXISTS idx_climate_risk_assessments_region ON climate_risk_assessments(region);

CREATE TABLE IF NOT EXISTS agro_meteorology_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_name VARCHAR(200) NOT NULL,
    region VARCHAR(200),
    temperature_c NUMERIC(5,2),
    humidity_pct NUMERIC(5,2),
    rainfall_mm NUMERIC(8,2),
    wind_speed_kmph NUMERIC(6,2),
    recorded_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_agro_meteorology_readings_station ON agro_meteorology_readings(station_name);
