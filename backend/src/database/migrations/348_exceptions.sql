-- Migration: Create exceptions table
-- Description: Exception Management
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS exceptions (
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
  CONSTRAINT exceptions_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_exceptions_user_id
  ON exceptions(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_exceptions_status
  ON exceptions(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_exceptions_created_at
  ON exceptions(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_exceptions_updated_at
  ON exceptions(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_exceptions_data_gin
  ON exceptions USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_exceptions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER exceptions_timestamp_trigger
BEFORE UPDATE ON exceptions
FOR EACH ROW
EXECUTE FUNCTION update_exceptions_timestamp();

COMMIT;