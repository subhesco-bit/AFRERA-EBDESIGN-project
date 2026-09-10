-- Migration: Create dimensionality_reduction table
-- Description: Dimensionality Reduction
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS dimensionality_reduction (
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
  CONSTRAINT dimensionality_reduction_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_dimensionality_reduction_user_id
  ON dimensionality_reduction(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_dimensionality_reduction_status
  ON dimensionality_reduction(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_dimensionality_reduction_created_at
  ON dimensionality_reduction(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_dimensionality_reduction_updated_at
  ON dimensionality_reduction(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_dimensionality_reduction_data_gin
  ON dimensionality_reduction USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_dimensionality_reduction_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER dimensionality_reduction_timestamp_trigger
BEFORE UPDATE ON dimensionality_reduction
FOR EACH ROW
EXECUTE FUNCTION update_dimensionality_reduction_timestamp();

COMMIT;