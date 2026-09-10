-- Migration: Create data_integration table
-- Description: Data Integration
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS data_integration (
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
  CONSTRAINT data_integration_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_data_integration_user_id
  ON data_integration(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_data_integration_status
  ON data_integration(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_data_integration_created_at
  ON data_integration(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_data_integration_updated_at
  ON data_integration(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_data_integration_data_gin
  ON data_integration USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_data_integration_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER data_integration_timestamp_trigger
BEFORE UPDATE ON data_integration
FOR EACH ROW
EXECUTE FUNCTION update_data_integration_timestamp();

COMMIT;