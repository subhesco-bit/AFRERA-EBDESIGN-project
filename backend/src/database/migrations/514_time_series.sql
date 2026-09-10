-- Migration: Create time_series table
-- Description: Time Series Forecasting
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS time_series (
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
  CONSTRAINT time_series_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_time_series_user_id
  ON time_series(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_time_series_status
  ON time_series(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_time_series_created_at
  ON time_series(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_time_series_updated_at
  ON time_series(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_time_series_data_gin
  ON time_series USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_time_series_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER time_series_timestamp_trigger
BEFORE UPDATE ON time_series
FOR EACH ROW
EXECUTE FUNCTION update_time_series_timestamp();

COMMIT;