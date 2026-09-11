-- Migration: Create erp_integration table
-- Description: ERP Integration
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS erp_integration (
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
  CONSTRAINT erp_integration_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_erp_integration_user_id
  ON erp_integration(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_erp_integration_status
  ON erp_integration(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_erp_integration_created_at
  ON erp_integration(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_erp_integration_updated_at
  ON erp_integration(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_erp_integration_data_gin
  ON erp_integration USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_erp_integration_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER erp_integration_timestamp_trigger
BEFORE UPDATE ON erp_integration
FOR EACH ROW
EXECUTE FUNCTION update_erp_integration_timestamp();

COMMIT;