-- Migration: Create hand_tracking table
-- Description: Hand Tracking
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS hand_tracking (
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
  CONSTRAINT hand_tracking_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_hand_tracking_user_id
  ON hand_tracking(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_hand_tracking_status
  ON hand_tracking(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_hand_tracking_created_at
  ON hand_tracking(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_hand_tracking_updated_at
  ON hand_tracking(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_hand_tracking_data_gin
  ON hand_tracking USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_hand_tracking_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER hand_tracking_timestamp_trigger
BEFORE UPDATE ON hand_tracking
FOR EACH ROW
EXECUTE FUNCTION update_hand_tracking_timestamp();

COMMIT;