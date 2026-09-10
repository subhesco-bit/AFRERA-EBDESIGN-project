-- Migration: Create investments table
-- Description: Investment Opportunities
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS investments (
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
  CONSTRAINT investments_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_investments_user_id
  ON investments(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_investments_status
  ON investments(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_investments_created_at
  ON investments(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_investments_updated_at
  ON investments(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_investments_data_gin
  ON investments USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_investments_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER investments_timestamp_trigger
BEFORE UPDATE ON investments
FOR EACH ROW
EXECUTE FUNCTION update_investments_timestamp();

COMMIT;