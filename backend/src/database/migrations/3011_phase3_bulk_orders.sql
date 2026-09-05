-- Phase 3: Bulk Order Management Schema
CREATE TABLE IF NOT EXISTS bulk_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID,
  quantity INT,
  total_amount DECIMAL(10,2),
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bulk_quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bulk_order_id INTEGER NOT NULL REFERENCES bulk_orders(id),
  vendor_id UUID,
  quoted_price DECIMAL(10,2),
  created_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bulk_quotations_order ON bulk_quotations(bulk_order_id);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'bulk_orders'
      AND column_name = 'buyer_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_bulk_orders_buyer ON bulk_orders(buyer_id);
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'bulk_orders'
      AND column_name = 'user_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_bulk_orders_user ON bulk_orders(user_id);
  END IF;
END $$;
