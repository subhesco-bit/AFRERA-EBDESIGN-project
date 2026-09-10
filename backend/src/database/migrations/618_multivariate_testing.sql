-- Migration: Create multivariate_testing table
-- Description: Multivariate Testing
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS multivariate_testing (
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
  CONSTRAINT multivariate_testing_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_multivariate_testing_user_id
  ON multivariate_testing(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_multivariate_testing_status
  ON multivariate_testing(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_multivariate_testing_created_at
  ON multivariate_testing(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_multivariate_testing_updated_at
  ON multivariate_testing(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_multivariate_testing_data_gin
  ON multivariate_testing USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_multivariate_testing_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER multivariate_testing_timestamp_trigger
BEFORE UPDATE ON multivariate_testing
FOR EACH ROW
EXECUTE FUNCTION update_multivariate_testing_timestamp();

COMMIT;