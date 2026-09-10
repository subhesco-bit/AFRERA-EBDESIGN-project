-- Migration: Create ensemble table
-- Description: Ensemble Methods
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS ensemble (
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
  CONSTRAINT ensemble_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_ensemble_user_id
  ON ensemble(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_ensemble_status
  ON ensemble(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_ensemble_created_at
  ON ensemble(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_ensemble_updated_at
  ON ensemble(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_ensemble_data_gin
  ON ensemble USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_ensemble_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensemble_timestamp_trigger
BEFORE UPDATE ON ensemble
FOR EACH ROW
EXECUTE FUNCTION update_ensemble_timestamp();

COMMIT;