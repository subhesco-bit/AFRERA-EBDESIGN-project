-- Migration: Create atomic_swaps table
-- Description: Atomic Swaps
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS atomic_swaps (
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
  CONSTRAINT atomic_swaps_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_atomic_swaps_user_id
  ON atomic_swaps(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_atomic_swaps_status
  ON atomic_swaps(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_atomic_swaps_created_at
  ON atomic_swaps(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_atomic_swaps_updated_at
  ON atomic_swaps(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_atomic_swaps_data_gin
  ON atomic_swaps USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_atomic_swaps_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER atomic_swaps_timestamp_trigger
BEFORE UPDATE ON atomic_swaps
FOR EACH ROW
EXECUTE FUNCTION update_atomic_swaps_timestamp();

COMMIT;