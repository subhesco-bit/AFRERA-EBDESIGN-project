-- Migration: Create holograms table
-- Description: Hologram Display
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS holograms (
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
  CONSTRAINT holograms_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_holograms_user_id
  ON holograms(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_holograms_status
  ON holograms(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_holograms_created_at
  ON holograms(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_holograms_updated_at
  ON holograms(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_holograms_data_gin
  ON holograms USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_holograms_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER holograms_timestamp_trigger
BEFORE UPDATE ON holograms
FOR EACH ROW
EXECUTE FUNCTION update_holograms_timestamp();

COMMIT;