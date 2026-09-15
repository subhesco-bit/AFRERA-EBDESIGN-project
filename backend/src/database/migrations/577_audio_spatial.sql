-- Migration: Create audio_spatial table
-- Description: Audio Spatialization
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS audio_spatial (
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
  CONSTRAINT audio_spatial_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_audio_spatial_user_id
  ON audio_spatial(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_audio_spatial_status
  ON audio_spatial(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_audio_spatial_created_at
  ON audio_spatial(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_audio_spatial_updated_at
  ON audio_spatial(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_audio_spatial_data_gin
  ON audio_spatial USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_audio_spatial_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audio_spatial_timestamp_trigger
BEFORE UPDATE ON audio_spatial
FOR EACH ROW
EXECUTE FUNCTION update_audio_spatial_timestamp();

COMMIT;