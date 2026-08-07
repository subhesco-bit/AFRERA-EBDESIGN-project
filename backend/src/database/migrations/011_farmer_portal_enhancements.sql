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
