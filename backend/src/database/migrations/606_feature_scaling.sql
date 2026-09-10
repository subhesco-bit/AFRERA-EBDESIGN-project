-- Migration: Create feature_scaling table
-- Description: Feature Scaling
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS feature_scaling (
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
  CONSTRAINT feature_scaling_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_feature_scaling_user_id
  ON feature_scaling(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_feature_scaling_status
  ON feature_scaling(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_feature_scaling_created_at
  ON feature_scaling(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_feature_scaling_updated_at
  ON feature_scaling(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_feature_scaling_data_gin
  ON feature_scaling USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_feature_scaling_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER feature_scaling_timestamp_trigger
BEFORE UPDATE ON feature_scaling
FOR EACH ROW
EXECUTE FUNCTION update_feature_scaling_timestamp();

COMMIT;