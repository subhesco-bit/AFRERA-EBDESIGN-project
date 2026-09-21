-- Migration: Create irrigation table
-- Description: Irrigation Optimization
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS irrigation (
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
  CONSTRAINT irrigation_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_irrigation_user_id
  ON irrigation(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_irrigation_status
  ON irrigation(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_irrigation_created_at
  ON irrigation(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_irrigation_updated_at
  ON irrigation(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_irrigation_data_gin
  ON irrigation USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_irrigation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER irrigation_timestamp_trigger
BEFORE UPDATE ON irrigation
FOR EACH ROW
EXECUTE FUNCTION update_irrigation_timestamp();

COMMIT;