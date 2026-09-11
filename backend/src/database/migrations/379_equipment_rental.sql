-- Migration: Create equipment_rental table
-- Description: Equipment Rental
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS equipment_rental (
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
  CONSTRAINT equipment_rental_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_equipment_rental_user_id
  ON equipment_rental(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_equipment_rental_status
  ON equipment_rental(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_equipment_rental_created_at
  ON equipment_rental(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_equipment_rental_updated_at
  ON equipment_rental(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_equipment_rental_data_gin
  ON equipment_rental USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_equipment_rental_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER equipment_rental_timestamp_trigger
BEFORE UPDATE ON equipment_rental
FOR EACH ROW
EXECUTE FUNCTION update_equipment_rental_timestamp();

COMMIT;