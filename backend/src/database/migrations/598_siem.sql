-- Migration: Create siem table
-- Description: Security Information Management
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS siem (
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
  CONSTRAINT siem_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_siem_user_id
  ON siem(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_siem_status
  ON siem(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_siem_created_at
  ON siem(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_siem_updated_at
  ON siem(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_siem_data_gin
  ON siem USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_siem_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER siem_timestamp_trigger
BEFORE UPDATE ON siem
FOR EACH ROW
EXECUTE FUNCTION update_siem_timestamp();

COMMIT;