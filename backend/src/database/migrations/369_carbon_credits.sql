-- Migration: Create carbon_credits table
-- Description: Carbon Credits
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS carbon_credits (
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
  CONSTRAINT carbon_credits_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_carbon_credits_user_id
  ON carbon_credits(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_carbon_credits_status
  ON carbon_credits(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_carbon_credits_created_at
  ON carbon_credits(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_carbon_credits_updated_at
  ON carbon_credits(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_carbon_credits_data_gin
  ON carbon_credits USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_carbon_credits_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER carbon_credits_timestamp_trigger
BEFORE UPDATE ON carbon_credits
FOR EACH ROW
EXECUTE FUNCTION update_carbon_credits_timestamp();

COMMIT;