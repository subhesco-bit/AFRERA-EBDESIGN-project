-- Migration: Create experimental_design table
-- Description: Experimental Design
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS experimental_design (
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
  CONSTRAINT experimental_design_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_experimental_design_user_id
  ON experimental_design(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_experimental_design_status
  ON experimental_design(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_experimental_design_created_at
  ON experimental_design(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_experimental_design_updated_at
  ON experimental_design(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_experimental_design_data_gin
  ON experimental_design USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_experimental_design_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER experimental_design_timestamp_trigger
BEFORE UPDATE ON experimental_design
FOR EACH ROW
EXECUTE FUNCTION update_experimental_design_timestamp();

COMMIT;