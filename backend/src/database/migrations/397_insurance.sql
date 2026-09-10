-- Migration: Create insurance table
-- Description: Insurance Products
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS insurance (
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
  CONSTRAINT insurance_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_insurance_user_id
  ON insurance(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_insurance_status
  ON insurance(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_insurance_created_at
  ON insurance(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_insurance_updated_at
  ON insurance(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_insurance_data_gin
  ON insurance USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_insurance_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER insurance_timestamp_trigger
BEFORE UPDATE ON insurance
FOR EACH ROW
EXECUTE FUNCTION update_insurance_timestamp();

COMMIT;