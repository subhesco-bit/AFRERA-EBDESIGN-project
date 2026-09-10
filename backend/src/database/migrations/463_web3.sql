-- Migration: Create web3 table
-- Description: Web3 Integration
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS web3 (
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
  CONSTRAINT web3_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_web3_user_id
  ON web3(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_web3_status
  ON web3(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_web3_created_at
  ON web3(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_web3_updated_at
  ON web3(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_web3_data_gin
  ON web3 USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_web3_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER web3_timestamp_trigger
BEFORE UPDATE ON web3
FOR EACH ROW
EXECUTE FUNCTION update_web3_timestamp();

COMMIT;