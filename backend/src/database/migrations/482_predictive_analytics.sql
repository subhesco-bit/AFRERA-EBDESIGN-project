-- Migration: Create predictive_analytics table
-- Description: Predictive Analytics
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS predictive_analytics (
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
  CONSTRAINT predictive_analytics_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_predictive_analytics_user_id
  ON predictive_analytics(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_predictive_analytics_status
  ON predictive_analytics(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_predictive_analytics_created_at
  ON predictive_analytics(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_predictive_analytics_updated_at
  ON predictive_analytics(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_predictive_analytics_data_gin
  ON predictive_analytics USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_predictive_analytics_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER predictive_analytics_timestamp_trigger
BEFORE UPDATE ON predictive_analytics
FOR EACH ROW
EXECUTE FUNCTION update_predictive_analytics_timestamp();

COMMIT;