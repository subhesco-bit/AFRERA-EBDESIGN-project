-- Migration: Create ai_predictions table
-- Description: AI Predictions
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS ai_predictions (
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
  CONSTRAINT ai_predictions_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_ai_predictions_user_id
  ON ai_predictions(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_ai_predictions_status
  ON ai_predictions(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_ai_predictions_created_at
  ON ai_predictions(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_ai_predictions_updated_at
  ON ai_predictions(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_ai_predictions_data_gin
  ON ai_predictions USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_ai_predictions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ai_predictions_timestamp_trigger
BEFORE UPDATE ON ai_predictions
FOR EACH ROW
EXECUTE FUNCTION update_ai_predictions_timestamp();

COMMIT;