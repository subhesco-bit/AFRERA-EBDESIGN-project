-- Email verification tokens
--
-- WHY THIS EXISTS
-- registerUser() creates every account with status 'pending', and loginUser()
-- rejects any account whose status is not 'active'. No code path anywhere in
-- this repository moved an account from 'pending' to 'active': the only
-- `UPDATE users SET status='active'` is M020's unlockAccount(), which clears a
-- lockout on an already-activated account. Verified against a live PostgreSQL
-- 16 run -- a freshly registered user got 401 "Account is not active" on login,
-- permanently.
--
-- This table backs the missing activation path. Tokens are stored HASHED
-- (SHA-256), so a database read does not yield a usable activation link, and
-- are single-use via consumed_at.
--
-- Idempotent per the project convention.

CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  CHAR(64) NOT NULL,
    expires_at  TIMESTAMP NOT NULL,
    consumed_at TIMESTAMP,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_email_verification_tokens_hash
    ON email_verification_tokens (token_hash);

-- Re-issuing a token invalidates the user's outstanding ones, which is a
-- lookup by user_id.
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user
    ON email_verification_tokens (user_id)
    WHERE consumed_at IS NULL;
