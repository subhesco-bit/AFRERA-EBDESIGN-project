-- Migration: Create mr_rendering table
-- Description: Mixed Reality Rendering
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS mr_rendering (
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
  CONSTRAINT mr_rendering_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_mr_rendering_user_id
  ON mr_rendering(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_mr_rendering_status
  ON mr_rendering(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_mr_rendering_created_at
  ON mr_rendering(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_mr_rendering_updated_at
  ON mr_rendering(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_mr_rendering_data_gin
  ON mr_rendering USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_mr_rendering_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mr_rendering_timestamp_trigger
BEFORE UPDATE ON mr_rendering
FOR EACH ROW
EXECUTE FUNCTION update_mr_rendering_timestamp();

COMMIT;