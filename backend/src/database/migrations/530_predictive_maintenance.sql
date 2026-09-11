-- Migration: Create predictive_maintenance table
-- Description: Predictive Maintenance
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS predictive_maintenance (
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
  CONSTRAINT predictive_maintenance_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_predictive_maintenance_user_id
  ON predictive_maintenance(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_predictive_maintenance_status
  ON predictive_maintenance(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_predictive_maintenance_created_at
  ON predictive_maintenance(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_predictive_maintenance_updated_at
  ON predictive_maintenance(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_predictive_maintenance_data_gin
  ON predictive_maintenance USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_predictive_maintenance_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER predictive_maintenance_timestamp_trigger
BEFORE UPDATE ON predictive_maintenance
FOR EACH ROW
EXECUTE FUNCTION update_predictive_maintenance_timestamp();

COMMIT;