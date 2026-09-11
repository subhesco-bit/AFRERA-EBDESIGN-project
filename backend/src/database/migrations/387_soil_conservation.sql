-- Migration: Create soil_conservation table
-- Description: Soil Conservation
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS soil_conservation (
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
  CONSTRAINT soil_conservation_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_soil_conservation_user_id
  ON soil_conservation(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_soil_conservation_status
  ON soil_conservation(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_soil_conservation_created_at
  ON soil_conservation(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_soil_conservation_updated_at
  ON soil_conservation(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_soil_conservation_data_gin
  ON soil_conservation USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_soil_conservation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER soil_conservation_timestamp_trigger
BEFORE UPDATE ON soil_conservation
FOR EACH ROW
EXECUTE FUNCTION update_soil_conservation_timestamp();

COMMIT;