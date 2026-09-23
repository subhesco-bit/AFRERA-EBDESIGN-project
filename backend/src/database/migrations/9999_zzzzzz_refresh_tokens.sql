-- Refresh token store
--
-- WHY THIS EXISTS
-- `refresh_tokens` is read and written by four separate auth modules --
--   services/dual-use/authService.js      (SELECT / INSERT / UPDATE)
--   services/authService.js               (SELECT / UPDATE)
--   services/authService/tokens.js        (INSERT / UPDATE)
--   services/authService/userAuth.js      (SELECT / UPDATE)
-- and was defined by no migration in this repository. Verified against a live
-- PostgreSQL 16 instance with the full migration set applied: the relation did
-- not exist.
--
-- The consequence was not cosmetic. On any PostgreSQL deployment:
--   * POST /auth/refresh  -> the SELECT threw, so refresh always failed;
--   * POST /auth/logout   -> the UPDATE threw, so logout returned 500;
--   * storeRefreshToken() swallows its own error ("not critical"), so the
--     failure was silent at issue time and only surfaced on first use.
--
-- Idempotent per the project convention so a re-run on an already-migrated
-- database is clean.

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token       TEXT NOT NULL,
    device_info JSONB NOT NULL DEFAULT '{}'::jsonb,
    revoked     BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at  TIMESTAMP NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- revokeRefreshToken() updates by token alone, and refreshAccessToken()
-- selects on (user_id, token); a unique token is required for both to be
-- unambiguous.
CREATE UNIQUE INDEX IF NOT EXISTS idx_refresh_tokens_token
    ON refresh_tokens (token);

-- logoutUser() revokes every token for a user.
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id
    ON refresh_tokens (user_id);

-- Supports pruning expired rows without a sequential scan.
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at
    ON refresh_tokens (expires_at)
    WHERE revoked = FALSE;
