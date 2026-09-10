-- Migration: Create digital_signatures table
-- Description: Digital Signatures
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS digital_signatures (
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
  CONSTRAINT digital_signatures_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_digital_signatures_user_id
  ON digital_signatures(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_digital_signatures_status
  ON digital_signatures(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_digital_signatures_created_at
  ON digital_signatures(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_digital_signatures_updated_at
  ON digital_signatures(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_digital_signatures_data_gin
  ON digital_signatures USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_digital_signatures_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER digital_signatures_timestamp_trigger
BEFORE UPDATE ON digital_signatures
FOR EACH ROW
EXECUTE FUNCTION update_digital_signatures_timestamp();

COMMIT;