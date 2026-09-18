BEGIN;
CREATE TABLE IF NOT EXISTS farmer_household_buyer_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES farmers(id),
  member_user_id UUID NOT NULL REFERENCES users(id),
  relationship TEXT NOT NULL,
  consent_record JSONB NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending','verified','revoked')),
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(farmer_id,member_user_id)
);
CREATE TABLE IF NOT EXISTS farmer_procurement_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_product_id UUID REFERENCES products(id),
  supplier_id UUID NOT NULL REFERENCES users(id),
  category TEXT NOT NULL CHECK (category IN ('household','machine','seed','fertilizer','piping','drip','pump','repair','second_life')),
  product_name TEXT NOT NULL,
  unit TEXT NOT NULL,
  origin_state TEXT NOT NULL REFERENCES india_jurisdiction_coverage(name),
  served_states TEXT[] NOT NULL,
  list_price_per_unit NUMERIC(16,4) NOT NULL CHECK (list_price_per_unit>0),
  minimum_order_quantity NUMERIC(16,4) NOT NULL DEFAULT 1 CHECK (minimum_order_quantity>0),
  available_quantity NUMERIC(16,4) NOT NULL CHECK (available_quantity>=0),
  bulk_tiers JSONB NOT NULL DEFAULT '[]'::jsonb,
  freight_per_order NUMERIC(16,4) NOT NULL DEFAULT 0 CHECK (freight_per_order>=0),
  quoted_delivery_days INTEGER NOT NULL CHECK (quoted_delivery_days>=0),
  terms_source TEXT NOT NULL,
  effective_from DATE NOT NULL,
  effective_to DATE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','retired')),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (status<>'approved' OR (approved_by IS NOT NULL AND approved_at IS NOT NULL)),
  CHECK (effective_to IS NULL OR effective_to>=effective_from)
);
CREATE INDEX IF NOT EXISTS idx_farmer_procurement_available ON farmer_procurement_offers(category,status,effective_from,origin_state);
CREATE TABLE IF NOT EXISTS farmer_procurement_quote_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID NOT NULL REFERENCES users(id),
  farmer_id UUID NOT NULL REFERENCES farmers(id),
  destination_address_id UUID NOT NULL REFERENCES addresses(id),
  category TEXT NOT NULL,
  own_quantity NUMERIC(16,4) NOT NULL CHECK (own_quantity>0),
  pooled_quantity NUMERIC(16,4) CHECK (pooled_quantity IS NULL OR pooled_quantity>=own_quantity),
  alternatives JSONB NOT NULL,
  recommendation JSONB,
  decision_status TEXT NOT NULL CHECK (decision_status IN ('provisional','no_feasible_offer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS farmer_procurement_events (
  id BIGSERIAL PRIMARY KEY,
  aggregate_type TEXT NOT NULL,
  aggregate_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  actor_id UUID REFERENCES users(id),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE OR REPLACE FUNCTION farmer_procurement_event_immutable() RETURNS trigger AS $$ BEGIN RAISE EXCEPTION 'procurement events are append-only'; END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_farmer_procurement_event_immutable ON farmer_procurement_events;
CREATE TRIGGER trg_farmer_procurement_event_immutable BEFORE UPDATE OR DELETE ON farmer_procurement_events FOR EACH ROW EXECUTE FUNCTION farmer_procurement_event_immutable();
COMMIT;
