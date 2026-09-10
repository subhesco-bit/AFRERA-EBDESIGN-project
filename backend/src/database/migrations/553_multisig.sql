-- Migration: Create multisig table
-- Description: Multi-signature Accounts
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS multisig (
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
  CONSTRAINT multisig_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_multisig_user_id
  ON multisig(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_multisig_status
  ON multisig(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_multisig_created_at
  ON multisig(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_multisig_updated_at
  ON multisig(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_multisig_data_gin
  ON multisig USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_multisig_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER multisig_timestamp_trigger
BEFORE UPDATE ON multisig
FOR EACH ROW
EXECUTE FUNCTION update_multisig_timestamp();

COMMIT;