-- Migration: Create resource_planning table
-- Description: Resource Planning
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS resource_planning (
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
  CONSTRAINT resource_planning_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_resource_planning_user_id
  ON resource_planning(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_resource_planning_status
  ON resource_planning(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_resource_planning_created_at
  ON resource_planning(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_resource_planning_updated_at
  ON resource_planning(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_resource_planning_data_gin
  ON resource_planning USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_resource_planning_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER resource_planning_timestamp_trigger
BEFORE UPDATE ON resource_planning
FOR EACH ROW
EXECUTE FUNCTION update_resource_planning_timestamp();

COMMIT;