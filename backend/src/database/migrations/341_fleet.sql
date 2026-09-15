-- Migration: Create fleet table
-- Description: Fleet Management
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS fleet (
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
  CONSTRAINT fleet_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_fleet_user_id
  ON fleet(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_fleet_status
  ON fleet(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_fleet_created_at
  ON fleet(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_fleet_updated_at
  ON fleet(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_fleet_data_gin
  ON fleet USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_fleet_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER fleet_timestamp_trigger
BEFORE UPDATE ON fleet
FOR EACH ROW
EXECUTE FUNCTION update_fleet_timestamp();

COMMIT;