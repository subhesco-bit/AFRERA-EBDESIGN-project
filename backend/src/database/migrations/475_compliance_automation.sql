-- Migration: Create compliance_automation table
-- Description: Compliance Automation
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS compliance_automation (
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
  CONSTRAINT compliance_automation_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_compliance_automation_user_id
  ON compliance_automation(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_compliance_automation_status
  ON compliance_automation(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_compliance_automation_created_at
  ON compliance_automation(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_compliance_automation_updated_at
  ON compliance_automation(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_compliance_automation_data_gin
  ON compliance_automation USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_compliance_automation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER compliance_automation_timestamp_trigger
BEFORE UPDATE ON compliance_automation
FOR EACH ROW
EXECUTE FUNCTION update_compliance_automation_timestamp();

COMMIT;