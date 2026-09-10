-- Migration: Create xr_services table
-- Description: XR Platform Services
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS xr_services (
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
  CONSTRAINT xr_services_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_xr_services_user_id
  ON xr_services(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_xr_services_status
  ON xr_services(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_xr_services_created_at
  ON xr_services(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_xr_services_updated_at
  ON xr_services(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_xr_services_data_gin
  ON xr_services USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_xr_services_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER xr_services_timestamp_trigger
BEFORE UPDATE ON xr_services
FOR EACH ROW
EXECUTE FUNCTION update_xr_services_timestamp();

COMMIT;