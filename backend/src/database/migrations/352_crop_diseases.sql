-- Migration: Create crop_diseases table
-- Description: Crop Disease Detection
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS crop_diseases (
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
  CONSTRAINT crop_diseases_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_crop_diseases_user_id
  ON crop_diseases(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_crop_diseases_status
  ON crop_diseases(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_crop_diseases_created_at
  ON crop_diseases(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_crop_diseases_updated_at
  ON crop_diseases(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_crop_diseases_data_gin
  ON crop_diseases USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_crop_diseases_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER crop_diseases_timestamp_trigger
BEFORE UPDATE ON crop_diseases
FOR EACH ROW
EXECUTE FUNCTION update_crop_diseases_timestamp();

COMMIT;