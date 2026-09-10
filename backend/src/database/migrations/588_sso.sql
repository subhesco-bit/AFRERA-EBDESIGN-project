-- Migration: Create sso table
-- Description: Single Sign-On
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS sso (
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
  CONSTRAINT sso_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_sso_user_id
  ON sso(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_sso_status
  ON sso(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_sso_created_at
  ON sso(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_sso_updated_at
  ON sso(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_sso_data_gin
  ON sso USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_sso_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sso_timestamp_trigger
BEFORE UPDATE ON sso
FOR EACH ROW
EXECUTE FUNCTION update_sso_timestamp();

COMMIT;