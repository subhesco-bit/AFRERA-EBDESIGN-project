-- AFRERA Village Economy Flow Intelligence
-- Purpose: make the Village an economic accounting unit for what is produced,
-- consumed by households/families, consumed by the village, transformed/stored,
-- and sold into external markets.
--
-- Design rule: this is additive and uses the canonical villages table. It does
-- not replace household_economy, farm_consumables, procurement, sales, ERP or
-- market modules; it provides the village-level flow ledger that connects them.

CREATE TABLE IF NOT EXISTS village_economic_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id UUID NOT NULL REFERENCES villages(id) ON DELETE CASCADE,
  activity_code VARCHAR(80) UNIQUE NOT NULL,
  activity_name VARCHAR(255) NOT NULL,
  sector VARCHAR(80) NOT NULL,
  subsector VARCHAR(100),
  producer_type VARCHAR(50),
  producer_ref UUID,
  household_ref UUID,
  organization_ref UUID,
  production_system VARCHAR(100),
  status VARCHAR(30) NOT NULL DEFAULT 'active'
    CHECK (status IN ('planned','active','inactive','closed')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_village_econ_activity_village
  ON village_economic_activities(village_id);
CREATE INDEX IF NOT EXISTS idx_village_econ_activity_sector
  ON village_economic_activities(sector);
CREATE INDEX IF NOT EXISTS idx_village_econ_activity_producer
  ON village_economic_activities(producer_ref);

-- One production record is the economic source quantity. Its disposition is
-- explicitly separated so the system can answer: retained at home, consumed
-- inside the village, used as an input, stored/processed, wasted, or marketed.
CREATE TABLE IF NOT EXISTS village_production_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id UUID NOT NULL REFERENCES villages(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES village_economic_activities(id) ON DELETE SET NULL,
  producer_ref UUID,
  household_ref UUID,
  product_code VARCHAR(100),
  product_name VARCHAR(255) NOT NULL,
  product_category VARCHAR(100),
  production_date DATE NOT NULL,
  period_start DATE,
  period_end DATE,
  quantity_produced NUMERIC(18,4) NOT NULL CHECK (quantity_produced >= 0),
  unit VARCHAR(30) NOT NULL,
  estimated_gross_value NUMERIC(18,2) DEFAULT 0 CHECK (estimated_gross_value >= 0),
  -- Physical/economic disposition of the produced quantity.
  household_consumed_qty NUMERIC(18,4) NOT NULL DEFAULT 0 CHECK (household_consumed_qty >= 0),
  village_consumed_qty NUMERIC(18,4) NOT NULL DEFAULT 0 CHECK (village_consumed_qty >= 0),
  internal_input_qty NUMERIC(18,4) NOT NULL DEFAULT 0 CHECK (internal_input_qty >= 0),
  processed_qty NUMERIC(18,4) NOT NULL DEFAULT 0 CHECK (processed_qty >= 0),
  stored_qty NUMERIC(18,4) NOT NULL DEFAULT 0 CHECK (stored_qty >= 0),
  marketed_qty NUMERIC(18,4) NOT NULL DEFAULT 0 CHECK (marketed_qty >= 0),
  donated_qty NUMERIC(18,4) NOT NULL DEFAULT 0 CHECK (donated_qty >= 0),
  lost_wasted_qty NUMERIC(18,4) NOT NULL DEFAULT 0 CHECK (lost_wasted_qty >= 0),
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_village_production_disposition
    CHECK (
      household_consumed_qty + village_consumed_qty + internal_input_qty +
      processed_qty + stored_qty + marketed_qty + donated_qty + lost_wasted_qty
      <= quantity_produced + 0.0001
    )
);

CREATE INDEX IF NOT EXISTS idx_village_production_village_date
  ON village_production_records(village_id, production_date DESC);
CREATE INDEX IF NOT EXISTS idx_village_production_product
  ON village_production_records(product_code, product_name);
CREATE INDEX IF NOT EXISTS idx_village_production_producer
  ON village_production_records(producer_ref);

-- Household/family consumption. A record may be entered at household level or
-- aggregated at family level; household_ref is the stable application identity
-- reference and is intentionally not hard-wired to one household table version.
CREATE TABLE IF NOT EXISTS village_household_consumption (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id UUID NOT NULL REFERENCES villages(id) ON DELETE CASCADE,
  household_ref UUID NOT NULL,
  family_ref UUID,
  consumption_date DATE NOT NULL,
  product_code VARCHAR(100),
  product_name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  quantity NUMERIC(18,4) NOT NULL CHECK (quantity >= 0),
  unit VARCHAR(30) NOT NULL,
  source_type VARCHAR(40) NOT NULL DEFAULT 'purchased'
    CHECK (source_type IN ('own_production','village_supply','purchased','received','processed')),
  source_production_id UUID REFERENCES village_production_records(id) ON DELETE SET NULL,
  value_estimate NUMERIC(18,2) DEFAULT 0 CHECK (value_estimate >= 0),
  essential BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_village_household_consumption_village_date
  ON village_household_consumption(village_id, consumption_date DESC);
CREATE INDEX IF NOT EXISTS idx_village_household_consumption_household
  ON village_household_consumption(household_ref, consumption_date DESC);
CREATE INDEX IF NOT EXISTS idx_village_household_consumption_product
  ON village_household_consumption(product_code, product_name);

-- Village/common consumption covers community institutions and collective use:
-- schools, anganwadi, health facilities, hostels, community kitchens, events,
-- public works and other village demand that is not a private household order.
CREATE TABLE IF NOT EXISTS village_common_consumption (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id UUID NOT NULL REFERENCES villages(id) ON DELETE CASCADE,
  consumption_date DATE NOT NULL,
  consumer_type VARCHAR(60) NOT NULL,
  consumer_ref UUID,
  institution_name VARCHAR(255),
  product_code VARCHAR(100),
  product_name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  quantity NUMERIC(18,4) NOT NULL CHECK (quantity >= 0),
  unit VARCHAR(30) NOT NULL,
  source_type VARCHAR(40) NOT NULL DEFAULT 'purchased'
    CHECK (source_type IN ('village_production','village_stock','purchased','received','processed')),
  source_production_id UUID REFERENCES village_production_records(id) ON DELETE SET NULL,
  value_estimate NUMERIC(18,2) DEFAULT 0 CHECK (value_estimate >= 0),
  funded_by VARCHAR(80),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_village_common_consumption_village_date
  ON village_common_consumption(village_id, consumption_date DESC);
CREATE INDEX IF NOT EXISTS idx_village_common_consumption_consumer
  ON village_common_consumption(consumer_type, consumer_ref);

-- Market outflow: everything leaving the village economic system for an
-- external buyer/market, including farmer sales, FPO aggregation and village
-- enterprise sales. It can later reconcile to the existing sales/procurement/
-- logistics modules through external_order_ref.
CREATE TABLE IF NOT EXISTS village_market_flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id UUID NOT NULL REFERENCES villages(id) ON DELETE CASCADE,
  production_id UUID REFERENCES village_production_records(id) ON DELETE SET NULL,
  seller_ref UUID,
  aggregator_ref UUID,
  buyer_ref UUID,
  sale_date DATE NOT NULL,
  product_code VARCHAR(100),
  product_name VARCHAR(255) NOT NULL,
  market_type VARCHAR(80) NOT NULL,
  destination VARCHAR(255),
  quantity NUMERIC(18,4) NOT NULL CHECK (quantity >= 0),
  unit VARCHAR(30) NOT NULL,
  unit_price NUMERIC(18,4) CHECK (unit_price >= 0),
  gross_value NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (gross_value >= 0),
  transaction_cost NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (transaction_cost >= 0),
  net_value NUMERIC(18,2) GENERATED ALWAYS AS (gross_value - transaction_cost) STORED,
  external_order_ref VARCHAR(120),
  status VARCHAR(30) NOT NULL DEFAULT 'completed'
    CHECK (status IN ('planned','contracted','in_transit','completed','cancelled')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_village_market_flows_village_date
  ON village_market_flows(village_id, sale_date DESC);
CREATE INDEX IF NOT EXISTS idx_village_market_flows_product
  ON village_market_flows(product_code, product_name);
CREATE INDEX IF NOT EXISTS idx_village_market_flows_buyer
  ON village_market_flows(buyer_ref);

-- A compact village economy dashboard view. It deliberately exposes both
-- physical quantities and monetary values, enabling the UI/AI to distinguish
-- production from consumption and marketable surplus.
CREATE OR REPLACE VIEW village_economy_flow_summary AS
SELECT
  v.id AS village_id,
  v.name AS village_name,
  COALESCE(p.production_records, 0) AS production_records,
  COALESCE(p.produced_value, 0) AS produced_value,
  COALESCE(p.household_consumed_qty, 0) AS household_consumed_qty,
  COALESCE(p.village_consumed_qty, 0) AS village_consumed_qty,
  COALESCE(p.internal_input_qty, 0) AS internal_input_qty,
  COALESCE(p.processed_qty, 0) AS processed_qty,
  COALESCE(p.stored_qty, 0) AS stored_qty,
  COALESCE(p.marketed_qty, 0) AS marketed_qty,
  COALESCE(p.donated_qty, 0) AS donated_qty,
  COALESCE(p.lost_wasted_qty, 0) AS lost_wasted_qty,
  COALESCE(h.household_consumption_value, 0) AS household_consumption_value,
  COALESCE(c.village_consumption_value, 0) AS village_consumption_value,
  COALESCE(m.market_gross_value, 0) AS market_gross_value,
  COALESCE(m.market_net_value, 0) AS market_net_value
FROM villages v
LEFT JOIN (
  SELECT
    village_id,
    COUNT(*) AS production_records,
    SUM(estimated_gross_value) AS produced_value,
    SUM(household_consumed_qty) AS household_consumed_qty,
    SUM(village_consumed_qty) AS village_consumed_qty,
    SUM(internal_input_qty) AS internal_input_qty,
    SUM(processed_qty) AS processed_qty,
    SUM(stored_qty) AS stored_qty,
    SUM(marketed_qty) AS marketed_qty,
    SUM(donated_qty) AS donated_qty,
    SUM(lost_wasted_qty) AS lost_wasted_qty
  FROM village_production_records
  GROUP BY village_id
) p ON p.village_id = v.id
LEFT JOIN (
  SELECT village_id, SUM(value_estimate) AS household_consumption_value
  FROM village_household_consumption
  GROUP BY village_id
) h ON h.village_id = v.id
LEFT JOIN (
  SELECT village_id, SUM(value_estimate) AS village_consumption_value
  FROM village_common_consumption
  GROUP BY village_id
) c ON c.village_id = v.id
LEFT JOIN (
  SELECT village_id, SUM(gross_value) AS market_gross_value, SUM(net_value) AS market_net_value
  FROM village_market_flows
  WHERE status <> 'cancelled'
  GROUP BY village_id
) m ON m.village_id = v.id;

COMMENT ON VIEW village_economy_flow_summary IS
'Village-level economic flow: produced -> household consumption -> village/common consumption -> internal use/processing/storage -> market surplus.';
