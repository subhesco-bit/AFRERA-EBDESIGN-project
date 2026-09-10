-- Migration: Create event_streaming table
-- Description: Event Streaming
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS event_streaming (
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
  CONSTRAINT event_streaming_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_event_streaming_user_id
  ON event_streaming(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_event_streaming_status
  ON event_streaming(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_event_streaming_created_at
  ON event_streaming(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_event_streaming_updated_at
  ON event_streaming(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_event_streaming_data_gin
  ON event_streaming USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_event_streaming_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER event_streaming_timestamp_trigger
BEFORE UPDATE ON event_streaming
FOR EACH ROW
EXECUTE FUNCTION update_event_streaming_timestamp();

COMMIT;