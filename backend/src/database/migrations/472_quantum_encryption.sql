-- Migration: Create quantum_encryption table
-- Description: Quantum Encryption
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS quantum_encryption (
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
  CONSTRAINT quantum_encryption_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_quantum_encryption_user_id
  ON quantum_encryption(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_quantum_encryption_status
  ON quantum_encryption(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_quantum_encryption_created_at
  ON quantum_encryption(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_quantum_encryption_updated_at
  ON quantum_encryption(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_quantum_encryption_data_gin
  ON quantum_encryption USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_quantum_encryption_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER quantum_encryption_timestamp_trigger
BEFORE UPDATE ON quantum_encryption
FOR EACH ROW
EXECUTE FUNCTION update_quantum_encryption_timestamp();

COMMIT;