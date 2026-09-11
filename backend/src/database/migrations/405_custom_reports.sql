-- Migration: Create custom_reports table
-- Description: Custom Reports
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS custom_reports (
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
  CONSTRAINT custom_reports_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_custom_reports_user_id
  ON custom_reports(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_custom_reports_status
  ON custom_reports(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_custom_reports_created_at
  ON custom_reports(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_custom_reports_updated_at
  ON custom_reports(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_custom_reports_data_gin
  ON custom_reports USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_custom_reports_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER custom_reports_timestamp_trigger
BEFORE UPDATE ON custom_reports
FOR EACH ROW
EXECUTE FUNCTION update_custom_reports_timestamp();

COMMIT;