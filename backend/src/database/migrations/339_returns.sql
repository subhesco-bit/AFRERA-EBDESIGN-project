-- Migration: Create returns table
-- Description: Returns & Reverse Logistics
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS returns (
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
  CONSTRAINT returns_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_returns_user_id
  ON returns(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_returns_status
  ON returns(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_returns_created_at
  ON returns(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_returns_updated_at
  ON returns(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_returns_data_gin
  ON returns USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_returns_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER returns_timestamp_trigger
BEFORE UPDATE ON returns
FOR EACH ROW
EXECUTE FUNCTION update_returns_timestamp();

COMMIT;