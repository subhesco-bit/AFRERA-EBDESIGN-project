-- Migration: Create monitoring table
-- Description: Monitoring & Alerting
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS monitoring (
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
  CONSTRAINT monitoring_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_monitoring_user_id
  ON monitoring(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_monitoring_status
  ON monitoring(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_monitoring_created_at
  ON monitoring(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_monitoring_updated_at
  ON monitoring(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_monitoring_data_gin
  ON monitoring USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_monitoring_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER monitoring_timestamp_trigger
BEFORE UPDATE ON monitoring
FOR EACH ROW
EXECUTE FUNCTION update_monitoring_timestamp();

COMMIT;