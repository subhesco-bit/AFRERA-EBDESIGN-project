-- ============================================================================
-- 000_zz_collision_column_repair.sql
--
-- WHY THIS EXISTS
-- 001_skeleton_complete_schema.sql re-declares `farmers`, `products` and
-- `orders`, which 000_base_schema.sql already created. PostgreSQL's
-- CREATE TABLE IF NOT EXISTS silently skips the second declaration, so 001's
-- wider shape never takes effect — but 001 then indexes columns only its own
-- (skipped) definition had:
--
--   CREATE INDEX idx_farmers_village_id ON farmers(village_id);
--   CREATE INDEX idx_products_farmer_id  ON products(farmer_id);
--   CREATE INDEX idx_orders_buyer_id     ON orders(buyer_id);
--   CREATE INDEX idx_orders_farmer_id    ON orders(farmer_id);
--
-- CREATE INDEX has no IF-the-column-exists escape hatch: each of these fails
-- with `column "..." does not exist`, and migrate.js rethrows on the first
-- failure (backend/src/database/migrate.js), so the entire migration run
-- aborts on the second file. This is the first thing standing between this
-- repo and a database that has ever been migrated.
--
-- 000-071 are protected core migrations (see CLAUDE.md) — not edited here.
-- This file sorts between 000_base_schema.sql and 001_skeleton_complete_
-- schema.sql under the numeric-aware ordering in
-- backend/src/database/migrationOrder.js, which is the order migrate.js
-- actually uses. Same approach as 9999_zzzzzzzzzzzzzzzzzzz_roles_collision_
-- repair.sql and 999_zz_tender_bids_collision_repair.sql.
--
-- Purely additive and idempotent: adds the columns 001's indexes require,
-- typed exactly as 001 declares them, and no-ops if they already exist.
-- Found by tools/schema-collisions.js.
-- ============================================================================

-- farmers: 001 adds a village link that 000's definition does not carry.
ALTER TABLE farmers ADD COLUMN IF NOT EXISTS village_id UUID;

-- products / orders: 001 models the farmer-to-buyer trade directly on these
-- rows; 000's definitions predate that.
ALTER TABLE products ADD COLUMN IF NOT EXISTS farmer_id UUID;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_id UUID;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS farmer_id UUID;
