-- Migration: Create security_compliance table
-- Description: Security Compliance
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS security_compliance (
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
  CONSTRAINT security_compliance_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_security_compliance_user_id
  ON security_compliance(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_security_compliance_status
  ON security_compliance(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_security_compliance_created_at
  ON security_compliance(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_security_compliance_updated_at
  ON security_compliance(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_security_compliance_data_gin
  ON security_compliance USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_security_compliance_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER security_compliance_timestamp_trigger
BEFORE UPDATE ON security_compliance
FOR EACH ROW
EXECUTE FUNCTION update_security_compliance_timestamp();

COMMIT;