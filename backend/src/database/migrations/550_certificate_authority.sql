-- Migration: Create certificate_authority table
-- Description: Certificate Authority
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS certificate_authority (
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
  CONSTRAINT certificate_authority_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_certificate_authority_user_id
  ON certificate_authority(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_certificate_authority_status
  ON certificate_authority(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_certificate_authority_created_at
  ON certificate_authority(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_certificate_authority_updated_at
  ON certificate_authority(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_certificate_authority_data_gin
  ON certificate_authority USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_certificate_authority_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER certificate_authority_timestamp_trigger
BEFORE UPDATE ON certificate_authority
FOR EACH ROW
EXECUTE FUNCTION update_certificate_authority_timestamp();

COMMIT;