-- Migration: Create message_queue table
-- Description: Message Queue
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS message_queue (
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
  CONSTRAINT message_queue_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_message_queue_user_id
  ON message_queue(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_message_queue_status
  ON message_queue(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_message_queue_created_at
  ON message_queue(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_message_queue_updated_at
  ON message_queue(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_message_queue_data_gin
  ON message_queue USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_message_queue_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER message_queue_timestamp_trigger
BEFORE UPDATE ON message_queue
FOR EACH ROW
EXECUTE FUNCTION update_message_queue_timestamp();

COMMIT;