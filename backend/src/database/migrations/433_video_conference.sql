-- Migration: Create video_conference table
-- Description: Video Conferencing
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS video_conference (
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
  CONSTRAINT video_conference_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_video_conference_user_id
  ON video_conference(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_video_conference_status
  ON video_conference(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_video_conference_created_at
  ON video_conference(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_video_conference_updated_at
  ON video_conference(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_video_conference_data_gin
  ON video_conference USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_video_conference_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER video_conference_timestamp_trigger
BEFORE UPDATE ON video_conference
FOR EACH ROW
EXECUTE FUNCTION update_video_conference_timestamp();

COMMIT;