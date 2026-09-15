-- Migration: Create access_control table
-- Description: Access Control
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS access_control (
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
  CONSTRAINT access_control_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_access_control_user_id
  ON access_control(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_access_control_status
  ON access_control(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_access_control_created_at
  ON access_control(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_access_control_updated_at
  ON access_control(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_access_control_data_gin
  ON access_control USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_access_control_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER access_control_timestamp_trigger
BEFORE UPDATE ON access_control
FOR EACH ROW
EXECUTE FUNCTION update_access_control_timestamp();

COMMIT;