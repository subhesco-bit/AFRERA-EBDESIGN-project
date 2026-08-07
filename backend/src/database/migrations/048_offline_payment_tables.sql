-- FK TYPE FIX 2026-08-04: 7 column(s) in this file declared INTEGER while
-- referencing a UUID primary key. PostgreSQL rejects the whole CREATE TABLE
-- ("foreign key constraint cannot be implemented"), so these tables were
-- never created at all — along with every index and trigger that followed.
-- Changed to UUID to match 000_base_schema, which is canonical.

-- Offline Payment Tables Migration
-- for AFRERA Platform Offline Payment Service

-- Offline payment requests table
CREATE TABLE IF NOT EXISTS offline_payment_requests (
  id SERIAL PRIMARY KEY,
  payment_code VARCHAR(100) UNIQUE NOT NULL,
  merchant_id INTEGER NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  reference VARCHAR(100),
  payment_data TEXT NOT NULL,
  signature VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes moved out of the CREATE TABLE body (2026-08-04).
-- "INDEX name (col)" inside CREATE TABLE is MySQL syntax; PostgreSQL parses
-- it as a column literally named "index" of type "name", then fails at
-- execution with: type "idx_offline_payment_code" does not exist.
CREATE INDEX IF NOT EXISTS idx_offline_payment_code ON offline_payment_requests (payment_code);
CREATE INDEX IF NOT EXISTS idx_offline_merchant ON offline_payment_requests (merchant_id);
CREATE INDEX IF NOT EXISTS idx_offline_status ON offline_payment_requests (status);
CREATE INDEX IF NOT EXISTS idx_offline_expires ON offline_payment_requests (expires_at);

-- Offline transactions table
CREATE TABLE IF NOT EXISTS offline_transactions (
  id SERIAL PRIMARY KEY,
  transaction_id VARCHAR(100) UNIQUE NOT NULL,
  payment_request_id INTEGER REFERENCES offline_payment_requests(id),
  payer_id UUID NOT NULL REFERENCES users(id),
  merchant_id INTEGER NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  pin_verified BOOLEAN DEFAULT FALSE,
  biometric_data JSONB,
  status VARCHAR(20) DEFAULT 'pending',
  sync_status VARCHAR(20) DEFAULT 'pending',
  synced_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes moved out of the CREATE TABLE body (2026-08-04).
-- "INDEX name (col)" inside CREATE TABLE is MySQL syntax; PostgreSQL parses
-- it as a column literally named "index" of type "name", then fails at
-- execution with: type "idx_offline_tx_id" does not exist.
CREATE INDEX IF NOT EXISTS idx_offline_tx_id ON offline_transactions (transaction_id);
CREATE INDEX IF NOT EXISTS idx_offline_tx_payer ON offline_transactions (payer_id);
CREATE INDEX IF NOT EXISTS idx_offline_tx_merchant ON offline_transactions (merchant_id);
CREATE INDEX IF NOT EXISTS idx_offline_tx_status ON offline_transactions (status);
CREATE INDEX IF NOT EXISTS idx_offline_tx_sync ON offline_transactions (sync_status);

-- Offline sync queue table
CREATE TABLE IF NOT EXISTS offline_sync_queue (
  id SERIAL PRIMARY KEY,
  transaction_id VARCHAR(100) UNIQUE NOT NULL,
  transaction_type VARCHAR(50) NOT NULL,
  sync_status VARCHAR(20) DEFAULT 'pending',
  retry_count INTEGER DEFAULT 0,
  last_sync_attempt TIMESTAMP,
  synced_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes moved out of the CREATE TABLE body (2026-08-04).
-- "INDEX name (col)" inside CREATE TABLE is MySQL syntax; PostgreSQL parses
-- it as a column literally named "index" of type "name", then fails at
-- execution with: type "idx_sync_queue_tx" does not exist.
CREATE INDEX IF NOT EXISTS idx_sync_queue_tx ON offline_sync_queue (transaction_id);
CREATE INDEX IF NOT EXISTS idx_offline_sync_queue_status ON offline_sync_queue (sync_status);
CREATE INDEX IF NOT EXISTS idx_offline_sync_queue_type ON offline_sync_queue (transaction_type);
CREATE INDEX IF NOT EXISTS idx_sync_queue_created ON offline_sync_queue (created_at);

-- USSD payment requests table
CREATE TABLE IF NOT EXISTS ussd_payment_requests (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  merchant_id INTEGER NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  ussd_code VARCHAR(50) UNIQUE NOT NULL,
  reference VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending',
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes moved out of the CREATE TABLE body (2026-08-04).
-- "INDEX name (col)" inside CREATE TABLE is MySQL syntax; PostgreSQL parses
-- it as a column literally named "index" of type "name", then fails at
-- execution with: type "idx_ussd_user" does not exist.
CREATE INDEX IF NOT EXISTS idx_ussd_user ON ussd_payment_requests (user_id);
CREATE INDEX IF NOT EXISTS idx_ussd_merchant ON ussd_payment_requests (merchant_id);
CREATE INDEX IF NOT EXISTS idx_ussd_code ON ussd_payment_requests (ussd_code);
CREATE INDEX IF NOT EXISTS idx_ussd_status ON ussd_payment_requests (status);

-- User payment settings table
CREATE TABLE IF NOT EXISTS user_payment_settings (
  id SERIAL PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL REFERENCES users(id),
  pin_hash VARCHAR(255) NOT NULL,
  biometric_enabled BOOLEAN DEFAULT FALSE,
  biometric_data JSONB,
  daily_limit DECIMAL(10,2) DEFAULT 50000,
  transaction_limit DECIMAL(10,2) DEFAULT 10000,
  security_questions JSONB DEFAULT '[]',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes moved out of the CREATE TABLE body (2026-08-04).
-- "INDEX name (col)" inside CREATE TABLE is MySQL syntax; PostgreSQL parses
-- it as a column literally named "index" of type "name", then fails at
-- execution with: type "idx_payment_settings_user" does not exist.
CREATE INDEX IF NOT EXISTS idx_payment_settings_user ON user_payment_settings (user_id);

-- User wallets table
CREATE TABLE IF NOT EXISTS user_wallets (
  id SERIAL PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL REFERENCES users(id),
  balance DECIMAL(10,2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'INR',
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes moved out of the CREATE TABLE body (2026-08-04).
-- "INDEX name (col)" inside CREATE TABLE is MySQL syntax; PostgreSQL parses
-- it as a column literally named "index" of type "name", then fails at
-- execution with: type "idx_wallets_user" does not exist.
CREATE INDEX IF NOT EXISTS idx_wallets_user ON user_wallets (user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_status ON user_wallets (status);

-- Transactions table (if not exists)
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  transaction_id VARCHAR(100) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id),
  type VARCHAR(50) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  reference VARCHAR(100),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes moved out of the CREATE TABLE body (2026-08-04).
-- "INDEX name (col)" inside CREATE TABLE is MySQL syntax; PostgreSQL parses
-- it as a column literally named "index" of type "name", then fails at
-- execution with: type "idx_transactions_id" does not exist.
CREATE INDEX IF NOT EXISTS idx_transactions_id ON transactions (transaction_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions (type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions (status);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions (created_at);

-- NFC payment cards table (for future use)
CREATE TABLE IF NOT EXISTS nfc_payment_cards (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  card_id VARCHAR(100) UNIQUE NOT NULL,
  card_token VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  daily_limit DECIMAL(10,2) DEFAULT 10000,
  last_used_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes moved out of the CREATE TABLE body (2026-08-04).
-- "INDEX name (col)" inside CREATE TABLE is MySQL syntax; PostgreSQL parses
-- it as a column literally named "index" of type "name", then fails at
-- execution with: type "idx_nfc_user" does not exist.
CREATE INDEX IF NOT EXISTS idx_nfc_user ON nfc_payment_cards (user_id);
CREATE INDEX IF NOT EXISTS idx_nfc_card ON nfc_payment_cards (card_id);
CREATE INDEX IF NOT EXISTS idx_nfc_active ON nfc_payment_cards (is_active);

-- Offline payment analytics table
CREATE TABLE IF NOT EXISTS offline_payment_analytics (
  id SERIAL PRIMARY KEY,
  transaction_id VARCHAR(100) REFERENCES offline_transactions(transaction_id),
  user_id UUID REFERENCES users(id),
  merchant_id INTEGER,
  payment_method VARCHAR(20) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  processing_time_ms INTEGER,
  sync_delay_minutes INTEGER,
  location_lat DECIMAL(10,6),
  location_long DECIMAL(10,6),
  device_info JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes moved out of the CREATE TABLE body (2026-08-04).
-- "INDEX name (col)" inside CREATE TABLE is MySQL syntax; PostgreSQL parses
-- it as a column literally named "index" of type "name", then fails at
-- execution with: type "idx_offline_analytics_user" does not exist.
CREATE INDEX IF NOT EXISTS idx_offline_analytics_user ON offline_payment_analytics (user_id);
CREATE INDEX IF NOT EXISTS idx_offline_analytics_method ON offline_payment_analytics (payment_method);
CREATE INDEX IF NOT EXISTS idx_offline_analytics_created ON offline_payment_analytics (created_at);

-- Add payment preferences to user profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS payment_method_preference VARCHAR(20) DEFAULT 'qr',
ADD COLUMN IF NOT EXISTS auto_sync_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS offline_payment_enabled BOOLEAN DEFAULT TRUE;