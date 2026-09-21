-- users.full_name — give the users table the display name its readers expect.
--
-- 79 references across 35 services select a person's name from the users table
-- (u.name, and u.full_name in a few places). users has no such column: the name
-- lives on user_profiles.full_name. Every one of those queries failed with
-- "column u.name does not exist", which was the largest single source of API
-- 500s in the route audit.
--
-- user_profiles.user_id is UNIQUE, so user_profiles is a strict 1:1 vertical
-- partition of users rather than a separate entity. Carrying the display name
-- on users is therefore consistent with the data model, not a denormalisation
-- across a real relationship.
--
-- user_profiles.full_name stays the write side, because that is where the
-- application sets first_name/last_name. This column mirrors it, backfilled
-- once and kept current by trigger, so both existing readers keep working.

ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);

-- Backfill from the profile, falling back to the local part of the email so a
-- user with no profile row still renders as something rather than NULL.
UPDATE users u
SET full_name = COALESCE(
  NULLIF(TRIM(p.full_name), ''),
  NULLIF(TRIM(CONCAT_WS(' ', p.first_name, p.last_name)), ''),
  SPLIT_PART(u.email, '@', 1)
)
FROM user_profiles p
WHERE p.user_id = u.id
  AND u.full_name IS DISTINCT FROM COALESCE(
    NULLIF(TRIM(p.full_name), ''),
    NULLIF(TRIM(CONCAT_WS(' ', p.first_name, p.last_name)), ''),
    SPLIT_PART(u.email, '@', 1)
  );

UPDATE users
SET full_name = SPLIT_PART(email, '@', 1)
WHERE full_name IS NULL OR TRIM(full_name) = '';

-- Keep the mirror current. user_profiles is the write side.
CREATE OR REPLACE FUNCTION sync_user_full_name()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users
  SET full_name = COALESCE(
        NULLIF(TRIM(NEW.full_name), ''),
        NULLIF(TRIM(CONCAT_WS(' ', NEW.first_name, NEW.last_name)), ''),
        full_name
      )
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_profiles_sync_full_name ON user_profiles;
CREATE TRIGGER user_profiles_sync_full_name
AFTER INSERT OR UPDATE OF full_name, first_name, last_name ON user_profiles
FOR EACH ROW
EXECUTE FUNCTION sync_user_full_name();

CREATE INDEX IF NOT EXISTS idx_users_full_name ON users (full_name);
