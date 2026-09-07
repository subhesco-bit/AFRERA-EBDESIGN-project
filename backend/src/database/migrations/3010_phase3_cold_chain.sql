-- Phase 3: Cold Chain Monitoring Schema
CREATE TABLE IF NOT EXISTS temperature_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cold_storage_unit_id UUID,
  temperature DECIMAL(5,2),
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS temperature_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cold_storage_unit_id UUID,
  alert_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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
