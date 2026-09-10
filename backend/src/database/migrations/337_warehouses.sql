-- Migration: Create warehouses table
-- Description: Warehouse Management
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS warehouses (
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
  CONSTRAINT warehouses_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_warehouses_user_id
  ON warehouses(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_warehouses_status
  ON warehouses(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_warehouses_created_at
  ON warehouses(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_warehouses_updated_at
  ON warehouses(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_warehouses_data_gin
  ON warehouses USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_warehouses_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER warehouses_timestamp_trigger
BEFORE UPDATE ON warehouses
FOR EACH ROW
EXECUTE FUNCTION update_warehouses_timestamp();

COMMIT;