-- Add the soft-delete column eight migrations index but never got to create.
--
-- Each of these migrations opens with CREATE TABLE IF NOT EXISTS and then
-- builds partial indexes on it:
--
--     CREATE TABLE IF NOT EXISTS suppliers ( ... deleted_at TIMESTAMP, ... );
--     CREATE INDEX ... ON suppliers(user_id) WHERE deleted_at IS NULL;
--
-- An earlier migration had already created each table with a different shape,
-- so IF NOT EXISTS skipped the creation, the column was never added, and the
-- partial index then failed with 'column "deleted_at" does not exist'. The
-- table survives, the indexes do not, and the migration is recorded as failed.
--
-- That is one defect wearing eight hats: 332_suppliers, 337_warehouses,
-- 339_returns, 411_projects, 437_complaints, 458_edge_computing, 544_wallets
-- and 644_feature_flags all fail this way and nothing else is wrong with them.
--
-- Adding the column lets those migrations complete on the next run and gives
-- the tables the soft-delete semantics their own indexes assume: a partial
-- index WHERE deleted_at IS NULL only makes sense if rows can be soft-deleted.
--
-- monitoring_alerts is the same shape with a different column: 095 indexes
-- status on a table an earlier migration created without it.

ALTER TABLE suppliers          ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE warehouses         ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE returns            ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE projects           ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE complaints         ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE edge_computing     ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE wallets            ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE feature_flags      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- 095_create_monitoring_tables.sql indexes monitoring_alerts(status).
ALTER TABLE monitoring_alerts  ADD COLUMN IF NOT EXISTS status VARCHAR(30) NOT NULL DEFAULT 'open';

-- No indexes are created here on purpose.
--
-- A first version added `... (id) WHERE deleted_at IS NULL` to each table and
-- failed with 'column "id" does not exist' — not every one of these tables is
-- keyed on id, and assuming a column shape is exactly the mistake that caused
-- the original eight failures. Adding the column is the whole fix: each
-- migration builds its own indexes, correctly, as soon as it can run.
CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_status ON monitoring_alerts (status);
