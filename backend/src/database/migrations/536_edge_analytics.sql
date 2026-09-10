-- Migration: Create edge_analytics table
-- Description: Edge Analytics
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS edge_analytics (
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
  CONSTRAINT edge_analytics_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_edge_analytics_user_id
  ON edge_analytics(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_edge_analytics_status
  ON edge_analytics(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_edge_analytics_created_at
  ON edge_analytics(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_edge_analytics_updated_at
  ON edge_analytics(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_edge_analytics_data_gin
  ON edge_analytics USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_edge_analytics_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER edge_analytics_timestamp_trigger
BEFORE UPDATE ON edge_analytics
FOR EACH ROW
EXECUTE FUNCTION update_edge_analytics_timestamp();

COMMIT;