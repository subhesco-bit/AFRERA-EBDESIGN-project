-- Migration: Create pest_management table
-- Description: Pest Management
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS pest_management (
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
  CONSTRAINT pest_management_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_pest_management_user_id
  ON pest_management(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_pest_management_status
  ON pest_management(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_pest_management_created_at
  ON pest_management(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_pest_management_updated_at
  ON pest_management(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_pest_management_data_gin
  ON pest_management USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_pest_management_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pest_management_timestamp_trigger
BEFORE UPDATE ON pest_management
FOR EACH ROW
EXECUTE FUNCTION update_pest_management_timestamp();

COMMIT;