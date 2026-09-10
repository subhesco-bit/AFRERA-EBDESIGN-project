-- Migration: Create market_research table
-- Description: Market Research
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS market_research (
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
  CONSTRAINT market_research_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_market_research_user_id
  ON market_research(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_market_research_status
  ON market_research(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_market_research_created_at
  ON market_research(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_market_research_updated_at
  ON market_research(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_market_research_data_gin
  ON market_research USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_market_research_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER market_research_timestamp_trigger
BEFORE UPDATE ON market_research
FOR EACH ROW
EXECUTE FUNCTION update_market_research_timestamp();

COMMIT;