-- Migration: Create data_lineage table
-- Description: Data Lineage
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS data_lineage (
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
  CONSTRAINT data_lineage_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_data_lineage_user_id
  ON data_lineage(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_data_lineage_status
  ON data_lineage(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_data_lineage_created_at
  ON data_lineage(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_data_lineage_updated_at
  ON data_lineage(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_data_lineage_data_gin
  ON data_lineage USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_data_lineage_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER data_lineage_timestamp_trigger
BEFORE UPDATE ON data_lineage
FOR EACH ROW
EXECUTE FUNCTION update_data_lineage_timestamp();

COMMIT;