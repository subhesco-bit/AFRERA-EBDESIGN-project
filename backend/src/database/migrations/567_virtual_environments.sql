-- Migration: Create virtual_environments table
-- Description: Virtual Environments
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS virtual_environments (
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
  CONSTRAINT virtual_environments_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_virtual_environments_user_id
  ON virtual_environments(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_virtual_environments_status
  ON virtual_environments(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_virtual_environments_created_at
  ON virtual_environments(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_virtual_environments_updated_at
  ON virtual_environments(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_virtual_environments_data_gin
  ON virtual_environments USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_virtual_environments_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER virtual_environments_timestamp_trigger
BEFORE UPDATE ON virtual_environments
FOR EACH ROW
EXECUTE FUNCTION update_virtual_environments_timestamp();

COMMIT;