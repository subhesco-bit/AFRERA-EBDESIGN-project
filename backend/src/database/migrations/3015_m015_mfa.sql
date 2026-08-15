-- Migration for Enhanced M015 Multi-Factor Authentication
-- Identity & Access Domain
-- Version: 3015
-- Date: 2026-08-11

-- MFA Secrets Table
CREATE TABLE IF NOT EXISTS mfa_secrets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  method VARCHAR(50) NOT NULL, -- 'totp', 'sms', 'email'
  secret TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, method)
);

-- MFA OTP Table
CREATE TABLE IF NOT EXISTS mfa_otp (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  method VARCHAR(50) NOT NULL,
  phone_number VARCHAR(20),
  email VARCHAR(255),
  otp_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- MFA Biometrics Table
CREATE TABLE IF NOT EXISTS mfa_biometrics (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  biometric_type VARCHAR(50) NOT NULL,
  biometric_hash TEXT NOT NULL,
  device_info JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, biometric_type)
);

-- Trusted Devices Table
CREATE TABLE IF NOT EXISTS trusted_devices (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_fingerprint TEXT NOT NULL,
  trust_level VARCHAR(20) DEFAULT 'trusted', -- 'trusted', 'verified', 'unknown'
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, device_fingerprint)
);

-- MFA Recovery Codes Table
CREATE TABLE IF NOT EXISTS mfa_recovery_codes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  codes_hash JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- MFA Events Table
CREATE TABLE IF NOT EXISTS mfa_events (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  method VARCHAR(50) NOT NULL,
  event_type VARCHAR(50) NOT NULL, -- 'setup_initiated', 'verification_success', 'verification_failed', 'disabled'
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_mfa_secrets_user_id ON mfa_secrets(user_id);
CREATE INDEX IF NOT EXISTS idx_mfa_otp_user_id ON mfa_otp(user_id);
CREATE INDEX IF NOT EXISTS idx_mfa_otp_expires_at ON mfa_otp(expires_at);
CREATE INDEX IF NOT EXISTS idx_mfa_biometrics_user_id ON mfa_biometrics(user_id);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_user_id ON trusted_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_fingerprint ON trusted_devices(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_mfa_events_user_id ON mfa_events(user_id);
CREATE INDEX IF NOT EXISTS idx_mfa_events_created_at ON mfa_events(created_at);

COMMENT ON TABLE mfa_secrets IS 'Multi-Factor Authentication secrets for TOTP/SMS/Email';
COMMENT ON TABLE mfa_otp IS 'One-Time Passwords for MFA verification';
COMMENT ON TABLE mfa_biometrics IS 'Biometric authentication data';
COMMENT ON TABLE trusted_devices IS 'Trusted device management for MFA';
COMMENT ON TABLE mfa_recovery_codes IS 'Recovery codes for account recovery';
COMMENT ON TABLE mfa_events IS 'MFA event logging for audit and fraud detection';