-- SMS Authentication Tables Migration
-- for AFRERA Platform SMS-based authentication system

-- SMS OTPs table
CREATE TABLE IF NOT EXISTS sms_otps (
  id SERIAL PRIMARY KEY,
  phone_number VARCHAR(20) NOT NULL,
  otp_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP,
  attempt_count INTEGER DEFAULT 0,
  language VARCHAR(10) DEFAULT 'en'
);

-- Indexes moved out of the CREATE TABLE body (2026-08-04).
-- "INDEX name (col)" inside CREATE TABLE is MySQL syntax; PostgreSQL parses
-- it as a column literally named "index" of type "name", then fails at
-- execution with: type "idx_sms_otps_phone" does not exist.
CREATE INDEX IF NOT EXISTS idx_sms_otps_phone ON sms_otps (phone_number);
CREATE INDEX IF NOT EXISTS idx_sms_otps_expires ON sms_otps (expires_at);
CREATE INDEX IF NOT EXISTS idx_sms_otps_verified ON sms_otps (verified);

-- Pending registrations table
CREATE TABLE IF NOT EXISTS pending_registrations (
  id SERIAL PRIMARY KEY,
  phone_number VARCHAR(20) NOT NULL UNIQUE,
  user_data JSONB NOT NULL,
  otp_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP,
  language VARCHAR(10) DEFAULT 'en'
);

-- Indexes moved out of the CREATE TABLE body (2026-08-04).
-- "INDEX name (col)" inside CREATE TABLE is MySQL syntax; PostgreSQL parses
-- it as a column literally named "index" of type "name", then fails at
-- execution with: type "idx_pending_registrations_phone" does not exist.
CREATE INDEX IF NOT EXISTS idx_pending_registrations_phone ON pending_registrations (phone_number);
CREATE INDEX IF NOT EXISTS idx_pending_registrations_expires ON pending_registrations (expires_at);

-- User profiles enhancement for SMS auth
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(10) DEFAULT 'en',
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMP;

-- Audit log for SMS authentication
CREATE TABLE IF NOT EXISTS sms_auth_audit_log (
  id SERIAL PRIMARY KEY,
  phone_number VARCHAR(20) NOT NULL,
  action VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes moved out of the CREATE TABLE body (2026-08-04).
-- "INDEX name (col)" inside CREATE TABLE is MySQL syntax; PostgreSQL parses
-- it as a column literally named "index" of type "name", then fails at
-- execution with: type "idx_sms_audit_phone" does not exist.
CREATE INDEX IF NOT EXISTS idx_sms_audit_phone ON sms_auth_audit_log (phone_number);
CREATE INDEX IF NOT EXISTS idx_sms_audit_action ON sms_auth_audit_log (action);
CREATE INDEX IF NOT EXISTS idx_sms_audit_created ON sms_auth_audit_log (created_at);

-- Voice call logs
CREATE TABLE IF NOT EXISTS voice_call_logs (
  id SERIAL PRIMARY KEY,
  phone_number VARCHAR(20) NOT NULL,
  call_sid VARCHAR(100),
  otp_sent VARCHAR(10),
  language VARCHAR(10),
  call_status VARCHAR(20),
  call_duration_seconds INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes moved out of the CREATE TABLE body (2026-08-04).
-- "INDEX name (col)" inside CREATE TABLE is MySQL syntax; PostgreSQL parses
-- it as a column literally named "index" of type "name", then fails at
-- execution with: type "idx_voice_logs_phone" does not exist.
CREATE INDEX IF NOT EXISTS idx_voice_logs_phone ON voice_call_logs (phone_number);
CREATE INDEX IF NOT EXISTS idx_voice_logs_status ON voice_call_logs (call_status);

-- SMS delivery logs
CREATE TABLE IF NOT EXISTS sms_delivery_logs (
  id SERIAL PRIMARY KEY,
  phone_number VARCHAR(20) NOT NULL,
  message_sid VARCHAR(100),
  otp_sent VARCHAR(10),
  language VARCHAR(10),
  delivery_status VARCHAR(20),
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes moved out of the CREATE TABLE body (2026-08-04).
-- "INDEX name (col)" inside CREATE TABLE is MySQL syntax; PostgreSQL parses
-- it as a column literally named "index" of type "name", then fails at
-- execution with: type "idx_sms_logs_phone" does not exist.
CREATE INDEX IF NOT EXISTS idx_sms_logs_phone ON sms_delivery_logs (phone_number);
CREATE INDEX IF NOT EXISTS idx_sms_logs_status ON sms_delivery_logs (delivery_status);

-- Add user preferences for accessibility
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS accessibility_preferences JSONB DEFAULT '{"prefer_voice": false, "large_text": false, "high_contrast": false}';

-- Add failed login tracking
ALTER TABLE users
ADD COLUMN IF NOT EXISTS last_failed_login_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS last_successful_login_at TIMESTAMP;