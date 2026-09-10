-- Migration: Create supply_visibility table
-- Description: Supply Chain Visibility
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS supply_visibility (
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
  CONSTRAINT supply_visibility_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_supply_visibility_user_id
  ON supply_visibility(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_supply_visibility_status
  ON supply_visibility(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_supply_visibility_created_at
  ON supply_visibility(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_supply_visibility_updated_at
  ON supply_visibility(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_supply_visibility_data_gin
  ON supply_visibility USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_supply_visibility_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER supply_visibility_timestamp_trigger
BEFORE UPDATE ON supply_visibility
FOR EACH ROW
EXECUTE FUNCTION update_supply_visibility_timestamp();

COMMIT;