-- Migration: Create rural_employment table
-- Description: Rural Employment
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS rural_employment (
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
  CONSTRAINT rural_employment_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_rural_employment_user_id
  ON rural_employment(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_rural_employment_status
  ON rural_employment(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_rural_employment_created_at
  ON rural_employment(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_rural_employment_updated_at
  ON rural_employment(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_rural_employment_data_gin
  ON rural_employment USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_rural_employment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rural_employment_timestamp_trigger
BEFORE UPDATE ON rural_employment
FOR EACH ROW
EXECUTE FUNCTION update_rural_employment_timestamp();

COMMIT;