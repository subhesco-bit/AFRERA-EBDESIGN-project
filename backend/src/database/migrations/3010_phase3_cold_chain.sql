-- Phase 3: Cold Chain Monitoring Schema
CREATE TABLE IF NOT EXISTS temperature_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cold_storage_unit_id UUID,
  temperature DECIMAL(5,2),
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 2026-10-05 merge-collision:temperature_readings - `temperature_readings` is already created by 013_logistics_enhancements.sql
-- (sorts first), so the CREATE above is a no-op. Additive merge so this
-- file's indexes/FKs and its service's columns exist (nullable: rows
-- written through the other shape never populate them).
ALTER TABLE temperature_readings ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE temperature_readings ADD COLUMN IF NOT EXISTS cold_storage_unit_id UUID;
ALTER TABLE temperature_readings ADD COLUMN IF NOT EXISTS temperature DECIMAL(5,2);
ALTER TABLE temperature_readings ADD COLUMN IF NOT EXISTS recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
CREATE UNIQUE INDEX IF NOT EXISTS uq_temperature_readings_id_merge ON temperature_readings(id);

CREATE TABLE IF NOT EXISTS temperature_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cold_storage_unit_id UUID,
  alert_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 2026-10-05 merge-collision:temperature_alerts - `temperature_alerts` is already created by 013_logistics_enhancements.sql
-- (sorts first), so the CREATE above is a no-op. Additive merge so this
-- file's indexes/FKs and its service's columns exist (nullable: rows
-- written through the other shape never populate them).
ALTER TABLE temperature_alerts ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE temperature_alerts ADD COLUMN IF NOT EXISTS cold_storage_unit_id UUID;
ALTER TABLE temperature_alerts ADD COLUMN IF NOT EXISTS alert_type VARCHAR(50);
ALTER TABLE temperature_alerts ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
CREATE UNIQUE INDEX IF NOT EXISTS uq_temperature_alerts_id_merge ON temperature_alerts(id);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'temperature_readings'
      AND column_name = 'cold_storage_unit_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_temp_readings_unit ON temperature_readings(cold_storage_unit_id);
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'temperature_alerts'
      AND column_name = 'cold_storage_unit_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_temp_alerts_unit ON temperature_alerts(cold_storage_unit_id);
  END IF;
END $$;
