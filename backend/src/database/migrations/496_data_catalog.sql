-- Migration: Create data_catalog table
-- Description: Data Catalog
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS data_catalog (
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
  CONSTRAINT data_catalog_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_data_catalog_user_id
  ON data_catalog(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_data_catalog_status
  ON data_catalog(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_data_catalog_created_at
  ON data_catalog(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_data_catalog_updated_at
  ON data_catalog(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_data_catalog_data_gin
  ON data_catalog USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_data_catalog_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER data_catalog_timestamp_trigger
BEFORE UPDATE ON data_catalog
FOR EACH ROW
EXECUTE FUNCTION update_data_catalog_timestamp();

COMMIT;