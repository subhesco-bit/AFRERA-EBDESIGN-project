-- Migration for Enhanced M020 Account Recovery
-- Identity & Access Domain
-- Version: 3020
-- Date: 2026-08-11

-- Password Reset Tokens Table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT false,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Security Questions Table
CREATE TABLE IF NOT EXISTS security_questions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL,
  answer_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, question_id)
);

-- Recovery Attempts Table
CREATE TABLE IF NOT EXISTS recovery_attempts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recovery_type VARCHAR(50) NOT NULL, -- 'password_reset', 'security_questions', 'temp_password'
  status VARCHAR(20) NOT NULL, -- 'initiated', 'verified', 'failed', 'completed'
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_security_questions_user_id ON security_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_recovery_attempts_user_id ON recovery_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_recovery_attempts_created_at ON recovery_attempts(created_at);

COMMENT ON TABLE password_reset_tokens IS 'Password reset tokens for account recovery';
COMMENT ON TABLE security_questions IS 'Security questions for account verification';
COMMENT ON TABLE recovery_attempts IS 'Account recovery attempt logging for fraud detection';