-- Migration: Create tax_optimization table
-- Description: Tax Optimization
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS tax_optimization (
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
  CONSTRAINT tax_optimization_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_tax_optimization_user_id
  ON tax_optimization(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_tax_optimization_status
  ON tax_optimization(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_tax_optimization_created_at
  ON tax_optimization(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_tax_optimization_updated_at
  ON tax_optimization(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_tax_optimization_data_gin
  ON tax_optimization USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_tax_optimization_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tax_optimization_timestamp_trigger
BEFORE UPDATE ON tax_optimization
FOR EACH ROW
EXECUTE FUNCTION update_tax_optimization_timestamp();

COMMIT;