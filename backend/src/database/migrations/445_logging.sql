-- Migration: Create logging table
-- Description: Logging & Analysis
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS logging (
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
  CONSTRAINT logging_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_logging_user_id
  ON logging(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_logging_status
  ON logging(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_logging_created_at
  ON logging(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_logging_updated_at
  ON logging(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_logging_data_gin
  ON logging USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_logging_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER logging_timestamp_trigger
BEFORE UPDATE ON logging
FOR EACH ROW
EXECUTE FUNCTION update_logging_timestamp();

COMMIT;