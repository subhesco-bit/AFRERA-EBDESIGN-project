-- Migration: Create contracts table
-- Description: Contract Management
-- Created: $(date)

BEGIN;

-- Create main table
CREATE TABLE IF NOT EXISTS contracts (
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
  CONSTRAINT contracts_user_fk FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Reconcile with whichever contracts schema already owns this table.
-- The canonical rural/commercial schema is richer and does not carry the
-- generic user_id/data/deleted_at columns from this compatibility migration.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='contracts' AND column_name='user_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='contracts' AND column_name='deleted_at') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_contracts_user_id ON contracts(user_id) WHERE deleted_at IS NULL';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='contracts' AND column_name='farmer_id') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_contracts_farmer_status ON contracts(farmer_id, status)';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='contracts' AND column_name='buyer_id') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_contracts_buyer_status ON contracts(buyer_id, status)';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='contracts' AND column_name='crop_id') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_contracts_crop_status ON contracts(crop_id, status)';
  END IF;

  EXECUTE 'CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status)';
  EXECUTE 'CREATE INDEX IF NOT EXISTS idx_contracts_created_at ON contracts(created_at)';
  EXECUTE 'CREATE INDEX IF NOT EXISTS idx_contracts_updated_at ON contracts(updated_at)';

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='contracts' AND column_name='data') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_contracts_data_gin ON contracts USING gin(data)';
  END IF;
END $$;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_contracts_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS contracts_timestamp_trigger ON contracts;
CREATE TRIGGER contracts_timestamp_trigger
BEFORE UPDATE ON contracts
FOR EACH ROW
EXECUTE FUNCTION update_contracts_timestamp();

COMMIT;