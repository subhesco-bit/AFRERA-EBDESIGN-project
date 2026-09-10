-- Migration: Create surveys table
-- Description: Survey & Feedback
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS surveys (
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
  CONSTRAINT surveys_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_surveys_user_id
  ON surveys(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_surveys_status
  ON surveys(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_surveys_created_at
  ON surveys(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_surveys_updated_at
  ON surveys(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_surveys_data_gin
  ON surveys USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_surveys_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER surveys_timestamp_trigger
BEFORE UPDATE ON surveys
FOR EACH ROW
EXECUTE FUNCTION update_surveys_timestamp();

COMMIT;