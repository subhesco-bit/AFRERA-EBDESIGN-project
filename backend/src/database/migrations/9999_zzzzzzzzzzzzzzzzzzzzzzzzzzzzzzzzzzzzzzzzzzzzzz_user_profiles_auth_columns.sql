-- user_profiles columns written by services/dual-use/authService.js.
--
-- register() inserts (user_id, first_name, last_name, phone) and the OAuth
-- flow writes oauth_provider / oauth_id, but the live user_profiles table is
-- 000_base_schema.sql's shape (a deferred collision with
-- 3019_m019_profile_management.sql in schema-decisions.json) and has none of
-- the three. Every registration failed with
--   column "phone" of relation "user_profiles" does not exist
-- Additive and idempotent, matching the collision policy used elsewhere.
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(50);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS oauth_id VARCHAR(255);
CREATE INDEX IF NOT EXISTS idx_user_profiles_oauth ON user_profiles(oauth_provider, oauth_id);
