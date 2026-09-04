-- Phase 3: Bulk Order Management Schema
CREATE TABLE bulk_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID,
  quantity INT,
  total_amount DECIMAL(10,2),
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bulk_quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bulk_order_id UUID NOT NULL REFERENCES bulk_orders(id),
  vendor_id UUID,
  quoted_price DECIMAL(10,2),
  created_at TIMESTAMP
);

CREATE INDEX idx_bulk_orders_buyer ON bulk_orders(buyer_id);
CREATE INDEX idx_bulk_quotations_order ON bulk_quotations(bulk_order_id);
