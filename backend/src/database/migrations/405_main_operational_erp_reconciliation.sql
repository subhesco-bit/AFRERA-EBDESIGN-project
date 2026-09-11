-- MAIN operational ERP reconciliation
-- Preserves MAIN's functional persistence capabilities without creating a
-- separate parallel data model. Generic module entities use a common contract.

BEGIN;

CREATE TABLE IF NOT EXISTS operational_module_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_key VARCHAR(80) NOT NULL,
  owner_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','inactive','pending','completed','archived','cancelled')),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_operational_module_entities_module
  ON operational_module_entities(module_key) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_operational_module_entities_owner
  ON operational_module_entities(owner_user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_operational_module_entities_status
  ON operational_module_entities(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_operational_module_entities_payload
  ON operational_module_entities USING GIN(payload) WHERE deleted_at IS NULL;

CREATE OR REPLACE FUNCTION update_operational_module_entities_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS operational_module_entities_timestamp_trigger ON operational_module_entities;
CREATE TRIGGER operational_module_entities_timestamp_trigger
BEFORE UPDATE ON operational_module_entities
FOR EACH ROW EXECUTE FUNCTION update_operational_module_entities_timestamp();

-- MAIN module capabilities represented as canonical module keys.
INSERT INTO operational_module_entities (module_key, payload)
VALUES
 ('supply_chain', '{}'::jsonb),
 ('supplier_management', '{}'::jsonb),
 ('logistics', '{}'::jsonb),
 ('procurement', '{}'::jsonb),
 ('inventory', '{}'::jsonb),
 ('quality_control', '{}'::jsonb),
 ('warehouse', '{}'::jsonb),
 ('cold_chain', '{}'::jsonb),
 ('returns', '{}'::jsonb),
 ('sustainability', '{}'::jsonb),
 ('fleet', '{}'::jsonb),
 ('driver', '{}'::jsonb),
 ('route_optimization', '{}'::jsonb),
 ('delivery', '{}'::jsonb),
 ('last_mile', '{}'::jsonb),
 ('visibility', '{}'::jsonb),
 ('proof_of_delivery', '{}'::jsonb),
 ('logistics_exception', '{}'::jsonb),
 ('carrier', '{}'::jsonb),
 ('operational_analytics', '{}'::jsonb),
 ('soil_health', '{}'::jsonb),
 ('crop_disease', '{}'::jsonb),
 ('pest_management', '{}'::jsonb),
 ('fertilizer_management', '{}'::jsonb),
 ('yield_prediction', '{}'::jsonb),
 ('weather', '{}'::jsonb),
 ('crop_insurance', '{}'::jsonb),
 ('agri_finance', '{}'::jsonb),
 ('input_supply', '{}'::jsonb),
 ('livestock_health', '{}'::jsonb),
 ('dairy', '{}'::jsonb),
 ('poultry', '{}'::jsonb),
 ('fishery', '{}'::jsonb),
 ('apiary', '{}'::jsonb),
 ('organic_certification', '{}'::jsonb),
 ('land_records', '{}'::jsonb),
 ('water_rights', '{}'::jsonb),
 ('carbon_credits', '{}'::jsonb),
 ('training', '{}'::jsonb),
 ('market_intelligence', '{}'::jsonb),
 ('price_forecast', '{}'::jsonb),
 ('supply_visibility', '{}'::jsonb),
 ('blockchain_traceability', '{}'::jsonb),
 ('climate_risk', '{}'::jsonb),
 ('cooperative', '{}'::jsonb),
 ('credit', '{}'::jsonb),
 ('government_schemes', '{}'::jsonb),
 ('equipment_rental', '{}'::jsonb),
 ('agri_tourism', '{}'::jsonb),
 ('rural_employment', '{}'::jsonb),
 ('education', '{}'::jsonb),
 ('community', '{}'::jsonb),
 ('sustainability_goals', '{}'::jsonb),
 ('health_safety', '{}'::jsonb),
 ('water_management', '{}'::jsonb),
 ('soil_conservation', '{}'::jsonb),
 ('biodiversity', '{}'::jsonb),
 ('renewable_energy', '{}'::jsonb),
 ('waste_management', '{}'::jsonb),
 ('social_impact', '{}'::jsonb),
 ('gender_empowerment', '{}'::jsonb),
 ('youth_engagement', '{}'::jsonb),
 ('mentorship', '{}'::jsonb),
 ('rural_finance', '{}'::jsonb),
 ('microfinance', '{}'::jsonb),
 ('insurance', '{}'::jsonb),
 ('pensions', '{}'::jsonb),
 ('savings', '{}'::jsonb),
 ('investments', '{}'::jsonb),
 ('erp_integration', '{}'::jsonb),
 ('advanced_analytics', '{}'::jsonb),
 ('business_intelligence', '{}'::jsonb),
 ('compliance', '{}'::jsonb)
ON CONFLICT DO NOTHING;

-- Explicit compatibility tables for high-volume operational domains.
CREATE TABLE IF NOT EXISTS supply_chain_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supply_chain_id UUID REFERENCES supply_chains(id) ON DELETE CASCADE,
  event_type VARCHAR(80) NOT NULL,
  event_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  location JSONB NOT NULL DEFAULT '{}'::jsonb,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_supply_chain_events_chain_time
  ON supply_chain_events(supply_chain_id, event_time DESC);

CREATE TABLE IF NOT EXISTS procurement_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID REFERENCES users(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  reference_no VARCHAR(100) UNIQUE NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'draft',
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  subtotal NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  tax NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (tax >= 0),
  total NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_procurement_orders_supplier_status
  ON procurement_orders(supplier_id, status);

CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id UUID REFERENCES inventory(id) ON DELETE CASCADE,
  warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
  movement_type VARCHAR(30) NOT NULL,
  quantity NUMERIC(18,3) NOT NULL,
  unit VARCHAR(40) NOT NULL DEFAULT 'unit',
  reference_type VARCHAR(60),
  reference_id UUID,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_inventory_time
  ON inventory_movements(inventory_id, occurred_at DESC);

CREATE TABLE IF NOT EXISTS delivery_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID REFERENCES operational_module_entities(id) ON DELETE SET NULL,
  event_type VARCHAR(60) NOT NULL,
  event_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status VARCHAR(30),
  location JSONB NOT NULL DEFAULT '{}'::jsonb,
  proof JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_delivery_events_delivery_time
  ON delivery_events(delivery_id, event_time DESC);

CREATE TABLE IF NOT EXISTS compliance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(80) NOT NULL,
  entity_id UUID,
  compliance_type VARCHAR(80) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  valid_from DATE,
  valid_to DATE,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_compliance_records_entity
  ON compliance_records(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_compliance_records_status
  ON compliance_records(status);

COMMIT;
