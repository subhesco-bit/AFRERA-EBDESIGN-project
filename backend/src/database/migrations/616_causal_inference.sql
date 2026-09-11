-- Migration: Create causal_inference table
-- Description: Causal Inference
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS causal_inference (
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
  CONSTRAINT causal_inference_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_causal_inference_user_id
  ON causal_inference(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_causal_inference_status
  ON causal_inference(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_causal_inference_created_at
  ON causal_inference(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_causal_inference_updated_at
  ON causal_inference(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_causal_inference_data_gin
  ON causal_inference USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_causal_inference_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER causal_inference_timestamp_trigger
BEFORE UPDATE ON causal_inference
FOR EACH ROW
EXECUTE FUNCTION update_causal_inference_timestamp();

COMMIT;