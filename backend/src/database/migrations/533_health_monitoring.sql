-- Migration: Create health_monitoring table
-- Description: Health Monitoring
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS health_monitoring (
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
  CONSTRAINT health_monitoring_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_health_monitoring_user_id
  ON health_monitoring(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_health_monitoring_status
  ON health_monitoring(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_health_monitoring_created_at
  ON health_monitoring(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_health_monitoring_updated_at
  ON health_monitoring(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_health_monitoring_data_gin
  ON health_monitoring USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_health_monitoring_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER health_monitoring_timestamp_trigger
BEFORE UPDATE ON health_monitoring
FOR EACH ROW
EXECUTE FUNCTION update_health_monitoring_timestamp();

COMMIT;