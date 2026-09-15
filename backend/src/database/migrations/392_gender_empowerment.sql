-- Migration: Create gender_empowerment table
-- Description: Gender Empowerment
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS gender_empowerment (
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
  CONSTRAINT gender_empowerment_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_gender_empowerment_user_id
  ON gender_empowerment(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_gender_empowerment_status
  ON gender_empowerment(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_gender_empowerment_created_at
  ON gender_empowerment(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_gender_empowerment_updated_at
  ON gender_empowerment(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_gender_empowerment_data_gin
  ON gender_empowerment USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_gender_empowerment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER gender_empowerment_timestamp_trigger
BEFORE UPDATE ON gender_empowerment
FOR EACH ROW
EXECUTE FUNCTION update_gender_empowerment_timestamp();

COMMIT;