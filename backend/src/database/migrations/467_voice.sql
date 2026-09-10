-- Migration: Create voice table
-- Description: Voice Interface
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS voice (
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
  CONSTRAINT voice_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_voice_user_id
  ON voice(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_voice_status
  ON voice(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_voice_created_at
  ON voice(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_voice_updated_at
  ON voice(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_voice_data_gin
  ON voice USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_voice_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER voice_timestamp_trigger
BEFORE UPDATE ON voice
FOR EACH ROW
EXECUTE FUNCTION update_voice_timestamp();

COMMIT;