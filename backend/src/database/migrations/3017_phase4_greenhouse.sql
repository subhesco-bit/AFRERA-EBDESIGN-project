-- Phase 4: Greenhouse Management Schema
CREATE TABLE IF NOT EXISTS greenhouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID,
  area DECIMAL(10,2),
  crops TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 2026-10-05 merge-collision:greenhouses - `greenhouses` is already created by 014_horticulture_module.sql
-- (sorts first), so the CREATE above is a no-op. Additive merge so this
-- file's indexes/FKs and its service's columns exist (nullable: rows
-- written through the other shape never populate them).
ALTER TABLE greenhouses ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE greenhouses ADD COLUMN IF NOT EXISTS farmer_id UUID;
ALTER TABLE greenhouses ADD COLUMN IF NOT EXISTS area DECIMAL(10,2);
ALTER TABLE greenhouses ADD COLUMN IF NOT EXISTS crops TEXT;
ALTER TABLE greenhouses ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
CREATE UNIQUE INDEX IF NOT EXISTS uq_greenhouses_id_merge ON greenhouses(id);

CREATE INDEX IF NOT EXISTS idx_greenhouses_farmer ON greenhouses(farmer_id);
