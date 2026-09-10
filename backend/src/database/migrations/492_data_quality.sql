-- Migration: Create data_quality table
-- Description: Data Quality
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS data_quality (
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
  CONSTRAINT data_quality_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_data_quality_user_id
  ON data_quality(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_data_quality_status
  ON data_quality(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_data_quality_created_at
  ON data_quality(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_data_quality_updated_at
  ON data_quality(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_data_quality_data_gin
  ON data_quality USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_data_quality_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER data_quality_timestamp_trigger
BEFORE UPDATE ON data_quality
FOR EACH ROW
EXECUTE FUNCTION update_data_quality_timestamp();

COMMIT;