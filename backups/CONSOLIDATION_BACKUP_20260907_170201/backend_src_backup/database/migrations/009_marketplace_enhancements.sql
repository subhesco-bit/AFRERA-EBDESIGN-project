-- FK TYPE FIX 2026-08-04: 10 column(s) in this file declared INTEGER while
-- referencing a UUID primary key. PostgreSQL rejects the whole CREATE TABLE
-- ("foreign key constraint cannot be implemented"), so these tables were
-- never created at all — along with every index and trigger that followed.
-- Changed to UUID to match 000_base_schema, which is canonical.

-- Marketplace Enhancements Migration
-- Product Reviews, Bulk Orders, and GST functionality

-- Create update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Product Reviews Table
CREATE TABLE IF NOT EXISTS product_reviews (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  product_id UUID NOT NULL REFERENCES products(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  comment TEXT,
  images JSONB DEFAULT '[]',
  verified_purchase BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_user_id ON product_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_status ON product_reviews(status);
CREATE INDEX IF NOT EXISTS idx_product_reviews_rating ON product_reviews(rating);

-- Review Helpful Table
CREATE TABLE IF NOT EXISTS review_helpful (
  id SERIAL PRIMARY KEY,
  review_id INTEGER NOT NULL REFERENCES product_reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(review_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_review_helpful_review_id ON review_helpful(review_id);
CREATE INDEX IF NOT EXISTS idx_review_helpful_user_id ON review_helpful(user_id);

-- Review Reports Table
CREATE TABLE IF NOT EXISTS review_reports (
  id SERIAL PRIMARY KEY,
  review_id INTEGER NOT NULL REFERENCES product_reviews(id),
  reporter_id UUID NOT NULL REFERENCES users(id),
  reason TEXT,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_review_reports_review_id ON review_reports(review_id);
CREATE INDEX IF NOT EXISTS idx_review_reports_status ON review_reports(status);

-- Bulk Orders Table
CREATE TABLE IF NOT EXISTS bulk_orders (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  expected_delivery_date DATE,
  delivery_location TEXT,
  special_requirements TEXT,
  budget_per_unit DECIMAL(10, 2),
  estimated_total DECIMAL(12, 2),
  contact_person VARCHAR(255),
  contact_phone VARCHAR(20),
  contact_email VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'quoted', 'confirmed', 'rejected', 'cancelled', 'delivered')),
  reviewed_by UUID REFERENCES users(id),
  review_notes TEXT,
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bulk_orders_user_id ON bulk_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_bulk_orders_product_id ON bulk_orders(product_id);
CREATE INDEX IF NOT EXISTS idx_bulk_orders_status ON bulk_orders(status);
CREATE INDEX IF NOT EXISTS idx_bulk_orders_created_at ON bulk_orders(created_at);

-- Bulk Order Quotations Table
CREATE TABLE IF NOT EXISTS bulk_order_quotations (
  id SERIAL PRIMARY KEY,
  bulk_order_id INTEGER NOT NULL REFERENCES bulk_orders(id),
  price_per_unit DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(12, 2) NOT NULL,
  valid_until DATE NOT NULL,
  terms TEXT,
  conditions TEXT,
  delivery_timeline TEXT,
  payment_terms TEXT,
  status VARCHAR(50) DEFAULT 'sent' CHECK (status IN ('sent', 'accepted', 'rejected', 'expired')),
  accepted_by UUID REFERENCES users(id),
  accepted_at TIMESTAMP,
  rejected_by UUID REFERENCES users(id),
  rejected_at TIMESTAMP,
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bulk_order_quotations_bulk_order_id ON bulk_order_quotations(bulk_order_id);
CREATE INDEX IF NOT EXISTS idx_bulk_order_quotations_status ON bulk_order_quotations(status);

-- Add GST-related columns to existing tables
ALTER TABLE products ADD COLUMN IF NOT EXISTS gst_applicable BOOLEAN DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS gst_rate DECIMAL(5, 2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS hsn_code VARCHAR(20);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS gst_amount DECIMAL(12, 2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS gst_breakdown JSONB;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS gst_invoice_number VARCHAR(100);

ALTER TABLE users ADD COLUMN IF NOT EXISTS gst_number VARCHAR(15);
ALTER TABLE users ADD COLUMN IF NOT EXISTS business_type VARCHAR(50);

-- Update products with default GST rates
-- FIXED 2026-08-04: this referenced products.category, which does not exist —
-- products carries category_id (FK to categories), not a text category. The
-- statement therefore failed and no product ever received a default GST rate.
-- Rewritten to resolve the name through categories.
UPDATE products p SET gst_rate =
  CASE
    WHEN lower(c.name) IN ('fruits','vegetables','cereals','pulses','milk','flour') THEN 0
    WHEN lower(c.name) IN ('processed_food','spices','honey','tea','coffee') THEN 5
    WHEN lower(c.name) IN ('dairy_products','oil','sugar') THEN 12
    ELSE 18
  END
FROM categories c
WHERE c.id = p.category_id AND p.gst_rate IS NULL;

-- Add audit trail for reviews
DROP TRIGGER IF EXISTS update_product_reviews_updated_at ON product_reviews;
CREATE TRIGGER update_product_reviews_updated_at BEFORE UPDATE ON product_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add audit trail for bulk orders
DROP TRIGGER IF EXISTS update_bulk_orders_updated_at ON bulk_orders;
CREATE TRIGGER update_bulk_orders_updated_at BEFORE UPDATE ON bulk_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add audit trail for quotations
DROP TRIGGER IF EXISTS update_bulk_order_quotations_updated_at ON bulk_order_quotations;
CREATE TRIGGER update_bulk_order_quotations_updated_at BEFORE UPDATE ON bulk_order_quotations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to update product rating automatically
CREATE OR REPLACE FUNCTION update_product_rating_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    UPDATE products
    SET 
      average_rating = (
        SELECT COALESCE(AVG(rating), 0)
        FROM product_reviews
        WHERE product_id = NEW.product_id AND status = 'approved'
      ),
      review_count = (
        SELECT COUNT(*)
        FROM product_reviews
        WHERE product_id = NEW.product_id AND status = 'approved'
      )
    WHERE id = NEW.product_id;
  ELSIF NEW.status != 'approved' AND (OLD.status IS NULL OR OLD.status = 'approved') THEN
    UPDATE products
    SET 
      average_rating = (
        SELECT COALESCE(AVG(rating), 0)
        FROM product_reviews
        WHERE product_id = NEW.product_id AND status = 'approved'
      ),
      review_count = (
        SELECT COUNT(*)
        FROM product_reviews
        WHERE product_id = NEW.product_id AND status = 'approved'
      )
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS product_review_rating_update ON product_reviews;
CREATE TRIGGER product_review_rating_update AFTER INSERT OR UPDATE ON product_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_product_rating_trigger();

-- Comments for documentation
COMMENT ON TABLE product_reviews IS 'Stores product reviews and ratings from users';
COMMENT ON TABLE review_helpful IS 'Tracks which users found reviews helpful';
COMMENT ON TABLE review_reports IS 'Stores reports for inappropriate reviews';
COMMENT ON TABLE bulk_orders IS 'Handles bulk/wholesale order requests';
COMMENT ON TABLE bulk_order_quotations IS 'Stores quotations for bulk orders';
