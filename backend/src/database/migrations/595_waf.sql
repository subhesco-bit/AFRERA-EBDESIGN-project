-- Migration: Create waf table
-- Description: Web Application Firewall
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS waf (
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
  CONSTRAINT waf_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_waf_user_id
  ON waf(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_waf_status
  ON waf(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_waf_created_at
  ON waf(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_waf_updated_at
  ON waf(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_waf_data_gin
  ON waf USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_waf_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER waf_timestamp_trigger
BEFORE UPDATE ON waf
FOR EACH ROW
EXECUTE FUNCTION update_waf_timestamp();

COMMIT;