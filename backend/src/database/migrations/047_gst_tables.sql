-- FK TYPE FIX 2026-08-04: 4 column(s) in this file declared INTEGER while
-- referencing a UUID primary key. PostgreSQL rejects the whole CREATE TABLE
-- ("foreign key constraint cannot be implemented"), so these tables were
-- never created at all — along with every index and trigger that followed.
-- Changed to UUID to match 000_base_schema, which is canonical.

-- GST Service Tables Migration
-- for AFRERA Platform GST Service

-- HSN to GST rate mapping table
CREATE TABLE IF NOT EXISTS hsn_gst_mapping (
  id SERIAL PRIMARY KEY,
  hsn_code VARCHAR(10) UNIQUE NOT NULL,
  description TEXT,
  gst_rate DECIMAL(4,2) NOT NULL,
  category VARCHAR(50),
  effective_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes moved out of the CREATE TABLE body (2026-08-04).
-- "INDEX name (col)" inside CREATE TABLE is MySQL syntax; PostgreSQL parses
-- it as a column literally named "index" of type "name", then fails at
-- execution with: type "idx_hsn_code" does not exist.
CREATE INDEX IF NOT EXISTS idx_hsn_code ON hsn_gst_mapping (hsn_code);
CREATE INDEX IF NOT EXISTS idx_hsn_category ON hsn_gst_mapping (category);
CREATE INDEX IF NOT EXISTS idx_hsn_gst_rate ON hsn_gst_mapping (gst_rate);

-- GST invoices table
CREATE TABLE IF NOT EXISTS gst_invoices (
  id SERIAL PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  invoice_date DATE NOT NULL,
  buyer_name VARCHAR(255) NOT NULL,
  buyer_gstin VARCHAR(15),
  buyer_address TEXT,
  buyer_state VARCHAR(10),
  seller_state VARCHAR(10) DEFAULT 'AS',
  gst_calculation JSONB NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  payment_status VARCHAR(20) DEFAULT 'pending',
  eway_bill_number VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reconciliation 2026-08-04: gst_invoices is also defined in 028_gst_schema.sql,
-- which runs first and wins, so the CREATE above is a no-op and this file's
-- columns were silently dropped.
ALTER TABLE gst_invoices ADD COLUMN IF NOT EXISTS buyer_gstin VARCHAR(15);
ALTER TABLE gst_invoices ADD COLUMN IF NOT EXISTS seller_gstin VARCHAR(15);
ALTER TABLE gst_invoices ADD COLUMN IF NOT EXISTS place_of_supply VARCHAR(50);
ALTER TABLE gst_invoices ADD COLUMN IF NOT EXISTS reverse_charge BOOLEAN DEFAULT FALSE;

-- Completed 2026-08-04. The reconciliation above was partial: it added
-- buyer_address but not buyer_name, leaving four columns still absent.
--
-- NAME MAPPING — 028 is authoritative. The columns below are NOT added,
-- because they are this file's spelling of columns 028 already has. Adding
-- them would leave two columns holding the same number, free to drift:
--
--     047 spelling        ->  028 column (use this one)
--     buyer_name          ->  customer_name
--     buyer_state         ->  customer_state
--     seller_state        ->  supplier_state
--
-- Only genuinely new concepts are added:
--
--   eway_bill_number — an e-way bill is legally required for consignments
--   over Rs 50,000 moving between states. 028 has no field for it. There is
--   also a full eway_bills table further down this file; this column is the
--   denormalised number carried on the invoice itself, which is what appears
--   on the printed document and what transporters are asked for at check
--   posts. Nullable: many NE consignments fall under the threshold.
ALTER TABLE gst_invoices ADD COLUMN IF NOT EXISTS eway_bill_number VARCHAR(20);

COMMENT ON COLUMN gst_invoices.eway_bill_number IS
  'E-way bill number for this consignment. NULL when below the Rs 50,000 '
  'threshold or for intra-state movement exempted by the state. See the '
  'eway_bills table for the full record.';

-- Indexes moved out of the CREATE TABLE body (2026-08-04).
-- "INDEX name (col)" inside CREATE TABLE is MySQL syntax; PostgreSQL parses
-- it as a column literally named "index" of type "name", then fails at
-- execution with: type "idx_gst_invoice_order" does not exist.
CREATE INDEX IF NOT EXISTS idx_gst_invoice_order ON gst_invoices (order_id);
CREATE INDEX IF NOT EXISTS idx_gst_invoice_number ON gst_invoices (invoice_number);
CREATE INDEX IF NOT EXISTS idx_gst_invoice_date ON gst_invoices (invoice_date);
CREATE INDEX IF NOT EXISTS idx_gst_invoice_buyer_gstin ON gst_invoices (buyer_gstin);

-- GST invoice items table
CREATE TABLE IF NOT EXISTS gst_invoice_items (
  id SERIAL PRIMARY KEY,
  invoice_id INTEGER NOT NULL REFERENCES gst_invoices(id),
  item_id INTEGER,
  name VARCHAR(255) NOT NULL,
  hsn_code VARCHAR(10),
  gst_rate DECIMAL(4,2),
  taxable_value DECIMAL(12,2),
  cgst DECIMAL(12,2),
  sgst DECIMAL(12,2),
  igst DECIMAL(12,2),
  total_gst DECIMAL(12,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reconciliation 2026-08-04, completed the same day.
-- gst_invoice_items is also defined in 028_gst_schema.sql, which runs first
-- and wins, so the CREATE above never took effect.
--
-- NAME MAPPING — 028 is authoritative. Not added, because 028 already has
-- them under different names:
--
--     047 spelling   ->  028 column (use this one)
--     name           ->  product_name
--     cgst           ->  cgst_amount
--     sgst           ->  sgst_amount
--     igst           ->  igst_amount
--     total_gst      ->  total_gst_amount
--
-- Only the genuinely new concept is added:
--
--   taxable_value — the assessable value GST is charged ON, after discount
--   and before tax. 028 records total_amount and discount_amount but not the
--   base between them. That base is what a GST return and an e-invoice IRN
--   payload both require, and deriving it at read time invites two callers
--   deriving it differently.
ALTER TABLE gst_invoice_items ADD COLUMN IF NOT EXISTS taxable_value DECIMAL(12,2);

COMMENT ON COLUMN gst_invoice_items.taxable_value IS
  'Assessable value GST is levied on: total_amount less discount_amount, '
  'before tax. Required by GSTR filings and e-invoice payloads.';

-- Indexes moved out of the CREATE TABLE body (2026-08-04).
-- "INDEX name (col)" inside CREATE TABLE is MySQL syntax; PostgreSQL parses
-- it as a column literally named "index" of type "name", then fails at
-- execution with: type "idx_gst_item_invoice" does not exist.
CREATE INDEX IF NOT EXISTS idx_gst_item_invoice ON gst_invoice_items (invoice_id);
CREATE INDEX IF NOT EXISTS idx_gst_item_hsn ON gst_invoice_items (hsn_code);

-- E-way bills table
CREATE TABLE IF NOT EXISTS eway_bills (
  id SERIAL PRIMARY KEY,
  eway_bill_number VARCHAR(20) UNIQUE NOT NULL,
  invoice_id INTEGER NOT NULL REFERENCES gst_invoices(id),
  vehicle_number VARCHAR(20) NOT NULL,
  distance INTEGER NOT NULL,
  validity_days INTEGER NOT NULL,
  valid_from TIMESTAMP NOT NULL,
  valid_until TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  extension_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes moved out of the CREATE TABLE body (2026-08-04).
-- "INDEX name (col)" inside CREATE TABLE is MySQL syntax; PostgreSQL parses
-- it as a column literally named "index" of type "name", then fails at
-- execution with: type "idx_eway_bill_number" does not exist.
CREATE INDEX IF NOT EXISTS idx_eway_bill_number ON eway_bills (eway_bill_number);
CREATE INDEX IF NOT EXISTS idx_eway_invoice ON eway_bills (invoice_id);
CREATE INDEX IF NOT EXISTS idx_eway_vehicle ON eway_bills (vehicle_number);
CREATE INDEX IF NOT EXISTS idx_eway_status ON eway_bills (status);
CREATE INDEX IF NOT EXISTS idx_eway_validity ON eway_bills (valid_until);

-- GST ITC ledger table
CREATE TABLE IF NOT EXISTS gst_itc_ledger (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  financial_year VARCHAR(10) NOT NULL,
  period VARCHAR(10) NOT NULL,
  eligible_itc DECIMAL(12,2) DEFAULT 0,
  utilized_itc DECIMAL(12,2) DEFAULT 0,
  balance_itc DECIMAL(12,2) DEFAULT 0,
  return_filed BOOLEAN DEFAULT FALSE,
  return_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes moved out of the CREATE TABLE body (2026-08-04).
-- "INDEX name (col)" inside CREATE TABLE is MySQL syntax; PostgreSQL parses
-- it as a column literally named "index" of type "name", then fails at
-- execution with: type "idx_itc_user" does not exist.
CREATE INDEX IF NOT EXISTS idx_itc_user ON gst_itc_ledger (user_id);
CREATE INDEX IF NOT EXISTS idx_itc_period ON gst_itc_ledger (financial_year, period);
CREATE INDEX IF NOT EXISTS idx_itc_return ON gst_itc_ledger (return_filed);

-- GST compliance tracking table
CREATE TABLE IF NOT EXISTS gst_compliance_tracking (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  financial_year VARCHAR(10) NOT NULL,
  gstr1_filed BOOLEAN DEFAULT FALSE,
  gstr1_filed_date DATE,
  gstr3b_filed BOOLEAN DEFAULT FALSE,
  gstr3b_filed_date DATE,
  gst_payment_made BOOLEAN DEFAULT FALSE,
  gst_payment_date DATE,
  gst_payment_amount DECIMAL(12,2),
  compliance_score DECIMAL(3,2),
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes moved out of the CREATE TABLE body (2026-08-04).
-- "INDEX name (col)" inside CREATE TABLE is MySQL syntax; PostgreSQL parses
-- it as a column literally named "index" of type "name", then fails at
-- execution with: type "idx_compliance_user" does not exist.
CREATE INDEX IF NOT EXISTS idx_compliance_user ON gst_compliance_tracking (user_id);
CREATE INDEX IF NOT EXISTS idx_compliance_year ON gst_compliance_tracking (financial_year);

-- GST returns history table
CREATE TABLE IF NOT EXISTS gst_returns_history (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  return_type VARCHAR(10) NOT NULL,
  return_period VARCHAR(10) NOT NULL,
  filing_date DATE,
  status VARCHAR(20),
  acknowledgement_number VARCHAR(50),
  tax_paid DECIMAL(12,2),
  itc_claimed DECIMAL(12,2),
  refund_claimed DECIMAL(12,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes moved out of the CREATE TABLE body (2026-08-04).
-- "INDEX name (col)" inside CREATE TABLE is MySQL syntax; PostgreSQL parses
-- it as a column literally named "index" of type "name", then fails at
-- execution with: type "idx_returns_user" does not exist.
CREATE INDEX IF NOT EXISTS idx_returns_user ON gst_returns_history (user_id);
CREATE INDEX IF NOT EXISTS idx_returns_period ON gst_returns_history (return_period);
CREATE INDEX IF NOT EXISTS idx_returns_type ON gst_returns_history (return_type);

-- Add GSTIN to user profiles if not exists
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS gstin VARCHAR(15),
ADD COLUMN IF NOT EXISTS gst_registration_type VARCHAR(20) DEFAULT 'unregistered',
ADD COLUMN IF NOT EXISTS gst_filing_frequency VARCHAR(20) DEFAULT 'monthly';

-- Create function to update invoice total
CREATE OR REPLACE FUNCTION update_gst_invoice_total()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total_amount = (
    SELECT COALESCE(SUM(taxable_value + total_gst), 0)
    FROM gst_invoice_items
    WHERE invoice_id = NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update invoice total
DROP TRIGGER IF EXISTS trigger_update_gst_invoice_total ON gst_invoice_items;
CREATE TRIGGER trigger_update_gst_invoice_total AFTER INSERT OR UPDATE ON gst_invoice_items
FOR EACH STATEMENT
EXECUTE FUNCTION update_gst_invoice_total();

-- Insert default HSN codes for agricultural products
INSERT INTO hsn_gst_mapping (hsn_code, description, gst_rate, category) VALUES
('0801', 'Coconuts, Brazil nuts and cashew nuts, fresh or dried', 0, 'agricultural_products'),
('0802', 'Other nuts, fresh or dried', 0, 'agricultural_products'),
('0803', 'Bananas, including plantains, fresh or dried', 0, 'agricultural_products'),
('0804', 'Dates, figs, pineapples, avocados, mangoes, fresh or dried', 0, 'agricultural_products'),
('0805', 'Citrus fruit, fresh or dried', 0, 'agricultural_products'),
('0806', 'Grapes, fresh or dried', 0, 'agricultural_products'),
('0807', 'Melons, including watermelons, and papayas, fresh', 0, 'agricultural_products'),
('0808', 'Apples, pears and quinces, fresh', 0, 'agricultural_products'),
('0809', 'Apricots, cherries, peaches, nectarines, plums and sloes, fresh', 0, 'agricultural_products'),
('0810', 'Other fruit, fresh', 0, 'agricultural_products'),
('0901', 'Coffee, whether or not roasted or decaffeinated', 0, 'agricultural_products'),
('0902', 'Tea, whether or not flavored', 0, 'agricultural_products'),
('1001', 'Wheat and meslin', 0, 'agricultural_products'),
('1002', 'Rye', 0, 'agricultural_products'),
('1003', 'Barley', 0, 'agricultural_products'),
('1004', 'Oats', 0, 'agricultural_products'),
('1005', 'Maize (corn)', 0, 'agricultural_products'),
('1006', 'Rice', 0, 'agricultural_products'),
('1007', 'Grain sorghum', 0, 'agricultural_products'),
('1008', 'Buckwheat, millet and canary seed', 0, 'agricultural_products'),
('1905', 'Bread, pastry, cakes, biscuits and other bakers wares', 5, 'processed_foods'),
('2001', 'Vegetables, fruit, nuts prepared or preserved by vinegar', 5, 'processed_foods'),
('2002', 'Tomatoes, prepared or preserved', 5, 'processed_foods'),
('2004', 'Other vegetables, prepared or preserved', 5, 'processed_foods'),
('2008', 'Fruit, nuts prepared or preserved', 12, 'processed_foods'),
('0401', 'Milk and cream, not concentrated', 0, 'dairy_products'),
('0402', 'Milk and cream, concentrated', 12, 'dairy_products'),
('0403', 'Yogurt', 12, 'dairy_products'),
('0405', 'Butter and other fats from milk', 12, 'dairy_products'),
('0406', 'Cheese and curd', 12, 'dairy_products'),
('0409', 'Natural honey', 0, 'dairy_products')
ON CONFLICT (hsn_code) DO NOTHING;