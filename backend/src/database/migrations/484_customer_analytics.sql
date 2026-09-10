-- Migration: Create customer_analytics table
-- Description: Customer Analytics
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS customer_analytics (
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
  CONSTRAINT customer_analytics_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_customer_analytics_user_id
  ON customer_analytics(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_customer_analytics_status
  ON customer_analytics(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_customer_analytics_created_at
  ON customer_analytics(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_customer_analytics_updated_at
  ON customer_analytics(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_customer_analytics_data_gin
  ON customer_analytics USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_customer_analytics_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER customer_analytics_timestamp_trigger
BEFORE UPDATE ON customer_analytics
FOR EACH ROW
EXECUTE FUNCTION update_customer_analytics_timestamp();

COMMIT;