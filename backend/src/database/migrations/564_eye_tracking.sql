-- Migration: Create eye_tracking table
-- Description: Eye Tracking
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS eye_tracking (
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
  CONSTRAINT eye_tracking_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_eye_tracking_user_id
  ON eye_tracking(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_eye_tracking_status
  ON eye_tracking(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_eye_tracking_created_at
  ON eye_tracking(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_eye_tracking_updated_at
  ON eye_tracking(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_eye_tracking_data_gin
  ON eye_tracking USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_eye_tracking_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER eye_tracking_timestamp_trigger
BEFORE UPDATE ON eye_tracking
FOR EACH ROW
EXECUTE FUNCTION update_eye_tracking_timestamp();

COMMIT;