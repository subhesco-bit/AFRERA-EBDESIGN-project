-- Phase 5: Order allocation, logistics and delivery
CREATE TABLE IF NOT EXISTS fulfillment_shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_number VARCHAR(40) NOT NULL UNIQUE,
  order_id UUID NOT NULL REFERENCES marketplace_orders(id) ON DELETE RESTRICT,
  carrier_id UUID,
  vehicle_id UUID,
  origin JSONB NOT NULL DEFAULT '{}',
  destination JSONB NOT NULL DEFAULT '{}',
  planned_weight NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK (planned_weight >= 0),
  actual_weight NUMERIC(14,3),
  weight_unit VARCHAR(20) NOT NULL DEFAULT 'kg',
  status VARCHAR(24) NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','allocated','picked_up','in_transit','out_for_delivery','delivered','failed','cancelled')),
  tracking_reference VARCHAR(120),
  estimated_delivery_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS fulfillment_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES fulfillment_shipments(id) ON DELETE CASCADE,
  order_item_id UUID NOT NULL REFERENCES marketplace_order_items(id) ON DELETE RESTRICT,
  supply_lot_id UUID,
  allocated_quantity NUMERIC(14,3) NOT NULL CHECK (allocated_quantity > 0),
  unit VARCHAR(30) NOT NULL DEFAULT 'kg',
  allocation_status VARCHAR(20) NOT NULL DEFAULT 'reserved' CHECK (allocation_status IN ('reserved','picked','loaded','delivered','released','short')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(shipment_id, order_item_id, supply_lot_id)
);
CREATE TABLE IF NOT EXISTS delivery_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES fulfillment_shipments(id) ON DELETE CASCADE,
  event_type VARCHAR(30) NOT NULL CHECK (event_type IN ('allocated','picked_up','loaded','in_transit','checkpoint','out_for_delivery','delivered','failed','returned')),
  event_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  actor_id UUID,
  evidence JSONB NOT NULL DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fulfillment_shipments_order ON fulfillment_shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_fulfillment_shipments_status ON fulfillment_shipments(status);
CREATE INDEX IF NOT EXISTS idx_fulfillment_allocations_shipment ON fulfillment_allocations(shipment_id);
CREATE INDEX IF NOT EXISTS idx_delivery_events_shipment_time ON delivery_events(shipment_id,event_time DESC);
