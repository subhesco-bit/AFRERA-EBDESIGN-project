-- Migration: Create intrusion_prevention table
-- Description: Intrusion Prevention
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS intrusion_prevention (
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
  CONSTRAINT intrusion_prevention_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_intrusion_prevention_user_id
  ON intrusion_prevention(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_intrusion_prevention_status
  ON intrusion_prevention(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_intrusion_prevention_created_at
  ON intrusion_prevention(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_intrusion_prevention_updated_at
  ON intrusion_prevention(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_intrusion_prevention_data_gin
  ON intrusion_prevention USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_intrusion_prevention_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER intrusion_prevention_timestamp_trigger
BEFORE UPDATE ON intrusion_prevention
FOR EACH ROW
EXECUTE FUNCTION update_intrusion_prevention_timestamp();

COMMIT;