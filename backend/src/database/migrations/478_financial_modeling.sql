-- Migration: Create financial_modeling table
-- Description: Financial Modeling
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS financial_modeling (
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
  CONSTRAINT financial_modeling_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_financial_modeling_user_id
  ON financial_modeling(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_financial_modeling_status
  ON financial_modeling(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_financial_modeling_created_at
  ON financial_modeling(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_financial_modeling_updated_at
  ON financial_modeling(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_financial_modeling_data_gin
  ON financial_modeling USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_financial_modeling_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER financial_modeling_timestamp_trigger
BEFORE UPDATE ON financial_modeling
FOR EACH ROW
EXECUTE FUNCTION update_financial_modeling_timestamp();

COMMIT;