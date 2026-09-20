-- Migration: Create weather table
-- Description: Weather Advisory
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS weather (
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
  CONSTRAINT weather_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_weather_user_id
  ON weather(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_weather_status
  ON weather(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_weather_created_at
  ON weather(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_weather_updated_at
  ON weather(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_weather_data_gin
  ON weather USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_weather_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER weather_timestamp_trigger
BEFORE UPDATE ON weather
FOR EACH ROW
EXECUTE FUNCTION update_weather_timestamp();

COMMIT;