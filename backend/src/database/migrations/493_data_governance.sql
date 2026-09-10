-- Migration: Create data_governance table
-- Description: Data Governance
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS data_governance (
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
  CONSTRAINT data_governance_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_data_governance_user_id
  ON data_governance(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_data_governance_status
  ON data_governance(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_data_governance_created_at
  ON data_governance(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_data_governance_updated_at
  ON data_governance(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_data_governance_data_gin
  ON data_governance USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_data_governance_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER data_governance_timestamp_trigger
BEFORE UPDATE ON data_governance
FOR EACH ROW
EXECUTE FUNCTION update_data_governance_timestamp();

COMMIT;