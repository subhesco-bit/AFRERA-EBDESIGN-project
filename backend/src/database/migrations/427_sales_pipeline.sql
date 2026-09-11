-- Migration: Create sales_pipeline table
-- Description: Sales Pipeline Management
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS sales_pipeline (
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
  CONSTRAINT sales_pipeline_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_sales_pipeline_user_id
  ON sales_pipeline(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_sales_pipeline_status
  ON sales_pipeline(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_sales_pipeline_created_at
  ON sales_pipeline(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_sales_pipeline_updated_at
  ON sales_pipeline(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_sales_pipeline_data_gin
  ON sales_pipeline USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_sales_pipeline_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sales_pipeline_timestamp_trigger
BEFORE UPDATE ON sales_pipeline
FOR EACH ROW
EXECUTE FUNCTION update_sales_pipeline_timestamp();

COMMIT;