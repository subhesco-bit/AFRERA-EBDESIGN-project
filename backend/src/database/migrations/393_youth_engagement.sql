-- Migration: Create youth_engagement table
-- Description: Youth Engagement
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS youth_engagement (
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
  CONSTRAINT youth_engagement_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_youth_engagement_user_id
  ON youth_engagement(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_youth_engagement_status
  ON youth_engagement(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_youth_engagement_created_at
  ON youth_engagement(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_youth_engagement_updated_at
  ON youth_engagement(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_youth_engagement_data_gin
  ON youth_engagement USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_youth_engagement_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER youth_engagement_timestamp_trigger
BEFORE UPDATE ON youth_engagement
FOR EACH ROW
EXECUTE FUNCTION update_youth_engagement_timestamp();

COMMIT;