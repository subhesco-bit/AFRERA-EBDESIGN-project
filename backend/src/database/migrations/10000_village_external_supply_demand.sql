-- 10000_village_external_supply_demand.sql
-- Village external-needs + SUBH supply layer.
-- Keeps household, village-common and Agro OS demand distinct while allowing
-- the SUBH platform to aggregate, source, order, deliver and reconcile supply.

BEGIN;

CREATE TABLE IF NOT EXISTS village_supply_catalog (
  id BIGSERIAL PRIMARY KEY,
  item_code VARCHAR(80) UNIQUE NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  demand_layer VARCHAR(20) NOT NULL,
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(120),
  unit VARCHAR(40) NOT NULL DEFAULT 'unit',
  description TEXT,
  standard_price NUMERIC(18,2) CHECK (standard_price IS NULL OR standard_price >= 0),
  price_source VARCHAR(100),
  taxable BOOLEAN NOT NULL DEFAULT FALSE,
  regulated BOOLEAN NOT NULL DEFAULT FALSE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (demand_layer IN ('household','village','agro'))
);

CREATE INDEX IF NOT EXISTS idx_village_supply_catalog_layer_category
  ON village_supply_catalog(demand_layer, category, active);

CREATE TABLE IF NOT EXISTS village_external_demands (
  id BIGSERIAL PRIMARY KEY,
  village_id INTEGER NOT NULL REFERENCES villages(id) ON DELETE CASCADE,
  demand_layer VARCHAR(20) NOT NULL,
  household_id VARCHAR(100),
  requester_type VARCHAR(50),
  requester_id VARCHAR(100),
  item_id BIGINT NOT NULL REFERENCES village_supply_catalog(id),
  required_quantity NUMERIC(18,3) NOT NULL CHECK (required_quantity > 0),
  fulfilled_quantity NUMERIC(18,3) NOT NULL DEFAULT 0 CHECK (fulfilled_quantity >= 0),
  unit VARCHAR(40) NOT NULL,
  need_period_start DATE NOT NULL,
  need_period_end DATE,
  priority VARCHAR(20) NOT NULL DEFAULT 'normal',
  source VARCHAR(60) NOT NULL DEFAULT 'manual',
  purpose TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'open',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (demand_layer IN ('household','village','agro')),
  CHECK (priority IN ('critical','high','normal','low')),
  CHECK (status IN ('open','partially_fulfilled','fulfilled','cancelled')),
  CHECK (need_period_end IS NULL OR need_period_end >= need_period_start),
  CHECK (fulfilled_quantity <= required_quantity)
);

CREATE INDEX IF NOT EXISTS idx_village_external_demands_plan
  ON village_external_demands(village_id, demand_layer, status, need_period_start);
CREATE INDEX IF NOT EXISTS idx_village_external_demands_item
  ON village_external_demands(item_id, demand_layer, status);

CREATE TABLE IF NOT EXISTS village_supply_orders (
  id BIGSERIAL PRIMARY KEY,
  order_number VARCHAR(60) UNIQUE NOT NULL,
  village_id INTEGER NOT NULL REFERENCES villages(id) ON DELETE CASCADE,
  demand_layer VARCHAR(20) NOT NULL,
  requested_by_type VARCHAR(50),
  requested_by_id VARCHAR(100),
  supplier_type VARCHAR(50) NOT NULL DEFAULT 'subh_network',
  supplier_id VARCHAR(100),
  status VARCHAR(30) NOT NULL DEFAULT 'draft',
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  required_by DATE,
  delivery_address TEXT,
  estimated_subtotal NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (estimated_subtotal >= 0),
  estimated_tax NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (estimated_tax >= 0),
  estimated_total NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (estimated_total >= 0),
  actual_total NUMERIC(18,2) CHECK (actual_total IS NULL OR actual_total >= 0),
  payment_status VARCHAR(30) NOT NULL DEFAULT 'pending',
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (demand_layer IN ('household','village','agro')),
  CHECK (status IN ('draft','submitted','approved','sourcing','in_transit','delivered','cancelled','closed')),
  CHECK (payment_status IN ('pending','partially_paid','paid','failed','not_required'))
);

CREATE INDEX IF NOT EXISTS idx_village_supply_orders_village_status
  ON village_supply_orders(village_id, demand_layer, status, order_date);

CREATE TABLE IF NOT EXISTS village_supply_order_lines (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES village_supply_orders(id) ON DELETE CASCADE,
  demand_id BIGINT REFERENCES village_external_demands(id) ON DELETE SET NULL,
  item_id BIGINT NOT NULL REFERENCES village_supply_catalog(id),
  quantity NUMERIC(18,3) NOT NULL CHECK (quantity > 0),
  unit VARCHAR(40) NOT NULL,
  unit_price NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  tax_amount NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  line_total NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (line_total >= 0),
  delivered_quantity NUMERIC(18,3) NOT NULL DEFAULT 0 CHECK (delivered_quantity >= 0),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_village_supply_order_lines_order
  ON village_supply_order_lines(order_id);
CREATE INDEX IF NOT EXISTS idx_village_supply_order_lines_demand
  ON village_supply_order_lines(demand_id);

CREATE OR REPLACE VIEW village_external_supply_plan AS
SELECT
  d.village_id,
  d.demand_layer,
  c.item_code,
  c.item_name,
  c.category,
  c.subcategory,
  c.unit,
  SUM(d.required_quantity) AS required_quantity,
  SUM(d.fulfilled_quantity) AS fulfilled_quantity,
  GREATEST(0, SUM(d.required_quantity) - SUM(d.fulfilled_quantity)) AS outstanding_quantity,
  MIN(d.need_period_start) AS earliest_need_date,
  MAX(d.need_period_end) AS latest_need_date,
  COUNT(*)::int AS demand_records,
  COUNT(*) FILTER (WHERE d.priority = 'critical')::int AS critical_records,
  COUNT(*) FILTER (WHERE d.priority = 'high')::int AS high_priority_records
FROM village_external_demands d
JOIN village_supply_catalog c ON c.id = d.item_id
WHERE d.status IN ('open','partially_fulfilled')
GROUP BY d.village_id, d.demand_layer, c.item_code, c.item_name, c.category, c.subcategory, c.unit;

CREATE OR REPLACE VIEW village_supply_order_summary AS
SELECT
  o.id,
  o.order_number,
  o.village_id,
  o.demand_layer,
  o.status,
  o.order_date,
  o.required_by,
  o.supplier_type,
  o.supplier_id,
  o.estimated_total,
  o.actual_total,
  o.payment_status,
  COUNT(l.id)::int AS line_count,
  COALESCE(SUM(l.quantity),0) AS ordered_quantity,
  COALESCE(SUM(l.delivered_quantity),0) AS delivered_quantity
FROM village_supply_orders o
LEFT JOIN village_supply_order_lines l ON l.order_id = o.id
GROUP BY o.id;

COMMIT;
