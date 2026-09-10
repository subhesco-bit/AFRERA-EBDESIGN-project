-- Migration: Create classification table
-- Description: Classification Models
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS classification (
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
  CONSTRAINT classification_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_classification_user_id
  ON classification(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_classification_status
  ON classification(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_classification_created_at
  ON classification(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_classification_updated_at
  ON classification(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_classification_data_gin
  ON classification USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_classification_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER classification_timestamp_trigger
BEFORE UPDATE ON classification
FOR EACH ROW
EXECUTE FUNCTION update_classification_timestamp();

COMMIT;