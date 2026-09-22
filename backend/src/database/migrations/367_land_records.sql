-- Migration: Create land_records table
-- Description: Land Records
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS land_records (
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
  CONSTRAINT land_records_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

ALTER TABLE land_records ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Create indexes for common queries
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'land_records' AND column_name = 'user_id') THEN CREATE INDEX IF NOT EXISTS idx_land_records_user_id ON land_records(user_id) WHERE deleted_at IS NULL; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'land_records' AND column_name = 'status') THEN CREATE INDEX IF NOT EXISTS idx_land_records_status ON land_records(status) WHERE deleted_at IS NULL; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'land_records' AND column_name = 'created_at') THEN CREATE INDEX IF NOT EXISTS idx_land_records_created_at ON land_records(created_at) WHERE deleted_at IS NULL; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'land_records' AND column_name = 'updated_at') THEN CREATE INDEX IF NOT EXISTS idx_land_records_updated_at ON land_records(updated_at) WHERE deleted_at IS NULL; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'land_records' AND column_name = 'data') THEN CREATE INDEX IF NOT EXISTS idx_land_records_data_gin ON land_records USING gin(data) WHERE deleted_at IS NULL; END IF;
END $$;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_land_records_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER land_records_timestamp_trigger
BEFORE UPDATE ON land_records
FOR EACH ROW
EXECUTE FUNCTION update_land_records_timestamp();

COMMIT;