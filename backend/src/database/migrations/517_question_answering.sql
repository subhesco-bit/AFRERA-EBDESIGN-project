-- Migration: Create question_answering table
-- Description: Question Answering
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS question_answering (
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
  CONSTRAINT question_answering_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_question_answering_user_id
  ON question_answering(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_question_answering_status
  ON question_answering(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_question_answering_created_at
  ON question_answering(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_question_answering_updated_at
  ON question_answering(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_question_answering_data_gin
  ON question_answering USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_question_answering_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER question_answering_timestamp_trigger
BEFORE UPDATE ON question_answering
FOR EACH ROW
EXECUTE FUNCTION update_question_answering_timestamp();

COMMIT;