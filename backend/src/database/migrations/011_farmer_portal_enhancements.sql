-- ---------------------------------------------------------------------------
-- RECONCILIATION NOTE (added 2026-09-23)
--
-- One or more table names in this file are also defined by another migration
-- with a different column set. `CREATE TABLE IF NOT EXISTS` then does NOTHING
-- on a clean run, and this file's later INSERT / CREATE INDEX statements failed
-- on columns that were never added. Verified on a clean PostgreSQL 16 run of
-- the full migration set.
--
-- Per the project rule, a collision is reconciled and not resolved by dropping
-- one side. Each CREATE TABLE below is followed by ADD COLUMN IF NOT EXISTS for
-- its own columns: a no-op where this file really created the table, and the
-- missing columns where it did not.
--
-- NOT NULL, PRIMARY KEY, UNIQUE and REFERENCES are deliberately not carried
-- over -- the table may already hold rows from the other definition that cannot
-- satisfy them, and a referenced column's type often differs from what this
-- file declares. Where that hides a real type mismatch, it is a reconciliation
-- still owed, not a fix.
-- ---------------------------------------------------------------------------

-- FK TYPE FIX 2026-08-04: 6 column(s) in this file declared INTEGER while
-- referencing a UUID primary key. PostgreSQL rejects the whole CREATE TABLE
-- ("foreign key constraint cannot be implemented"), so these tables were
-- never created at all — along with every index and trigger that followed.
-- Changed to UUID to match 000_base_schema, which is canonical.

-- Farmer Portal Enhancements Migration
-- Land Records, Crop Planning, and Wallet functionality

-- Land Records Table
CREATE TABLE IF NOT EXISTS land_records (
  id SERIAL PRIMARY KEY,
  farmer_id UUID NOT NULL REFERENCES farmers(id),
  survey_number VARCHAR(100) NOT NULL,
  village VARCHAR(255) NOT NULL,
  district VARCHAR(255) NOT NULL,
  state VARCHAR(255) NOT NULL,
  area_in_hectares DECIMAL(10, 2) NOT NULL,
  area_in_acres DECIMAL(10, 2) NOT NULL,
  soil_type VARCHAR(50),
  irrigation_type VARCHAR(50),
  ownership_type VARCHAR(50),
  land_use_type VARCHAR(50),
  khasra_number VARCHAR(100),
  boundary_details JSONB,
  gps_coordinates JSONB,
  documents JSONB DEFAULT '[]',
  verification_status VARCHAR(50) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMP,
  government_reference VARCHAR(100),
  verification_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE land_records ADD COLUMN IF NOT EXISTS id INTEGER;
ALTER TABLE land_records ADD COLUMN IF NOT EXISTS farmer_id UUID;
ALTER TABLE land_records ADD COLUMN IF NOT EXISTS survey_number VARCHAR(100);
ALTER TABLE land_records ADD COLUMN IF NOT EXISTS village VARCHAR(255);
ALTER TABLE land_records ADD COLUMN IF NOT EXISTS district VARCHAR(255);
ALTER TABLE land_records ADD COLUMN IF NOT EXISTS state VARCHAR(255);
ALTER TABLE land_records ADD COLUMN IF NOT EXISTS area_in_hectares DECIMAL(10, 2);
ALTER TABLE land_records ADD COLUMN IF NOT EXISTS area_in_acres DECIMAL(10, 2);
ALTER TABLE land_records ADD COLUMN IF NOT EXISTS soil_type VARCHAR(50);
ALTER TABLE land_records ADD COLUMN IF NOT EXISTS irrigation_type VARCHAR(50);
ALTER TABLE land_records ADD COLUMN IF NOT EXISTS ownership_type VARCHAR(50);
ALTER TABLE land_records ADD COLUMN IF NOT EXISTS land_use_type VARCHAR(50);
ALTER TABLE land_records ADD COLUMN IF NOT EXISTS khasra_number VARCHAR(100);
ALTER TABLE land_records ADD COLUMN IF NOT EXISTS boundary_details JSONB;
ALTER TABLE land_records ADD COLUMN IF NOT EXISTS gps_coordinates JSONB;
ALTER TABLE land_records ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '[]';
ALTER TABLE land_records ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected'));
ALTER TABLE land_records ADD COLUMN IF NOT EXISTS verified_by UUID;
ALTER TABLE land_records ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP;
ALTER TABLE land_records ADD COLUMN IF NOT EXISTS government_reference VARCHAR(100);
ALTER TABLE land_records ADD COLUMN IF NOT EXISTS verification_notes TEXT;
ALTER TABLE land_records ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE land_records ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


CREATE INDEX IF NOT EXISTS idx_land_records_farmer_id ON land_records(farmer_id);
CREATE INDEX IF NOT EXISTS idx_land_records_district ON land_records(district);
CREATE INDEX IF NOT EXISTS idx_land_records_state ON land_records(state);
CREATE INDEX IF NOT EXISTS idx_land_records_verification_status ON land_records(verification_status);
CREATE INDEX IF NOT EXISTS idx_land_records_khasra_number ON land_records(khasra_number);

-- Crop Plans Table
CREATE TABLE IF NOT EXISTS crop_plans (
  id SERIAL PRIMARY KEY,
  farmer_id UUID NOT NULL REFERENCES farmers(id),
  land_record_id INTEGER NOT NULL REFERENCES land_records(id),
  crop_type VARCHAR(100) NOT NULL,
  variety VARCHAR(100),
  season VARCHAR(50) NOT NULL,
  planting_date DATE NOT NULL,
  expected_harvest_date DATE,
  actual_yield DECIMAL(10, 2),
  estimated_yield DECIMAL(10, 2),
  seed_source VARCHAR(255),
  fertilizer_plan JSONB,
  irrigation_schedule JSONB,
  market_strategy JSONB,
  resource_requirements JSONB,
  harvest_date DATE,
  notes TEXT,
  status VARCHAR(50) DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'failed')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE crop_plans ADD COLUMN IF NOT EXISTS id INTEGER;
ALTER TABLE crop_plans ADD COLUMN IF NOT EXISTS farmer_id UUID;
ALTER TABLE crop_plans ADD COLUMN IF NOT EXISTS land_record_id INTEGER;
ALTER TABLE crop_plans ADD COLUMN IF NOT EXISTS crop_type VARCHAR(100);
ALTER TABLE crop_plans ADD COLUMN IF NOT EXISTS variety VARCHAR(100);
ALTER TABLE crop_plans ADD COLUMN IF NOT EXISTS season VARCHAR(50);
ALTER TABLE crop_plans ADD COLUMN IF NOT EXISTS planting_date DATE;
ALTER TABLE crop_plans ADD COLUMN IF NOT EXISTS expected_harvest_date DATE;
ALTER TABLE crop_plans ADD COLUMN IF NOT EXISTS actual_yield DECIMAL(10, 2);
ALTER TABLE crop_plans ADD COLUMN IF NOT EXISTS estimated_yield DECIMAL(10, 2);
ALTER TABLE crop_plans ADD COLUMN IF NOT EXISTS seed_source VARCHAR(255);
ALTER TABLE crop_plans ADD COLUMN IF NOT EXISTS fertilizer_plan JSONB;
ALTER TABLE crop_plans ADD COLUMN IF NOT EXISTS irrigation_schedule JSONB;
ALTER TABLE crop_plans ADD COLUMN IF NOT EXISTS market_strategy JSONB;
ALTER TABLE crop_plans ADD COLUMN IF NOT EXISTS resource_requirements JSONB;
ALTER TABLE crop_plans ADD COLUMN IF NOT EXISTS harvest_date DATE;
ALTER TABLE crop_plans ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE crop_plans ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'failed'));
ALTER TABLE crop_plans ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE crop_plans ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


CREATE INDEX IF NOT EXISTS idx_crop_plans_farmer_id ON crop_plans(farmer_id);
CREATE INDEX IF NOT EXISTS idx_crop_plans_land_record_id ON crop_plans(land_record_id);
CREATE INDEX IF NOT EXISTS idx_crop_plans_season ON crop_plans(season);
CREATE INDEX IF NOT EXISTS idx_crop_plans_status ON crop_plans(status);
CREATE INDEX IF NOT EXISTS idx_crop_plans_crop_type ON crop_plans(crop_type);

-- Wallet Table
CREATE TABLE IF NOT EXISTS farmer_wallets (
  id SERIAL PRIMARY KEY,
  farmer_id UUID NOT NULL UNIQUE REFERENCES farmers(id),
  balance DECIMAL(12, 2) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'INR',
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'frozen', 'closed')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE farmer_wallets ADD COLUMN IF NOT EXISTS id INTEGER;
ALTER TABLE farmer_wallets ADD COLUMN IF NOT EXISTS farmer_id UUID;
ALTER TABLE farmer_wallets ADD COLUMN IF NOT EXISTS balance DECIMAL(12, 2) DEFAULT 0;
ALTER TABLE farmer_wallets ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'INR';
ALTER TABLE farmer_wallets ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'frozen', 'closed'));
ALTER TABLE farmer_wallets ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE farmer_wallets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


CREATE INDEX IF NOT EXISTS idx_farmer_wallets_farmer_id ON farmer_wallets(farmer_id);

-- Wallet Transactions Table
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id SERIAL PRIMARY KEY,
  wallet_id INTEGER NOT NULL REFERENCES farmer_wallets(id),
  type VARCHAR(50) NOT NULL CHECK (type IN ('credit', 'debit', 'transfer')),
  amount DECIMAL(12, 2) NOT NULL,
  balance_after DECIMAL(12, 2) NOT NULL,
  description TEXT,
  reference_id VARCHAR(100),
  reference_type VARCHAR(50),
  payment_method VARCHAR(50),
  bank_account VARCHAR(50),
  ifsc_code VARCHAR(20),
  recipient_id UUID REFERENCES farmers(id),
  status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'reversed')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS id INTEGER;
ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS wallet_id INTEGER;
ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS type VARCHAR(50) CHECK (type IN ('credit', 'debit', 'transfer'));
ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS amount DECIMAL(12, 2);
ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS balance_after DECIMAL(12, 2);
ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS reference_id VARCHAR(100);
ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS reference_type VARCHAR(50);
ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS bank_account VARCHAR(50);
ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS ifsc_code VARCHAR(20);
ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS recipient_id UUID;
ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'reversed'));
ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_id ON wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type ON wallet_transactions(type);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_status ON wallet_transactions(status);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON wallet_transactions(created_at);

-- Bank Accounts Table
CREATE TABLE IF NOT EXISTS farmer_bank_accounts (
  id SERIAL PRIMARY KEY,
  farmer_id UUID NOT NULL REFERENCES farmers(id),
  bank_name VARCHAR(255) NOT NULL,
  account_number VARCHAR(50) NOT NULL,
  ifsc_code VARCHAR(20) NOT NULL,
  account_holder VARCHAR(255) NOT NULL,
  account_type VARCHAR(50),
  is_primary BOOLEAN DEFAULT false,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(farmer_id, account_number)
);

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE farmer_bank_accounts ADD COLUMN IF NOT EXISTS id INTEGER;
ALTER TABLE farmer_bank_accounts ADD COLUMN IF NOT EXISTS farmer_id UUID;
ALTER TABLE farmer_bank_accounts ADD COLUMN IF NOT EXISTS bank_name VARCHAR(255);
ALTER TABLE farmer_bank_accounts ADD COLUMN IF NOT EXISTS account_number VARCHAR(50);
ALTER TABLE farmer_bank_accounts ADD COLUMN IF NOT EXISTS ifsc_code VARCHAR(20);
ALTER TABLE farmer_bank_accounts ADD COLUMN IF NOT EXISTS account_holder VARCHAR(255);
ALTER TABLE farmer_bank_accounts ADD COLUMN IF NOT EXISTS account_type VARCHAR(50);
ALTER TABLE farmer_bank_accounts ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false;
ALTER TABLE farmer_bank_accounts ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;
ALTER TABLE farmer_bank_accounts ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE farmer_bank_accounts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


CREATE INDEX IF NOT EXISTS idx_farmer_bank_accounts_farmer_id ON farmer_bank_accounts(farmer_id);
CREATE INDEX IF NOT EXISTS idx_farmer_bank_accounts_ifsc_code ON farmer_bank_accounts(ifsc_code);

-- Audit triggers
DROP TRIGGER IF EXISTS update_land_records_updated_at ON land_records;
CREATE TRIGGER update_land_records_updated_at BEFORE UPDATE ON land_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_crop_plans_updated_at ON crop_plans;
CREATE TRIGGER update_crop_plans_updated_at BEFORE UPDATE ON crop_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_farmer_wallets_updated_at ON farmer_wallets;
CREATE TRIGGER update_farmer_wallets_updated_at BEFORE UPDATE ON farmer_wallets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_farmer_bank_accounts_updated_at ON farmer_bank_accounts;
CREATE TRIGGER update_farmer_bank_accounts_updated_at BEFORE UPDATE ON farmer_bank_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to update wallet balance on transaction
CREATE OR REPLACE FUNCTION update_wallet_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' THEN
    IF NEW.type = 'credit' THEN
      UPDATE farmer_wallets
      SET balance = balance + NEW.amount,
          updated_at = NOW()
      WHERE id = NEW.wallet_id;
    ELSIF NEW.type = 'debit' OR NEW.type = 'transfer' THEN
      UPDATE farmer_wallets
      SET balance = balance - NEW.amount,
          updated_at = NOW()
      WHERE id = NEW.wallet_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS wallet_transaction_balance_update ON wallet_transactions;
CREATE TRIGGER wallet_transaction_balance_update AFTER INSERT OR UPDATE ON wallet_transactions
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION update_wallet_balance();

-- Comments for documentation
COMMENT ON TABLE land_records IS 'Stores farmer land records with verification status';
COMMENT ON TABLE crop_plans IS 'Stores farmer crop planning and cultivation data';
COMMENT ON TABLE farmer_wallets IS 'Stores farmer wallet balances and status';
COMMENT ON TABLE wallet_transactions IS 'Stores all wallet transactions';
COMMENT ON TABLE farmer_bank_accounts IS 'Stores farmer bank account details for withdrawals';
