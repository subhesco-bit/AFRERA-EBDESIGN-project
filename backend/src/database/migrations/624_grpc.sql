-- Migration: Create grpc table
-- Description: gRPC Framework
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS grpc (
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
  CONSTRAINT grpc_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_grpc_user_id
  ON grpc(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_grpc_status
  ON grpc(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_grpc_created_at
  ON grpc(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_grpc_updated_at
  ON grpc(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_grpc_data_gin
  ON grpc USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_grpc_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER grpc_timestamp_trigger
BEFORE UPDATE ON grpc
FOR EACH ROW
EXECUTE FUNCTION update_grpc_timestamp();

COMMIT;