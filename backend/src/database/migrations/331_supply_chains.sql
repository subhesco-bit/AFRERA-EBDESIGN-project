-- Migration: Create supply_chains table
-- Description: Supply Chain Coordination
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS supply_chains (
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
  CONSTRAINT supply_chains_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_supply_chains_user_id
  ON supply_chains(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_supply_chains_status
  ON supply_chains(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_supply_chains_created_at
  ON supply_chains(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_supply_chains_updated_at
  ON supply_chains(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_supply_chains_data_gin
  ON supply_chains USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_supply_chains_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER supply_chains_timestamp_trigger
BEFORE UPDATE ON supply_chains
FOR EACH ROW
EXECUTE FUNCTION update_supply_chains_timestamp();

COMMIT;