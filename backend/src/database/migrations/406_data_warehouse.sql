-- Migration: Create data_warehouse table
-- Description: Data Warehousing
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS data_warehouse (
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
  CONSTRAINT data_warehouse_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_data_warehouse_user_id
  ON data_warehouse(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_data_warehouse_status
  ON data_warehouse(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_data_warehouse_created_at
  ON data_warehouse(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_data_warehouse_updated_at
  ON data_warehouse(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_data_warehouse_data_gin
  ON data_warehouse USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_data_warehouse_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER data_warehouse_timestamp_trigger
BEFORE UPDATE ON data_warehouse
FOR EACH ROW
EXECUTE FUNCTION update_data_warehouse_timestamp();

COMMIT;