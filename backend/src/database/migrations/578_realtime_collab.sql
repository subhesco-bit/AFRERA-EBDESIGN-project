-- Migration: Create realtime_collab table
-- Description: Real-time Collaboration
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS realtime_collab (
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
  CONSTRAINT realtime_collab_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_realtime_collab_user_id
  ON realtime_collab(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_realtime_collab_status
  ON realtime_collab(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_realtime_collab_created_at
  ON realtime_collab(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_realtime_collab_updated_at
  ON realtime_collab(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_realtime_collab_data_gin
  ON realtime_collab USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_realtime_collab_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER realtime_collab_timestamp_trigger
BEFORE UPDATE ON realtime_collab
FOR EACH ROW
EXECUTE FUNCTION update_realtime_collab_timestamp();

COMMIT;