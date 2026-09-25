-- Migration: Create ddos_protection table
-- Description: DDoS Protection
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS ddos_protection (
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
  CONSTRAINT ddos_protection_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for common queries
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ddos_protection' AND column_name='user_id') AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ddos_protection' AND column_name='deleted_at') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_ddos_protection_user_id ON ddos_protection(user_id) WHERE deleted_at IS NULL';
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ddos_protection' AND column_name='user_id') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_ddos_protection_user_id ON ddos_protection(user_id)';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ddos_protection' AND column_name='status') AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ddos_protection' AND column_name='deleted_at') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_ddos_protection_status ON ddos_protection(status) WHERE deleted_at IS NULL';
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ddos_protection' AND column_name='status') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_ddos_protection_status ON ddos_protection(status)';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ddos_protection' AND column_name='created_at') AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ddos_protection' AND column_name='deleted_at') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_ddos_protection_created_at ON ddos_protection(created_at) WHERE deleted_at IS NULL';
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ddos_protection' AND column_name='created_at') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_ddos_protection_created_at ON ddos_protection(created_at)';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ddos_protection' AND column_name='updated_at') AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ddos_protection' AND column_name='deleted_at') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_ddos_protection_updated_at ON ddos_protection(updated_at) WHERE deleted_at IS NULL';
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ddos_protection' AND column_name='updated_at') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_ddos_protection_updated_at ON ddos_protection(updated_at)';
  END IF;
END $$;

-- Index for JSONB data searches
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ddos_protection' AND column_name='data') AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ddos_protection' AND column_name='deleted_at') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_ddos_protection_data_gin ON ddos_protection USING gin(data) WHERE deleted_at IS NULL';
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ddos_protection' AND column_name='data') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_ddos_protection_data_gin ON ddos_protection USING gin(data)';
  END IF;
END $$;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_ddos_protection_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ddos_protection_timestamp_trigger ON ddos_protection;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ddos_protection' AND column_name='updated_at') THEN
    EXECUTE 'CREATE TRIGGER ddos_protection_timestamp_trigger BEFORE UPDATE ON ddos_protection FOR EACH ROW EXECUTE FUNCTION update_ddos_protection_timestamp()';
  END IF;
END $$;

COMMIT;