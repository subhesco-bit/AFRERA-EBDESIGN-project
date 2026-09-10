-- Migration: Create last_mile table
-- Description: Last Mile Delivery
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS last_mile (
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
  CONSTRAINT last_mile_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_last_mile_user_id
  ON last_mile(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_last_mile_status
  ON last_mile(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_last_mile_created_at
  ON last_mile(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_last_mile_updated_at
  ON last_mile(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_last_mile_data_gin
  ON last_mile USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_last_mile_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER last_mile_timestamp_trigger
BEFORE UPDATE ON last_mile
FOR EACH ROW
EXECUTE FUNCTION update_last_mile_timestamp();

COMMIT;