-- Migration: Create climate_risk table
-- Description: Climate Risk Management
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS climate_risk (
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
  CONSTRAINT climate_risk_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_climate_risk_user_id
  ON climate_risk(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_climate_risk_status
  ON climate_risk(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_climate_risk_created_at
  ON climate_risk(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_climate_risk_updated_at
  ON climate_risk(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_climate_risk_data_gin
  ON climate_risk USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_climate_risk_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER climate_risk_timestamp_trigger
BEFORE UPDATE ON climate_risk
FOR EACH ROW
EXECUTE FUNCTION update_climate_risk_timestamp();

COMMIT;