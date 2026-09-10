-- Migration: Create smart_contracts table
-- Description: Smart Contracts
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS smart_contracts (
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
  CONSTRAINT smart_contracts_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_smart_contracts_user_id
  ON smart_contracts(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_smart_contracts_status
  ON smart_contracts(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_smart_contracts_created_at
  ON smart_contracts(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_smart_contracts_updated_at
  ON smart_contracts(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_smart_contracts_data_gin
  ON smart_contracts USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_smart_contracts_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER smart_contracts_timestamp_trigger
BEFORE UPDATE ON smart_contracts
FOR EACH ROW
EXECUTE FUNCTION update_smart_contracts_timestamp();

COMMIT;