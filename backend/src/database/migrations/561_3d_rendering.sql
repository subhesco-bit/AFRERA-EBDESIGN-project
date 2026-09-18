-- Migration: Create rendering_3d table
-- Description: 3D Rendering Engine
-- Created: $(date)
--
-- 2026-09-16: table (and every index/trigger/constraint/function name
-- below) was originally `3d_rendering` - an unquoted SQL identifier
-- can't start with a digit, so `CREATE TABLE IF NOT EXISTS 3d_rendering`
-- is a syntax error on real Postgres (parsed as the numeric literal `3`
-- followed by a bare `d_rendering`). This migration would have failed
-- and blocked every migration after it the first time `npm run migrate`
-- actually ran. Renamed throughout instead of quoting every identifier.

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS rendering_3d (
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
  CONSTRAINT rendering_3d_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_rendering_3d_user_id
  ON rendering_3d(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_rendering_3d_status
  ON rendering_3d(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_rendering_3d_created_at
  ON rendering_3d(created_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_rendering_3d_updated_at
  ON rendering_3d(updated_at) WHERE deleted_at IS NULL;

-- Index for JSONB data searches
CREATE INDEX IF NOT EXISTS idx_rendering_3d_data_gin
  ON rendering_3d USING gin(data) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_rendering_3d_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rendering_3d_timestamp_trigger
BEFORE UPDATE ON rendering_3d
FOR EACH ROW
EXECUTE FUNCTION update_rendering_3d_timestamp();

COMMIT;
