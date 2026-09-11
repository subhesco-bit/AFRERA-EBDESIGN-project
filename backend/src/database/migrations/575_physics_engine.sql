-- Migration: Create physics_engine table
-- Description: Physics Engine
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS physics_engine (
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
  CONSTRAINT physics_engine_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_physics_engine_user_id
  ON physics_engine(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_physics_engine_status
  ON physics_engine(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_physics_engine_created_at
  ON physics_engine(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_physics_engine_updated_at
  ON physics_engine(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_physics_engine_data_gin
  ON physics_engine USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_physics_engine_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER physics_engine_timestamp_trigger
BEFORE UPDATE ON physics_engine
FOR EACH ROW
EXECUTE FUNCTION update_physics_engine_timestamp();

COMMIT;