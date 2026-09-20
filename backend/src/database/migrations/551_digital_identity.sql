-- Migration: Create digital_identity table
-- Description: Digital Identity
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS digital_identity (
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
  CONSTRAINT digital_identity_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_digital_identity_user_id
  ON digital_identity(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_digital_identity_status
  ON digital_identity(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_digital_identity_created_at
  ON digital_identity(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_digital_identity_updated_at
  ON digital_identity(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_digital_identity_data_gin
  ON digital_identity USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_digital_identity_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER digital_identity_timestamp_trigger
BEFORE UPDATE ON digital_identity
FOR EACH ROW
EXECUTE FUNCTION update_digital_identity_timestamp();

COMMIT;