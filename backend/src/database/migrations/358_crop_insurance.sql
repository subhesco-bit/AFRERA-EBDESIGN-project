-- Migration: Create crop_insurance table
-- Description: Crop Insurance
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS crop_insurance (
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
  CONSTRAINT crop_insurance_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_crop_insurance_user_id
  ON crop_insurance(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_crop_insurance_status
  ON crop_insurance(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_crop_insurance_created_at
  ON crop_insurance(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_crop_insurance_updated_at
  ON crop_insurance(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_crop_insurance_data_gin
  ON crop_insurance USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_crop_insurance_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER crop_insurance_timestamp_trigger
BEFORE UPDATE ON crop_insurance
FOR EACH ROW
EXECUTE FUNCTION update_crop_insurance_timestamp();

COMMIT;