-- Migration: Create blockchain_trace table
-- Description: Blockchain Traceability
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS blockchain_trace (
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
  CONSTRAINT blockchain_trace_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_blockchain_trace_user_id
  ON blockchain_trace(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_blockchain_trace_status
  ON blockchain_trace(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_blockchain_trace_created_at
  ON blockchain_trace(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_blockchain_trace_updated_at
  ON blockchain_trace(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_blockchain_trace_data_gin
  ON blockchain_trace USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_blockchain_trace_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER blockchain_trace_timestamp_trigger
BEFORE UPDATE ON blockchain_trace
FOR EACH ROW
EXECUTE FUNCTION update_blockchain_trace_timestamp();

COMMIT;