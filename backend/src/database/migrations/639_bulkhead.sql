-- Migration: Create bulkhead table
-- Description: Bulkhead Pattern
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS bulkhead (
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
  CONSTRAINT bulkhead_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_bulkhead_user_id
  ON bulkhead(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_bulkhead_status
  ON bulkhead(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_bulkhead_created_at
  ON bulkhead(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_bulkhead_updated_at
  ON bulkhead(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_bulkhead_data_gin
  ON bulkhead USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_bulkhead_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bulkhead_timestamp_trigger
BEFORE UPDATE ON bulkhead
FOR EACH ROW
EXECUTE FUNCTION update_bulkhead_timestamp();

COMMIT;