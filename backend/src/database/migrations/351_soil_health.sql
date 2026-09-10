-- Migration: Create soil_health table
-- Description: Soil Health Management
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS soil_health (
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
  CONSTRAINT soil_health_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_soil_health_user_id
  ON soil_health(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_soil_health_status
  ON soil_health(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_soil_health_created_at
  ON soil_health(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_soil_health_updated_at
  ON soil_health(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_soil_health_data_gin
  ON soil_health USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_soil_health_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER soil_health_timestamp_trigger
BEFORE UPDATE ON soil_health
FOR EACH ROW
EXECUTE FUNCTION update_soil_health_timestamp();

COMMIT;