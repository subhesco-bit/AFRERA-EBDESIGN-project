-- 1001_platform_configuration.sql (generated)
-- Platform configuration table for key-value settings (M002)
--
-- 2026-08-30: this file's own CREATE TABLE is a no-op - 014_platform_foundation_
-- modules.sql already declares platform_configurations with a richer, differently
-- -shaped table (config_key/config_value, not key/value) and runs first. The
-- original INSERT below referenced key/value/description/environment, none of
-- which exist on 014's table, so it would fail with "column does not exist"
-- against a real database (caught by tools/schema-collisions.js's real
-- npm run migrate CI step). Fixed to target the columns that actually exist:
-- description/environment are genuinely new (added via ALTER below); key/value
-- are the exact same fact as 014's config_key/config_value under different
-- names, so per this repo's schema-decisions.json "synonym" convention they are
-- NOT duplicated as new columns - the INSERT now uses config_key/config_value.

ALTER TABLE platform_configurations ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE platform_configurations ADD COLUMN IF NOT EXISTS environment TEXT;

INSERT INTO platform_configurations (category, config_key, config_value, config_type, description, environment) VALUES
  ('features', 'feature_flags', '{}', 'json', 'Global feature flags', 'global')
ON CONFLICT (config_key) DO NOTHING;
