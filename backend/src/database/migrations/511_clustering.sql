-- Migration: Create clustering table
-- Description: Clustering Algorithms
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS clustering (
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
  CONSTRAINT clustering_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_clustering_user_id
  ON clustering(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_clustering_status
  ON clustering(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_clustering_created_at
  ON clustering(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_clustering_updated_at
  ON clustering(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_clustering_data_gin
  ON clustering USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_clustering_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER clustering_timestamp_trigger
BEFORE UPDATE ON clustering
FOR EACH ROW
EXECUTE FUNCTION update_clustering_timestamp();

COMMIT;