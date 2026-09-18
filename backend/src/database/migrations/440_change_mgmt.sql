-- Migration: Create change_mgmt table
-- Description: Change Management
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS change_mgmt (
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
  CONSTRAINT change_mgmt_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_change_mgmt_user_id
  ON change_mgmt(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_change_mgmt_status
  ON change_mgmt(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_change_mgmt_created_at
  ON change_mgmt(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_change_mgmt_updated_at
  ON change_mgmt(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_change_mgmt_data_gin
  ON change_mgmt USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_change_mgmt_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER change_mgmt_timestamp_trigger
BEFORE UPDATE ON change_mgmt
FOR EACH ROW
EXECUTE FUNCTION update_change_mgmt_timestamp();

COMMIT;