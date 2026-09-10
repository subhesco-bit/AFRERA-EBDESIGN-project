-- Migration: Create escrow table
-- Description: Escrow Services
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS escrow (
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
  CONSTRAINT escrow_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_escrow_user_id
  ON escrow(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_escrow_status
  ON escrow(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_escrow_created_at
  ON escrow(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_escrow_updated_at
  ON escrow(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_escrow_data_gin
  ON escrow USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_escrow_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER escrow_timestamp_trigger
BEFORE UPDATE ON escrow
FOR EACH ROW
EXECUTE FUNCTION update_escrow_timestamp();

COMMIT;