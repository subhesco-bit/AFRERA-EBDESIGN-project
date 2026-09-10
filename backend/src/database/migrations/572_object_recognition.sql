-- Migration: Create object_recognition table
-- Description: Object Recognition
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS object_recognition (
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
  CONSTRAINT object_recognition_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_object_recognition_user_id
  ON object_recognition(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_object_recognition_status
  ON object_recognition(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_object_recognition_created_at
  ON object_recognition(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_object_recognition_updated_at
  ON object_recognition(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_object_recognition_data_gin
  ON object_recognition USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_object_recognition_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER object_recognition_timestamp_trigger
BEFORE UPDATE ON object_recognition
FOR EACH ROW
EXECUTE FUNCTION update_object_recognition_timestamp();

COMMIT;