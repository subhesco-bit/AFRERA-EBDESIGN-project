-- Migration: Create blockchain table
-- Description: Blockchain Integration
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS blockchain (
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
  CONSTRAINT blockchain_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_blockchain_user_id
  ON blockchain(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_blockchain_status
  ON blockchain(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_blockchain_created_at
  ON blockchain(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_blockchain_updated_at
  ON blockchain(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_blockchain_data_gin
  ON blockchain USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_blockchain_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER blockchain_timestamp_trigger
BEFORE UPDATE ON blockchain
FOR EACH ROW
EXECUTE FUNCTION update_blockchain_timestamp();

COMMIT;