-- Phase 3: Supply Chain Tracking Schema
CREATE TABLE IF NOT EXISTS shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,
  origin VARCHAR(255),
  destination VARCHAR(255),
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP
);
-- 2026-10-05 merge-collision:shipments - `shipments` is already created by 000_base_schema.sql
-- (sorts first), so the CREATE above is a no-op. Additive merge so this
-- file's indexes/FKs and its service's columns exist (nullable: rows
-- written through the other shape never populate them).
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS product_id UUID;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS origin VARCHAR(255);
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS destination VARCHAR(255);
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS status VARCHAR(50);
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;
CREATE UNIQUE INDEX IF NOT EXISTS uq_shipments_id_merge ON shipments(id);

CREATE TABLE IF NOT EXISTS tracking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES shipments(id),
  location VARCHAR(255),
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS supply_chain_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES shipments(id),
  node_type VARCHAR(50),
  node_data JSONB,
  created_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tracking_events_shipment ON tracking_events(shipment_id);
CREATE INDEX IF NOT EXISTS idx_supply_chain_nodes_shipment ON supply_chain_nodes(shipment_id);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'shipments'
      AND column_name = 'product_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_shipments_product ON shipments(product_id);
  END IF;
END $$;
