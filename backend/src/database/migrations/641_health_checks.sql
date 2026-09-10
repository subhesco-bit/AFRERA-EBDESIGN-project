-- Migration: Create health_checks table
-- Description: Health Checks
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS health_checks (
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
  CONSTRAINT health_checks_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_health_checks_user_id
  ON health_checks(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_health_checks_status
  ON health_checks(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_health_checks_created_at
  ON health_checks(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_health_checks_updated_at
  ON health_checks(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_health_checks_data_gin
  ON health_checks USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_health_checks_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER health_checks_timestamp_trigger
BEFORE UPDATE ON health_checks
FOR EACH ROW
EXECUTE FUNCTION update_health_checks_timestamp();

COMMIT;