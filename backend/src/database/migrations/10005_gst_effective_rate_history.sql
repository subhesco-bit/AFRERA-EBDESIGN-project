BEGIN;

-- Preserve every statutory rate version needed to reproduce older invoices.
ALTER TABLE gst_rates DROP CONSTRAINT IF EXISTS gst_rates_product_category_key;
CREATE UNIQUE INDEX IF NOT EXISTS uq_gst_rates_effective_version
  ON gst_rates(product_category, hsn_code, effective_date);

ALTER TABLE gst_returns DROP CONSTRAINT IF EXISTS gst_returns_status_check;
ALTER TABLE gst_returns ADD CONSTRAINT gst_returns_status_check
  CHECK (return_status IN ('pending','prepared','filed','accepted','rejected','cancelled')) NOT VALID;
ALTER TABLE gst_payments DROP CONSTRAINT IF EXISTS gst_payments_status_check;
ALTER TABLE gst_payments ADD CONSTRAINT gst_payments_status_check
  CHECK (payment_status IN ('pending','processing','completed','failed','cancelled')) NOT VALID;

COMMIT;
