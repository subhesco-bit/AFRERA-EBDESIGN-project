-- Migration: Create sensor_calibration table
-- Description: Sensor Calibration
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS sensor_calibration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Data storage (flexible for different module needs)
  data JSONB DEFAULT '{}' NOT NULL,

  -- Standard fields
  status VARCHAR(50) DEFAULT 'active' NOT NULL
    CHECK (status IN ('active', 'inactive', 'completed', 'pending', 'archived')),

  -- Audit fields
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  deleted_at TIMESTAMP,

  -- Constraints
  CONSTRAINT sensor_calibration_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_sensor_calibration_user_id
  ON sensor_calibration(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_sensor_calibration_status
  ON sensor_calibration(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_sensor_calibration_created_at
  ON sensor_calibration(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_sensor_calibration_updated_at
  ON sensor_calibration(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_sensor_calibration_data_gin
  ON sensor_calibration USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_sensor_calibration_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sensor_calibration_timestamp_trigger
BEFORE UPDATE ON sensor_calibration
FOR EACH ROW
EXECUTE FUNCTION update_sensor_calibration_timestamp();

COMMIT;