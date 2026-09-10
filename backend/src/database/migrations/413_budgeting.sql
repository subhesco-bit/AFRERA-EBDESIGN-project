-- Migration: Create budgeting table
-- Description: Budgeting & Forecasting
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS budgeting (
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
  CONSTRAINT budgeting_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_budgeting_user_id
  ON budgeting(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_budgeting_status
  ON budgeting(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_budgeting_created_at
  ON budgeting(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_budgeting_updated_at
  ON budgeting(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_budgeting_data_gin
  ON budgeting USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_budgeting_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER budgeting_timestamp_trigger
BEFORE UPDATE ON budgeting
FOR EACH ROW
EXECUTE FUNCTION update_budgeting_timestamp();

COMMIT;