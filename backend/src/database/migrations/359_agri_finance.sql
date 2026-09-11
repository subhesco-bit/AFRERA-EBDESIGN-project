-- Migration: Create agri_finance table
-- Description: Agricultural Finance
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS agri_finance (
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
  CONSTRAINT agri_finance_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_agri_finance_user_id
  ON agri_finance(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_agri_finance_status
  ON agri_finance(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_agri_finance_created_at
  ON agri_finance(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_agri_finance_updated_at
  ON agri_finance(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_agri_finance_data_gin
  ON agri_finance USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_agri_finance_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER agri_finance_timestamp_trigger
BEFORE UPDATE ON agri_finance
FOR EACH ROW
EXECUTE FUNCTION update_agri_finance_timestamp();

COMMIT;