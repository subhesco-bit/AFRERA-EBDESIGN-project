-- Migration: Create analytics_engine table
-- Description: Advanced Analytics Engine
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS analytics_engine (
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
  CONSTRAINT analytics_engine_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_analytics_engine_user_id
  ON analytics_engine(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_analytics_engine_status
  ON analytics_engine(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_analytics_engine_created_at
  ON analytics_engine(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_analytics_engine_updated_at
  ON analytics_engine(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_analytics_engine_data_gin
  ON analytics_engine USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_analytics_engine_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER analytics_engine_timestamp_trigger
BEFORE UPDATE ON analytics_engine
FOR EACH ROW
EXECUTE FUNCTION update_analytics_engine_timestamp();

COMMIT;