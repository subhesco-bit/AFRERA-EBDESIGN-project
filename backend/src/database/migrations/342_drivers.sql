-- Migration: Create drivers table
-- Description: Driver Management
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS drivers (
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
  CONSTRAINT drivers_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

ALTER TABLE drivers ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Create indexes for common queries
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'user_id') THEN
    CREATE INDEX IF NOT EXISTS idx_drivers_user_id ON drivers(user_id) WHERE deleted_at IS NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'status') THEN
    CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status) WHERE deleted_at IS NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'created_at') THEN
    CREATE INDEX IF NOT EXISTS idx_drivers_created_at ON drivers(created_at) WHERE deleted_at IS NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'updated_at') THEN
    CREATE INDEX IF NOT EXISTS idx_drivers_updated_at ON drivers(updated_at) WHERE deleted_at IS NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'data') THEN
    CREATE INDEX IF NOT EXISTS idx_drivers_data_gin ON drivers USING gin(data) WHERE deleted_at IS NULL;
  END IF;
END $$;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_drivers_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER drivers_timestamp_trigger
BEFORE UPDATE ON drivers
FOR EACH ROW
EXECUTE FUNCTION update_drivers_timestamp();

COMMIT;