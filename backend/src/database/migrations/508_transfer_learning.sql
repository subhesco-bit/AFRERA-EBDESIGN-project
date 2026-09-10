-- Migration: Create transfer_learning table
-- Description: Transfer Learning
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS transfer_learning (
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
  CONSTRAINT transfer_learning_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_transfer_learning_user_id
  ON transfer_learning(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_transfer_learning_status
  ON transfer_learning(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_transfer_learning_created_at
  ON transfer_learning(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_transfer_learning_updated_at
  ON transfer_learning(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_transfer_learning_data_gin
  ON transfer_learning USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_transfer_learning_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER transfer_learning_timestamp_trigger
BEFORE UPDATE ON transfer_learning
FOR EACH ROW
EXECUTE FUNCTION update_transfer_learning_timestamp();

COMMIT;