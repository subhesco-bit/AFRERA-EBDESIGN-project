-- Phase 3: Freight Pooling Schema
CREATE TABLE freight_pools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  origin VARCHAR(255),
  destination VARCHAR(255),
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE freight_shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  freight_pool_id UUID NOT NULL REFERENCES freight_pools(id),
  shipment_id UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_freight_pools_origin ON freight_pools(origin);
CREATE INDEX idx_freight_shipments_pool ON freight_shipments(freight_pool_id);
