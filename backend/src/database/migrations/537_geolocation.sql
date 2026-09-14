-- Migration: Create geolocation table
-- Description: Geolocation Tracking
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS geolocation (
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
  CONSTRAINT geolocation_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_geolocation_user_id
  ON geolocation(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_geolocation_status
  ON geolocation(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_geolocation_created_at
  ON geolocation(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_geolocation_updated_at
  ON geolocation(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_geolocation_data_gin
  ON geolocation USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_geolocation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER geolocation_timestamp_trigger
BEFORE UPDATE ON geolocation
FOR EACH ROW
EXECUTE FUNCTION update_geolocation_timestamp();

COMMIT;