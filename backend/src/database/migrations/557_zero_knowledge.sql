-- Migration: Create zero_knowledge table
-- Description: Zero-knowledge Proofs
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS zero_knowledge (
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
  CONSTRAINT zero_knowledge_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_zero_knowledge_user_id
  ON zero_knowledge(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_zero_knowledge_status
  ON zero_knowledge(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_zero_knowledge_created_at
  ON zero_knowledge(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_zero_knowledge_updated_at
  ON zero_knowledge(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_zero_knowledge_data_gin
  ON zero_knowledge USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_zero_knowledge_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER zero_knowledge_timestamp_trigger
BEFORE UPDATE ON zero_knowledge
FOR EACH ROW
EXECUTE FUNCTION update_zero_knowledge_timestamp();

COMMIT;