-- Migration: Create issues table
-- Description: Issue Tracking
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS issues (
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
  CONSTRAINT issues_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_issues_user_id
  ON issues(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_issues_status
  ON issues(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_issues_created_at
  ON issues(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_issues_updated_at
  ON issues(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_issues_data_gin
  ON issues USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_issues_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER issues_timestamp_trigger
BEFORE UPDATE ON issues
FOR EACH ROW
EXECUTE FUNCTION update_issues_timestamp();

COMMIT;