-- Migration: Create edge_computing table
-- Description: Edge Computing
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS edge_computing (
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
  CONSTRAINT edge_computing_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_edge_computing_user_id
  ON edge_computing(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_edge_computing_status
  ON edge_computing(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_edge_computing_created_at
  ON edge_computing(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_edge_computing_updated_at
  ON edge_computing(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_edge_computing_data_gin
  ON edge_computing USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_edge_computing_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER edge_computing_timestamp_trigger
BEFORE UPDATE ON edge_computing
FOR EACH ROW
EXECUTE FUNCTION update_edge_computing_timestamp();

COMMIT;