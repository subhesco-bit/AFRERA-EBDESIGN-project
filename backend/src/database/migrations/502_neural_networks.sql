-- Migration: Create neural_networks table
-- Description: Neural Networks
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS neural_networks (
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
  CONSTRAINT neural_networks_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_neural_networks_user_id
  ON neural_networks(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_neural_networks_status
  ON neural_networks(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_neural_networks_created_at
  ON neural_networks(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_neural_networks_updated_at
  ON neural_networks(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_neural_networks_data_gin
  ON neural_networks USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_neural_networks_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER neural_networks_timestamp_trigger
BEFORE UPDATE ON neural_networks
FOR EACH ROW
EXECUTE FUNCTION update_neural_networks_timestamp();

COMMIT;