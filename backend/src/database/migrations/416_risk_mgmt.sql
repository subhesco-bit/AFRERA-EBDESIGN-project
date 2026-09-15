-- Migration: Create risk_mgmt table
-- Description: Risk Management
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS risk_mgmt (
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
  CONSTRAINT risk_mgmt_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_risk_mgmt_user_id
  ON risk_mgmt(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_risk_mgmt_status
  ON risk_mgmt(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_risk_mgmt_created_at
  ON risk_mgmt(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_risk_mgmt_updated_at
  ON risk_mgmt(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_risk_mgmt_data_gin
  ON risk_mgmt USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_risk_mgmt_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER risk_mgmt_timestamp_trigger
BEFORE UPDATE ON risk_mgmt
FOR EACH ROW
EXECUTE FUNCTION update_risk_mgmt_timestamp();

COMMIT;