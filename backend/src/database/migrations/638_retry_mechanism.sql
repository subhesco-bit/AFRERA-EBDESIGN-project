-- Migration: Create retry_mechanism table
-- Description: Retry Mechanism
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS retry_mechanism (
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
  CONSTRAINT retry_mechanism_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_retry_mechanism_user_id
  ON retry_mechanism(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_retry_mechanism_status
  ON retry_mechanism(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_retry_mechanism_created_at
  ON retry_mechanism(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_retry_mechanism_updated_at
  ON retry_mechanism(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_retry_mechanism_data_gin
  ON retry_mechanism USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_retry_mechanism_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER retry_mechanism_timestamp_trigger
BEFORE UPDATE ON retry_mechanism
FOR EACH ROW
EXECUTE FUNCTION update_retry_mechanism_timestamp();

COMMIT;