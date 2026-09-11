-- Migration: Create consensus table
-- Description: Consensus Mechanisms
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS consensus (
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
  CONSTRAINT consensus_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_consensus_user_id
  ON consensus(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_consensus_status
  ON consensus(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_consensus_created_at
  ON consensus(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_consensus_updated_at
  ON consensus(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_consensus_data_gin
  ON consensus USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_consensus_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER consensus_timestamp_trigger
BEFORE UPDATE ON consensus
FOR EACH ROW
EXECUTE FUNCTION update_consensus_timestamp();

COMMIT;