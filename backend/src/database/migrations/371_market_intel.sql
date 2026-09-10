-- Migration: Create market_intel table
-- Description: Market Intelligence
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS market_intel (
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
  CONSTRAINT market_intel_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_market_intel_user_id
  ON market_intel(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_market_intel_status
  ON market_intel(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_market_intel_created_at
  ON market_intel(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_market_intel_updated_at
  ON market_intel(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_market_intel_data_gin
  ON market_intel USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_market_intel_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER market_intel_timestamp_trigger
BEFORE UPDATE ON market_intel
FOR EACH ROW
EXECUTE FUNCTION update_market_intel_timestamp();

COMMIT;