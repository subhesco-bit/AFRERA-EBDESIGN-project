-- Migration: Create water_rights table
-- Description: Water Rights
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS water_rights (
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
  CONSTRAINT water_rights_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_water_rights_user_id
  ON water_rights(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_water_rights_status
  ON water_rights(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_water_rights_created_at
  ON water_rights(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_water_rights_updated_at
  ON water_rights(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_water_rights_data_gin
  ON water_rights USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_water_rights_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER water_rights_timestamp_trigger
BEFORE UPDATE ON water_rights
FOR EACH ROW
EXECUTE FUNCTION update_water_rights_timestamp();

COMMIT;