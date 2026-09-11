-- Migration: Create crypto_payments table
-- Description: Cryptocurrency Payments
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS crypto_payments (
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
  CONSTRAINT crypto_payments_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_crypto_payments_user_id
  ON crypto_payments(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_crypto_payments_status
  ON crypto_payments(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_crypto_payments_created_at
  ON crypto_payments(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_crypto_payments_updated_at
  ON crypto_payments(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_crypto_payments_data_gin
  ON crypto_payments USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_crypto_payments_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER crypto_payments_timestamp_trigger
BEFORE UPDATE ON crypto_payments
FOR EACH ROW
EXECUTE FUNCTION update_crypto_payments_timestamp();

COMMIT;