-- ERP sync columns on products.
--
-- services/legacy/erpService.js getSyncStatus() selects products.erp_synced_at
-- (alongside orders, farmers and assets, which already have it from
-- 000_base_schema.sql), and the bulk sync selects unsynced products by it, but
-- products never had the column: GET /api/v1/erp/status failed with
--   column "erp_synced_at" does not exist
-- syncProductToERP() now records erp_reference/erp_synced_at like the others.
ALTER TABLE products ADD COLUMN IF NOT EXISTS erp_reference VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS erp_synced_at TIMESTAMP;
CREATE INDEX IF NOT EXISTS idx_products_erp_synced_at ON products(erp_synced_at);
