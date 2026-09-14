-- Migration: Create regulatory_reporting table
-- Description: Regulatory Reporting
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS regulatory_reporting (
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
  CONSTRAINT regulatory_reporting_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_regulatory_reporting_user_id
  ON regulatory_reporting(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_regulatory_reporting_status
  ON regulatory_reporting(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_regulatory_reporting_created_at
  ON regulatory_reporting(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_regulatory_reporting_updated_at
  ON regulatory_reporting(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_regulatory_reporting_data_gin
  ON regulatory_reporting USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_regulatory_reporting_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER regulatory_reporting_timestamp_trigger
BEFORE UPDATE ON regulatory_reporting
FOR EACH ROW
EXECUTE FUNCTION update_regulatory_reporting_timestamp();

COMMIT;