-- Migration: Create yield_prediction table
-- Description: Yield Prediction
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS yield_prediction (
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
  CONSTRAINT yield_prediction_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_yield_prediction_user_id
  ON yield_prediction(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_yield_prediction_status
  ON yield_prediction(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_yield_prediction_created_at
  ON yield_prediction(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_yield_prediction_updated_at
  ON yield_prediction(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_yield_prediction_data_gin
  ON yield_prediction USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_yield_prediction_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER yield_prediction_timestamp_trigger
BEFORE UPDATE ON yield_prediction
FOR EACH ROW
EXECUTE FUNCTION update_yield_prediction_timestamp();

COMMIT;