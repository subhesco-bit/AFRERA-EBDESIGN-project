-- Migration: Create load_balancing table
-- Description: Load Balancing
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS load_balancing (
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
  CONSTRAINT load_balancing_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='load_balancing' AND column_name='user_id') AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='load_balancing' AND column_name='deleted_at') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_load_balancing_user_id ON load_balancing(user_id) WHERE deleted_at IS NULL';
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='load_balancing' AND column_name='user_id') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_load_balancing_user_id ON load_balancing(user_id)';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='load_balancing' AND column_name='status') AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='load_balancing' AND column_name='deleted_at') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_load_balancing_status ON load_balancing(status) WHERE deleted_at IS NULL';
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='load_balancing' AND column_name='status') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_load_balancing_status ON load_balancing(status)';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='load_balancing' AND column_name='created_at') AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='load_balancing' AND column_name='deleted_at') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_load_balancing_created_at ON load_balancing(created_at) WHERE deleted_at IS NULL';
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='load_balancing' AND column_name='created_at') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_load_balancing_created_at ON load_balancing(created_at)';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='load_balancing' AND column_name='updated_at') AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='load_balancing' AND column_name='deleted_at') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_load_balancing_updated_at ON load_balancing(updated_at) WHERE deleted_at IS NULL';
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='load_balancing' AND column_name='updated_at') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_load_balancing_updated_at ON load_balancing(updated_at)';
  END IF;
END $$;

-- Index for JSONB data searches
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='load_balancing' AND column_name='data') AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='load_balancing' AND column_name='deleted_at') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_load_balancing_data_gin ON load_balancing USING gin(data) WHERE deleted_at IS NULL';
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='load_balancing' AND column_name='data') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_load_balancing_data_gin ON load_balancing USING gin(data)';
  END IF;
END $$;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_load_balancing_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS load_balancing_timestamp_trigger ON load_balancing;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='load_balancing' AND column_name='updated_at') THEN
    EXECUTE 'CREATE TRIGGER load_balancing_timestamp_trigger BEFORE UPDATE ON load_balancing FOR EACH ROW EXECUTE FUNCTION update_load_balancing_timestamp()';
  END IF;
END $$;

COMMIT;