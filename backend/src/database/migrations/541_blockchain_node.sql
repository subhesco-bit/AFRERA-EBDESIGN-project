-- Migration: Create blockchain_node table
-- Description: Blockchain Node
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS blockchain_node (
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
  CONSTRAINT blockchain_node_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_blockchain_node_user_id
  ON blockchain_node(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_blockchain_node_status
  ON blockchain_node(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_blockchain_node_created_at
  ON blockchain_node(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_blockchain_node_updated_at
  ON blockchain_node(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_blockchain_node_data_gin
  ON blockchain_node USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_blockchain_node_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER blockchain_node_timestamp_trigger
BEFORE UPDATE ON blockchain_node
FOR EACH ROW
EXECUTE FUNCTION update_blockchain_node_timestamp();

COMMIT;