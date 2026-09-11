-- Migration: Create anova table
-- Description: ANOVA Analysis
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS anova (
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
  CONSTRAINT anova_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_anova_user_id
  ON anova(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_anova_status
  ON anova(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_anova_created_at
  ON anova(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_anova_updated_at
  ON anova(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_anova_data_gin
  ON anova USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_anova_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER anova_timestamp_trigger
BEFORE UPDATE ON anova
FOR EACH ROW
EXECUTE FUNCTION update_anova_timestamp();

COMMIT;