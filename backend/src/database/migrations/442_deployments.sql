-- Migration: Create deployments table
-- Description: Deployment Management
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS deployments (
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
  CONSTRAINT deployments_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_deployments_user_id
  ON deployments(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_deployments_status
  ON deployments(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_deployments_created_at
  ON deployments(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_deployments_updated_at
  ON deployments(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_deployments_data_gin
  ON deployments USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_deployments_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER deployments_timestamp_trigger
BEFORE UPDATE ON deployments
FOR EACH ROW
EXECUTE FUNCTION update_deployments_timestamp();

COMMIT;