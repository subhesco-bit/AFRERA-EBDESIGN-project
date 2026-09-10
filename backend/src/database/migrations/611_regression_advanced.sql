-- Migration: Create regression_advanced table
-- Description: Regression Analysis Advanced
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS regression_advanced (
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
  CONSTRAINT regression_advanced_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_regression_advanced_user_id
  ON regression_advanced(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_regression_advanced_status
  ON regression_advanced(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_regression_advanced_created_at
  ON regression_advanced(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_regression_advanced_updated_at
  ON regression_advanced(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_regression_advanced_data_gin
  ON regression_advanced USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_regression_advanced_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER regression_advanced_timestamp_trigger
BEFORE UPDATE ON regression_advanced
FOR EACH ROW
EXECUTE FUNCTION update_regression_advanced_timestamp();

COMMIT;