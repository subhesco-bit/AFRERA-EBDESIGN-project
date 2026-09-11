-- Migration: Create load_balancing table
-- Description: Load Balancing
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS load_balancing (
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
  CONSTRAINT load_balancing_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_load_balancing_user_id
  ON load_balancing(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_load_balancing_status
  ON load_balancing(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_load_balancing_created_at
  ON load_balancing(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_load_balancing_updated_at
  ON load_balancing(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_load_balancing_data_gin
  ON load_balancing USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_load_balancing_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER load_balancing_timestamp_trigger
BEFORE UPDATE ON load_balancing
FOR EACH ROW
EXECUTE FUNCTION update_load_balancing_timestamp();

COMMIT;