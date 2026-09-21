-- Migration: Create model_evaluation table
-- Description: Model Evaluation
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS model_evaluation (
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
  CONSTRAINT model_evaluation_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_model_evaluation_user_id
  ON model_evaluation(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_model_evaluation_status
  ON model_evaluation(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_model_evaluation_created_at
  ON model_evaluation(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_model_evaluation_updated_at
  ON model_evaluation(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_model_evaluation_data_gin
  ON model_evaluation USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_model_evaluation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER model_evaluation_timestamp_trigger
BEFORE UPDATE ON model_evaluation
FOR EACH ROW
EXECUTE FUNCTION update_model_evaluation_timestamp();

COMMIT;