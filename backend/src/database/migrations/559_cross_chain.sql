-- Migration: Create cross_chain table
-- Description: Cross-chain Bridge
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS cross_chain (
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
  CONSTRAINT cross_chain_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_cross_chain_user_id
  ON cross_chain(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_cross_chain_status
  ON cross_chain(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_cross_chain_created_at
  ON cross_chain(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_cross_chain_updated_at
  ON cross_chain(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_cross_chain_data_gin
  ON cross_chain USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_cross_chain_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cross_chain_timestamp_trigger
BEFORE UPDATE ON cross_chain
FOR EACH ROW
EXECUTE FUNCTION update_cross_chain_timestamp();

COMMIT;