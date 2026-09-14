-- Migration: Create social_media table
-- Description: Social Media Management
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS social_media (
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
  CONSTRAINT social_media_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_social_media_user_id
  ON social_media(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_social_media_status
  ON social_media(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_social_media_created_at
  ON social_media(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_social_media_updated_at
  ON social_media(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_social_media_data_gin
  ON social_media USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_social_media_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER social_media_timestamp_trigger
BEFORE UPDATE ON social_media
FOR EACH ROW
EXECUTE FUNCTION update_social_media_timestamp();

COMMIT;