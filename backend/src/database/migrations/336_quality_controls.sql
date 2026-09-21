-- Migration: Create quality_controls table
-- Description: Quality Control
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS quality_controls (
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
  CONSTRAINT quality_controls_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_quality_controls_user_id
  ON quality_controls(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_quality_controls_status
  ON quality_controls(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_quality_controls_created_at
  ON quality_controls(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_quality_controls_updated_at
  ON quality_controls(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_quality_controls_data_gin
  ON quality_controls USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_quality_controls_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER quality_controls_timestamp_trigger
BEFORE UPDATE ON quality_controls
FOR EACH ROW
EXECUTE FUNCTION update_quality_controls_timestamp();

COMMIT;