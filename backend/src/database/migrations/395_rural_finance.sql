-- Migration: Update rural_finance table
-- Description: Rural Finance - Add missing columns and indexes for existing table
-- Created: $(date)

BEGIN;

-- Add missing columns if they don't exist
DO $$
BEGIN
    -- Add deleted_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rural_finance' AND column_name = 'deleted_at'
    ) THEN
        ALTER TABLE rural_finance ADD COLUMN deleted_at TIMESTAMP;
    END IF;
END $$;

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_rural_finance_reu_id
  ON rural_finance(reu_id);

CREATE INDEX IF NOT EXISTS idx_rural_finance_enterprise_id
  ON rural_finance(enterprise_id);

CREATE INDEX IF NOT EXISTS idx_rural_finance_energy_system_id
  ON rural_finance(energy_system_id);

CREATE INDEX IF NOT EXISTS idx_rural_finance_lender_id
  ON rural_finance(lender_id);

-- Note: Table already exists with proper structure and indexes
-- This migration only ensures all required columns are present

COMMIT;