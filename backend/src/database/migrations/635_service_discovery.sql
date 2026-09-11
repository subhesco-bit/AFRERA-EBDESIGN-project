-- Migration: Create service_discovery table
-- Description: Service Discovery
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS service_discovery (
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
  CONSTRAINT service_discovery_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_service_discovery_user_id
  ON service_discovery(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_service_discovery_status
  ON service_discovery(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_service_discovery_created_at
  ON service_discovery(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_service_discovery_updated_at
  ON service_discovery(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_service_discovery_data_gin
  ON service_discovery USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_service_discovery_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER service_discovery_timestamp_trigger
BEFORE UPDATE ON service_discovery
FOR EACH ROW
EXECUTE FUNCTION update_service_discovery_timestamp();

COMMIT;