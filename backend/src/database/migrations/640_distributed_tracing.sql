-- Migration: Create distributed_tracing table
-- Description: Distributed Tracing
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS distributed_tracing (
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
  CONSTRAINT distributed_tracing_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_distributed_tracing_user_id
  ON distributed_tracing(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_distributed_tracing_status
  ON distributed_tracing(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_distributed_tracing_created_at
  ON distributed_tracing(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_distributed_tracing_updated_at
  ON distributed_tracing(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_distributed_tracing_data_gin
  ON distributed_tracing USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_distributed_tracing_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER distributed_tracing_timestamp_trigger
BEFORE UPDATE ON distributed_tracing
FOR EACH ROW
EXECUTE FUNCTION update_distributed_tracing_timestamp();

COMMIT;