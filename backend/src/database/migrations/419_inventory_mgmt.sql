-- Migration: Create inventory_mgmt table
-- Description: Inventory Management
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS inventory_mgmt (
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
  CONSTRAINT inventory_mgmt_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_inventory_mgmt_user_id
  ON inventory_mgmt(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_inventory_mgmt_status
  ON inventory_mgmt(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_inventory_mgmt_created_at
  ON inventory_mgmt(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_inventory_mgmt_updated_at
  ON inventory_mgmt(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_inventory_mgmt_data_gin
  ON inventory_mgmt USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_inventory_mgmt_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER inventory_mgmt_timestamp_trigger
BEFORE UPDATE ON inventory_mgmt
FOR EACH ROW
EXECUTE FUNCTION update_inventory_mgmt_timestamp();

COMMIT;