-- Migration: Create proof_delivery table
-- Description: Proof of Delivery
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS proof_delivery (
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
  CONSTRAINT proof_delivery_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_proof_delivery_user_id
  ON proof_delivery(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_proof_delivery_status
  ON proof_delivery(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_proof_delivery_created_at
  ON proof_delivery(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_proof_delivery_updated_at
  ON proof_delivery(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_proof_delivery_data_gin
  ON proof_delivery USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_proof_delivery_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER proof_delivery_timestamp_trigger
BEFORE UPDATE ON proof_delivery
FOR EACH ROW
EXECUTE FUNCTION update_proof_delivery_timestamp();

COMMIT;