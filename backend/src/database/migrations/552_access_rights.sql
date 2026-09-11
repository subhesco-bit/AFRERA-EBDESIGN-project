-- Migration: Create access_rights table
-- Description: Access Rights
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS access_rights (
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
  CONSTRAINT access_rights_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_access_rights_user_id
  ON access_rights(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_access_rights_status
  ON access_rights(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_access_rights_created_at
  ON access_rights(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_access_rights_updated_at
  ON access_rights(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_access_rights_data_gin
  ON access_rights USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_access_rights_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER access_rights_timestamp_trigger
BEFORE UPDATE ON access_rights
FOR EACH ROW
EXECUTE FUNCTION update_access_rights_timestamp();

COMMIT;