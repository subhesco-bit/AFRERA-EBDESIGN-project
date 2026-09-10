-- Migration: Create merkle_trees table
-- Description: Merkle Trees
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS merkle_trees (
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
  CONSTRAINT merkle_trees_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_merkle_trees_user_id
  ON merkle_trees(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_merkle_trees_status
  ON merkle_trees(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_merkle_trees_created_at
  ON merkle_trees(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_merkle_trees_updated_at
  ON merkle_trees(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_merkle_trees_data_gin
  ON merkle_trees USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_merkle_trees_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER merkle_trees_timestamp_trigger
BEFORE UPDATE ON merkle_trees
FOR EACH ROW
EXECUTE FUNCTION update_merkle_trees_timestamp();

COMMIT;