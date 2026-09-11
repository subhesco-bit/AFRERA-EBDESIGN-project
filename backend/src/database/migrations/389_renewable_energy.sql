-- Migration: Create renewable_energy table
-- Description: Renewable Energy
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS renewable_energy (
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
  CONSTRAINT renewable_energy_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_renewable_energy_user_id
  ON renewable_energy(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_renewable_energy_status
  ON renewable_energy(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_renewable_energy_created_at
  ON renewable_energy(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_renewable_energy_updated_at
  ON renewable_energy(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_renewable_energy_data_gin
  ON renewable_energy USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_renewable_energy_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER renewable_energy_timestamp_trigger
BEFORE UPDATE ON renewable_energy
FOR EACH ROW
EXECUTE FUNCTION update_renewable_energy_timestamp();

COMMIT;