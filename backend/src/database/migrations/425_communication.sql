-- Migration: Create communication table
-- Description: Communication Platform
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS communication (
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
  CONSTRAINT communication_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_communication_user_id
  ON communication(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_communication_status
  ON communication(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_communication_created_at
  ON communication(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_communication_updated_at
  ON communication(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_communication_data_gin
  ON communication USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_communication_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER communication_timestamp_trigger
BEFORE UPDATE ON communication
FOR EACH ROW
EXECUTE FUNCTION update_communication_timestamp();

COMMIT;