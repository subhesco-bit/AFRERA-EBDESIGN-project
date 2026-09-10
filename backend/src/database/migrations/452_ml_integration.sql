-- Migration: Create ml_integration table
-- Description: Machine Learning Integration
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS ml_integration (
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
  CONSTRAINT ml_integration_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_ml_integration_user_id
  ON ml_integration(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_ml_integration_status
  ON ml_integration(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_ml_integration_created_at
  ON ml_integration(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_ml_integration_updated_at
  ON ml_integration(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_ml_integration_data_gin
  ON ml_integration USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_ml_integration_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ml_integration_timestamp_trigger
BEFORE UPDATE ON ml_integration
FOR EACH ROW
EXECUTE FUNCTION update_ml_integration_timestamp();

COMMIT;