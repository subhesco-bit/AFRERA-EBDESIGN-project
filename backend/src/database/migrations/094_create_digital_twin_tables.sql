-- Create Digital Twin Tables
CREATE TABLE IF NOT EXISTS digital_twins (
  id SERIAL PRIMARY KEY,
  farm_id UUID UNIQUE REFERENCES farms(id),
  twin_data JSONB,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS iot_devices (
  id SERIAL PRIMARY KEY,
  farm_id UUID REFERENCES farms(id),
  device_data JSONB,
  device_type VARCHAR(50),
  status VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sensor_readings (
  id SERIAL PRIMARY KEY,
  farm_id UUID REFERENCES farms(id),
  device_id VARCHAR(100),
  reading_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS simulations (
  id SERIAL PRIMARY KEY,
  farm_id UUID REFERENCES farms(id),
  simulation_data JSONB,
  scenario VARCHAR(100),
  status VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2026-09-12 collision repair (batch): the CREATE INDEX statements below
-- name columns that do not exist on the table that actually gets created.
-- Each of these tables is declared by more than one migration, and
-- PostgreSQL's CREATE TABLE IF NOT EXISTS silently skips every declaration
-- after the first — so the later, wider definition never took effect and
-- the index that assumed it would fail with "column does not exist",
-- aborting the whole migration run.
--
-- Additive and idempotent: restores exactly the columns the indexes below
-- require, typed from the losing definition that declared them. No-ops on
-- a database where the wider definition already won.
-- digital_twins: winner is 072_tier1_m025_m030_schema.sql
ALTER TABLE digital_twins ADD COLUMN IF NOT EXISTS farm_id UUID;
-- iot_devices: winner is 015_advanced_features.sql
ALTER TABLE iot_devices ADD COLUMN IF NOT EXISTS farm_id UUID;

CREATE INDEX IF NOT EXISTS idx_digital_twins_farm ON digital_twins(farm_id);
CREATE INDEX IF NOT EXISTS idx_iot_devices_farm ON iot_devices(farm_id);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_farm ON sensor_readings(farm_id);
CREATE INDEX IF NOT EXISTS idx_simulations_farm ON simulations(farm_id);
