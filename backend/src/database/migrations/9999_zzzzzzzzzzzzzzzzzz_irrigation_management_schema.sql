-- Schema for the 3 Irrigation-domain CRUD resources backing
-- backend/src/services/legacy/irrigationManagementService.js. Columns match
-- the form/fields already shipped on
-- frontend/src/pages/IrrigationManagementPage.jsx (schedules/water-sources/
-- logs) - taken directly from that UI and its api.js client, not invented,
-- since the frontend was built first with an honest "backend not built yet"
-- note per tab (same pattern as 9999_..._climate_monitoring_schema.sql).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS irrigation_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field_name VARCHAR(200) NOT NULL,
    crop VARCHAR(120),
    method VARCHAR(20) NOT NULL DEFAULT 'Drip',
    frequency_days NUMERIC(6,2) NOT NULL,
    duration_minutes NUMERIC(8,2),
    water_source VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_irrigation_schedules_field ON irrigation_schedules(field_name);

CREATE TABLE IF NOT EXISTS irrigation_water_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200),
    type VARCHAR(50) NOT NULL,
    capacity_liters NUMERIC(14,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_irrigation_water_sources_type ON irrigation_water_sources(type);

CREATE TABLE IF NOT EXISTS irrigation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID REFERENCES irrigation_schedules(id) ON DELETE SET NULL,
    field_name VARCHAR(200),
    volume_liters NUMERIC(14,2),
    duration_minutes NUMERIC(8,2),
    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_irrigation_logs_schedule ON irrigation_logs(schedule_id);
