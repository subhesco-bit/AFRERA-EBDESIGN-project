-- ============================================================================
-- 066_fertilizer_inventory_schema.sql   (2026-08-10)
--
-- WHY THIS EXISTS
-- frontend/src/pages/FertilizerInventoryPage.jsx (M112 - Fertilizer
-- Inventory, Input Supply domain) is a real, fully-built, routed page —
-- stock list, add/edit/delete, and an "Issue Stock" flow — already wired
-- against fertilizerAPI (frontend/src/services/api.js) calling
-- /fertilizer/inventory and /fertilizer/issues. Neither endpoint has ever
-- existed on the backend (backend/src/modules/M112 is an empty scaffold).
--
-- This migration adds the stock table the page's form already assumes
-- (name, category, unit, quantity, reorder_level, unit_price — the exact
-- fields the "Add Stock Item" form collects). It deliberately does NOT
-- create a new consumption/issue table: migration 056_named_missing_modules
-- already added agri_input_issues for exactly this ("Track inputs issued to
-- farmers"), and per api.js's own comment on fertilizerAPI, that table has
-- existed since 056 with no route ever reading or writing it. The "Issue
-- Stock" action wired up alongside this table writes into agri_input_issues
-- rather than a new table, so the reorder-point logic (average consumption
-- rate x lead time + safety stock) has a real, pre-existing consumption
-- ledger to read from instead of a brand new empty one.
-- ============================================================================

CREATE TABLE IF NOT EXISTS fertilizer_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'Urea',
  unit VARCHAR(30) NOT NULL DEFAULT 'bag (50kg)',
  quantity NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  reorder_level NUMERIC(12,2),
  unit_price NUMERIC(12,2),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fertilizer_inventory_name ON fertilizer_inventory(name);

-- agri_input_issues (056_named_missing_modules.sql) has no free-text
-- "who/why" fields, which the real Issue Stock form on
-- FertilizerInventoryPage.jsx collects (issued_to, purpose). Additive,
-- nullable columns only — the table has zero readers/writers before this
-- change (see api.js's fertilizerAPI comment), so there is nothing to break.
ALTER TABLE agri_input_issues ADD COLUMN IF NOT EXISTS issued_to VARCHAR(200);
ALTER TABLE agri_input_issues ADD COLUMN IF NOT EXISTS purpose VARCHAR(200);
ALTER TABLE agri_input_issues ADD COLUMN IF NOT EXISTS inventory_item_id UUID REFERENCES fertilizer_inventory(id) ON DELETE SET NULL;
