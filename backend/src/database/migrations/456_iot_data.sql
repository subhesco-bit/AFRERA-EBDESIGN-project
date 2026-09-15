-- Migration: Create iot_data table
-- Description: IoT Data Processing
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS iot_data (
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
  CONSTRAINT iot_data_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_iot_data_user_id
  ON iot_data(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_iot_data_status
  ON iot_data(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_iot_data_created_at
  ON iot_data(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_iot_data_updated_at
  ON iot_data(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_iot_data_data_gin
  ON iot_data USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_iot_data_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER iot_data_timestamp_trigger
BEFORE UPDATE ON iot_data
FOR EACH ROW
EXECUTE FUNCTION update_iot_data_timestamp();

COMMIT;