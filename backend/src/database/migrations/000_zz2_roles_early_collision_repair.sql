-- ============================================================================
-- 000_zz2_roles_early_collision_repair.sql
--
-- WHY THIS EXISTS
-- 001_skeleton_complete_schema.sql re-declares `roles` with
-- CREATE TABLE IF NOT EXISTS, which 000_base_schema.sql already created
-- (id, name, description, permissions, created_at only). Postgres skips
-- 001's wider declaration, but 001 then runs, in the same file/transaction:
--
--   INSERT INTO roles (code, name, description, is_system) VALUES (...);
--
-- which fails with `column "code" of relation "roles" does not exist` and
-- aborts the entire migration run on the very first non-base migration.
--
-- This is the same class of bug documented in
-- 000_zz_collision_column_repair.sql (farmers/products/orders) and
-- 9999_zzzzzzzzzzzzzzzzzzz_roles_collision_repair.sql (a LATER roles
-- collision against 014_platform_foundation_modules.sql's
-- is_system_role/level/metadata/updated_at columns). That 9999 file runs
-- last by design and cannot help 001, which needs code/is_system/
-- parent_role_id immediately. This file adds exactly what 001 needs, and
-- nothing the 9999 repair already covers, before 001 ever runs.
--
-- 000-071 are protected core migrations (see CLAUDE.md) — not edited here.
-- Purely additive and idempotent: adds the columns/index 001's own INSERT
-- and definition require, typed exactly as 001 declares them, and no-ops
-- if they already exist.
-- ============================================================================

ALTER TABLE roles ADD COLUMN IF NOT EXISTS code VARCHAR(50);
ALTER TABLE roles ADD COLUMN IF NOT EXISTS parent_role_id INTEGER REFERENCES roles(id);
ALTER TABLE roles ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT false;

-- 001 declares `code VARCHAR(50) UNIQUE NOT NULL`; enforce the same
-- constraints only once every existing row has a value, so this stays
-- idempotent/safe to run against a database that already has rows.
UPDATE roles SET code = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '_', 'g')) WHERE code IS NULL;
ALTER TABLE roles ALTER COLUMN code SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS roles_code_key ON roles(code);
