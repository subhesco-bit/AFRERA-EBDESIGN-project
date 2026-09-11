-- Migration: Create performance table
-- Description: Performance Management
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS performance (
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
  CONSTRAINT performance_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_performance_user_id
  ON performance(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_performance_status
  ON performance(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_performance_created_at
  ON performance(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_performance_updated_at
  ON performance(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_performance_data_gin
  ON performance USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_performance_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER performance_timestamp_trigger
BEFORE UPDATE ON performance
FOR EACH ROW
EXECUTE FUNCTION update_performance_timestamp();

COMMIT;