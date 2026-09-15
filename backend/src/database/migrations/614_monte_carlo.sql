-- Migration: Create monte_carlo table
-- Description: Monte Carlo Simulation
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS monte_carlo (
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
  CONSTRAINT monte_carlo_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_monte_carlo_user_id
  ON monte_carlo(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_monte_carlo_status
  ON monte_carlo(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_monte_carlo_created_at
  ON monte_carlo(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_monte_carlo_updated_at
  ON monte_carlo(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_monte_carlo_data_gin
  ON monte_carlo USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_monte_carlo_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER monte_carlo_timestamp_trigger
BEFORE UPDATE ON monte_carlo
FOR EACH ROW
EXECUTE FUNCTION update_monte_carlo_timestamp();

COMMIT;