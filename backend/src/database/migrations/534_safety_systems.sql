-- Migration: Create safety_systems table
-- Description: Safety Systems
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS safety_systems (
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
  CONSTRAINT safety_systems_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_safety_systems_user_id
  ON safety_systems(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_safety_systems_status
  ON safety_systems(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_safety_systems_created_at
  ON safety_systems(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_safety_systems_updated_at
  ON safety_systems(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_safety_systems_data_gin
  ON safety_systems USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_safety_systems_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER safety_systems_timestamp_trigger
BEFORE UPDATE ON safety_systems
FOR EACH ROW
EXECUTE FUNCTION update_safety_systems_timestamp();

COMMIT;