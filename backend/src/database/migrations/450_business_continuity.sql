-- Migration: Create business_continuity table
-- Description: Business Continuity
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS business_continuity (
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
  CONSTRAINT business_continuity_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_business_continuity_user_id
  ON business_continuity(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_business_continuity_status
  ON business_continuity(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_business_continuity_created_at
  ON business_continuity(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_business_continuity_updated_at
  ON business_continuity(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_business_continuity_data_gin
  ON business_continuity USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_business_continuity_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER business_continuity_timestamp_trigger
BEFORE UPDATE ON business_continuity
FOR EACH ROW
EXECUTE FUNCTION update_business_continuity_timestamp();

COMMIT;