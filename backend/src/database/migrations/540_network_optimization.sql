-- Migration: Create network_optimization table
-- Description: Network Optimization
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS network_optimization (
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
  CONSTRAINT network_optimization_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='network_optimization' AND column_name='user_id') AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='network_optimization' AND column_name='deleted_at') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_network_optimization_user_id ON network_optimization(user_id) WHERE deleted_at IS NULL';
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='network_optimization' AND column_name='user_id') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_network_optimization_user_id ON network_optimization(user_id)';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='network_optimization' AND column_name='status') AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='network_optimization' AND column_name='deleted_at') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_network_optimization_status ON network_optimization(status) WHERE deleted_at IS NULL';
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='network_optimization' AND column_name='status') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_network_optimization_status ON network_optimization(status)';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='network_optimization' AND column_name='created_at') AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='network_optimization' AND column_name='deleted_at') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_network_optimization_created_at ON network_optimization(created_at) WHERE deleted_at IS NULL';
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='network_optimization' AND column_name='created_at') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_network_optimization_created_at ON network_optimization(created_at)';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='network_optimization' AND column_name='updated_at') AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='network_optimization' AND column_name='deleted_at') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_network_optimization_updated_at ON network_optimization(updated_at) WHERE deleted_at IS NULL';
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='network_optimization' AND column_name='updated_at') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_network_optimization_updated_at ON network_optimization(updated_at)';
  END IF;
END $$;

-- Index for JSONB data searches
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='network_optimization' AND column_name='data') AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='network_optimization' AND column_name='deleted_at') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_network_optimization_data_gin ON network_optimization USING gin(data) WHERE deleted_at IS NULL';
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='network_optimization' AND column_name='data') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_network_optimization_data_gin ON network_optimization USING gin(data)';
  END IF;
END $$;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_network_optimization_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS network_optimization_timestamp_trigger ON network_optimization;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='network_optimization' AND column_name='updated_at') THEN
    EXECUTE 'CREATE TRIGGER network_optimization_timestamp_trigger BEFORE UPDATE ON network_optimization FOR EACH ROW EXECUTE FUNCTION update_network_optimization_timestamp()';
  END IF;
END $$;

COMMIT;