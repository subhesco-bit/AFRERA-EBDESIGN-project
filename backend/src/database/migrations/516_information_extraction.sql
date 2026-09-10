-- Migration: Create information_extraction table
-- Description: Information Extraction
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS information_extraction (
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
  CONSTRAINT information_extraction_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_information_extraction_user_id
  ON information_extraction(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_information_extraction_status
  ON information_extraction(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_information_extraction_created_at
  ON information_extraction(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_information_extraction_updated_at
  ON information_extraction(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_information_extraction_data_gin
  ON information_extraction USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_information_extraction_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER information_extraction_timestamp_trigger
BEFORE UPDATE ON information_extraction
FOR EACH ROW
EXECUTE FUNCTION update_information_extraction_timestamp();

COMMIT;