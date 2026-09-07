-- Pre-Season Order / Contract Farming persistence — confirmed genuinely
-- absent before this migration (2026-08-15). preSeasonOrderService.js built
-- order/bid/agreement/milestone objects entirely in memory (generateId(),
-- no pool.query, no INSERT anywhere in the file) and returned them directly.
-- The service is live (backend/src/index.js calls
-- preSeasonOrderService.setupRoutes(app)), so every real order, bid,
-- contract, and milestone placed through it vanished on the next process
-- restart or even the next request.
--
-- NAMING COLLISION NOTE: a table named `contract_milestones` already exists
-- in this schema TWICE with incompatible column sets:
--   * 000_base_schema.sql: UUID id, contract_id -> contracts(id)
--   * 3102_ecommerce_ai_erp_business_marketing.sql: VARCHAR(50) id,
--     contract_id -> contract_farming(id)
-- Both use CREATE TABLE IF NOT EXISTS, so whichever migration runs first
-- silently wins and the other's columns never get created. To avoid adding
-- a third, worse collision, this migration's milestone table for pre-season
-- contract farming is named `contract_farming_milestones` instead. This
-- pre-existing collision is not fixed here — it's a separate, real bug
-- worth its own follow-up.
--
-- ESCROW HONESTY NOTE: `escrow_status` on both pre_season_orders and
-- contract_farming_agreements can only ever be 'not_required' or
-- 'not_implemented' with the code in this migration. Real escrow (buyer
-- funds held, then released to farmers on milestone completion) needs a
-- buyer-side funding source. The only wallet system in this codebase,
-- farmer_wallets, is scoped to farmers(id) (see
-- migrations/011_farmer_portal_enhancements.sql) — buyers here are `users`
-- who are not necessarily farmers, so there is no wallet to hold funds
-- from. Faking a 'held' status (or worse, crediting a farmer's wallet on
-- milestone completion with no funded source) would create money from
-- nowhere, exactly the failure mode farmerService.js's transferFromWallet
-- comment block warns about. Real escrow requires buyer-side wallet or
-- payment-gateway infrastructure that doesn't exist yet.

CREATE TABLE IF NOT EXISTS pre_season_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  buyer_id UUID NOT NULL REFERENCES users(id),
  buyer_type VARCHAR(30),
  product_id UUID REFERENCES products(id),
  product_category VARCHAR(100),
  quantity_required DECIMAL(14, 2),
  quality_specifications JSONB DEFAULT '{}',
  delivery_location VARCHAR(255),
  delivery_date DATE,
  price_offered DECIMAL(14, 2),
  payment_terms TEXT,
  contract_duration INTEGER,
  escrow_required BOOLEAN DEFAULT FALSE,
  escrow_status VARCHAR(20) NOT NULL DEFAULT 'not_required'
    CHECK (escrow_status IN ('not_required', 'not_implemented')),
  escrow_amount DECIMAL(14, 2),
  escrow_note TEXT,
  market_snapshot JSONB DEFAULT '{}',
  status VARCHAR(20) NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'bid_selected', 'contracted', 'fulfilled', 'cancelled', 'expired')),
  selected_bid_ids UUID[],
  total_cost DECIMAL(14, 2),
  weighted_average_price DECIMAL(14, 2),
  selection_rationale TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pre_season_orders_buyer ON pre_season_orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_pre_season_orders_status ON pre_season_orders(status);
CREATE INDEX IF NOT EXISTS idx_pre_season_orders_category ON pre_season_orders(product_category);

CREATE TABLE IF NOT EXISTS pre_season_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES pre_season_orders(id) ON DELETE CASCADE,
  farmer_id UUID NOT NULL REFERENCES farmers(id),
  farmer_name VARCHAR(255),
  offered_quantity DECIMAL(14, 2) NOT NULL,
  offered_price DECIMAL(14, 2) NOT NULL,
  expected_quality JSONB DEFAULT '{}',
  harvest_date DATE,
  location VARCHAR(255),
  certifications JSONB DEFAULT '{}',
  payment_terms_preference TEXT,
  -- Real, deterministic, explainable comparisons against the order this bid
  -- responds to — not a fabricated AI "match_score". See the honesty note
  -- in preSeasonOrderService.js.
  price_variance_pct DECIMAL(9, 2),
  quantity_fulfillment_pct DECIMAL(9, 2),
  status VARCHAR(20) NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted', 'selected', 'rejected', 'withdrawn')),
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  decided_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pre_season_bids_order ON pre_season_bids(order_id);
CREATE INDEX IF NOT EXISTS idx_pre_season_bids_farmer ON pre_season_bids(farmer_id);
CREATE INDEX IF NOT EXISTS idx_pre_season_bids_status ON pre_season_bids(status);

CREATE TABLE IF NOT EXISTS contract_farming_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_number VARCHAR(50) UNIQUE NOT NULL,
  order_id UUID REFERENCES pre_season_orders(id),
  buyer_id UUID NOT NULL REFERENCES users(id),
  farmers JSONB NOT NULL DEFAULT '[]',
  product_details JSONB DEFAULT '{}',
  quantity DECIMAL(14, 2),
  quality_standards JSONB DEFAULT '{}',
  pricing_structure JSONB DEFAULT '{}',
  delivery_schedule JSONB DEFAULT '{}',
  payment_terms TEXT,
  penalties JSONB DEFAULT '{}',
  dispute_resolution TEXT,
  -- Passed through as given, never guessed out of pricing_structure's
  -- free-form JSON shape.
  total_value DECIMAL(14, 2),
  escrow_status VARCHAR(20) NOT NULL DEFAULT 'not_implemented'
    CHECK (escrow_status IN ('not_implemented', 'not_required')),
  escrow_amount DECIMAL(14, 2),
  escrow_note TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'completed', 'terminated')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contract_farming_agreements_buyer ON contract_farming_agreements(buyer_id);
CREATE INDEX IF NOT EXISTS idx_contract_farming_agreements_order ON contract_farming_agreements(order_id);
CREATE INDEX IF NOT EXISTS idx_contract_farming_agreements_status ON contract_farming_agreements(status);

CREATE TABLE IF NOT EXISTS contract_farming_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contract_farming_agreements(id) ON DELETE CASCADE,
  milestone_type VARCHAR(30) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  completion_date DATE,
  evidence JSONB DEFAULT '{}',
  comments TEXT,
  escrow_release_status VARCHAR(20) NOT NULL DEFAULT 'not_applicable'
    CHECK (escrow_release_status IN ('not_applicable', 'not_implemented')),
  escrow_release_note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contract_farming_milestones_contract ON contract_farming_milestones(contract_id);
