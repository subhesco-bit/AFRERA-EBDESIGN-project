-- Migration: Create api_testing table
-- Description: API Testing Framework
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS api_testing (
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
  CONSTRAINT api_testing_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_api_testing_user_id
  ON api_testing(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_api_testing_status
  ON api_testing(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_api_testing_created_at
  ON api_testing(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_api_testing_updated_at
  ON api_testing(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_api_testing_data_gin
  ON api_testing USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_api_testing_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER api_testing_timestamp_trigger
BEFORE UPDATE ON api_testing
FOR EACH ROW
EXECUTE FUNCTION update_api_testing_timestamp();

COMMIT;