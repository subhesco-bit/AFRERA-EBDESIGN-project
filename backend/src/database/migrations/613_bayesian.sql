-- Migration: Create bayesian table
-- Description: Bayesian Analysis
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS bayesian (
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
  CONSTRAINT bayesian_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_bayesian_user_id
  ON bayesian(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_bayesian_status
  ON bayesian(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_bayesian_created_at
  ON bayesian(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_bayesian_updated_at
  ON bayesian(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_bayesian_data_gin
  ON bayesian USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_bayesian_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bayesian_timestamp_trigger
BEFORE UPDATE ON bayesian
FOR EACH ROW
EXECUTE FUNCTION update_bayesian_timestamp();

COMMIT;