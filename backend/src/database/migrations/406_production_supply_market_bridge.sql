-- Production -> aggregation -> marketplace bridge.
-- Uses existing farmer/land/crop/harvest concepts and provides one canonical
-- transaction boundary for moving production into the commercial pipeline.

BEGIN;

CREATE TABLE IF NOT EXISTS production_supply_lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE RESTRICT,
  land_record_id INTEGER REFERENCES land_records(id) ON DELETE SET NULL,
  crop_plan_id INTEGER REFERENCES crop_plans(id) ON DELETE SET NULL,
  harvest_plan_id INTEGER,
  fpo_id UUID,
  product_name VARCHAR(255) NOT NULL,
  variety VARCHAR(150),
  harvest_date DATE,
  quantity NUMERIC(18,3) NOT NULL CHECK (quantity > 0),
  unit VARCHAR(40) NOT NULL DEFAULT 'kg',
  quality_grade VARCHAR(50),
  traceability JSONB NOT NULL DEFAULT '{}'::jsonb,
  status VARCHAR(30) NOT NULL DEFAULT 'available'
    CHECK (status IN ('planned','available','aggregating','listed','allocated','sold','cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_production_supply_lots_farmer_status
  ON production_supply_lots(farmer_id, status);
CREATE INDEX IF NOT EXISTS idx_production_supply_lots_crop_date
  ON production_supply_lots(product_name, harvest_date);
CREATE INDEX IF NOT EXISTS idx_production_supply_lots_fpo
  ON production_supply_lots(fpo_id);

CREATE TABLE IF NOT EXISTS production_supply_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id UUID NOT NULL REFERENCES production_supply_lots(id) ON DELETE CASCADE,
  aggregation_entity_id UUID,
  marketplace_entity_id UUID,
  buyer_entity_id UUID,
  logistics_entity_id UUID,
  linked_quantity NUMERIC(18,3) NOT NULL CHECK (linked_quantity > 0),
  link_type VARCHAR(30) NOT NULL
    CHECK (link_type IN ('aggregation','listing','buyer_allocation','logistics','settlement')),
  status VARCHAR(30) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','completed','cancelled')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_production_supply_links_lot
  ON production_supply_links(lot_id, link_type, status);
CREATE INDEX IF NOT EXISTS idx_production_supply_links_entities
  ON production_supply_links(marketplace_entity_id, buyer_entity_id);

CREATE OR REPLACE FUNCTION update_production_supply_lots_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS production_supply_lots_timestamp_trigger ON production_supply_lots;
CREATE TRIGGER production_supply_lots_timestamp_trigger
BEFORE UPDATE ON production_supply_lots
FOR EACH ROW EXECUTE FUNCTION update_production_supply_lots_timestamp();

COMMIT;
