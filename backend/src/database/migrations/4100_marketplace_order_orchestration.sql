-- Phase 4: Marketplace order orchestration
CREATE TABLE IF NOT EXISTS marketplace_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(40) NOT NULL UNIQUE,
  buyer_id UUID,
  seller_id UUID,
  source_supply_lot_id UUID,
  currency VARCHAR(3) NOT NULL DEFAULT 'INR',
  subtotal NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  tax_amount NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  freight_amount NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (freight_amount >= 0),
  total_amount NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  status VARCHAR(24) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','placed','confirmed','allocated','shipped','delivered','cancelled','closed')),
  payment_status VARCHAR(24) NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid','authorized','paid','partially_paid','refunded','failed')),
  fulfillment_status VARCHAR(24) NOT NULL DEFAULT 'pending' CHECK (fulfillment_status IN ('pending','allocated','in_transit','delivered','exception','cancelled')),
  shipping_address JSONB NOT NULL DEFAULT '{}',
  billing_address JSONB NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}',
  placed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS marketplace_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES marketplace_orders(id) ON DELETE CASCADE,
  product_id UUID,
  supply_lot_id UUID,
  seller_id UUID,
  quantity NUMERIC(14,3) NOT NULL CHECK (quantity > 0),
  unit VARCHAR(30) NOT NULL DEFAULT 'kg',
  unit_price NUMERIC(14,2) NOT NULL CHECK (unit_price >= 0),
  tax_rate NUMERIC(6,3) NOT NULL DEFAULT 0 CHECK (tax_rate >= 0),
  line_total NUMERIC(14,2) NOT NULL CHECK (line_total >= 0),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS marketplace_order_status_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES marketplace_orders(id) ON DELETE CASCADE,
  from_status VARCHAR(24),
  to_status VARCHAR(24) NOT NULL,
  actor_id UUID,
  reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_buyer ON marketplace_orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_seller ON marketplace_orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_status ON marketplace_orders(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_order_items_order ON marketplace_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_order_events_order ON marketplace_order_status_events(order_id);
