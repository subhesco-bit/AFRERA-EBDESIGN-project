-- Migration: Create rate_limiting table
-- Description: API Rate Limiting
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS rate_limiting (
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
  CONSTRAINT rate_limiting_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_rate_limiting_user_id
  ON rate_limiting(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_rate_limiting_status
  ON rate_limiting(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_rate_limiting_created_at
  ON rate_limiting(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_rate_limiting_updated_at
  ON rate_limiting(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_rate_limiting_data_gin
  ON rate_limiting USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_rate_limiting_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rate_limiting_timestamp_trigger
BEFORE UPDATE ON rate_limiting
FOR EACH ROW
EXECUTE FUNCTION update_rate_limiting_timestamp();

COMMIT;