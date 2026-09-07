-- ============================================================================
-- 064_gst_branding_classification.sql   (2026-08-08)
--
-- WHY THIS EXISTS
-- 047_gst_tables.sql seeded hsn_gst_mapping with ONE gst_rate per HSN code.
-- That is wrong for a specific, well-known slice of Indian GST: several
-- agricultural staples (cereals under HSN Chapter 10 among them) are
-- NIL-rated when sold loose/unbranded, but become taxable when "put up in
-- unit container and bearing a registered brand name" — that exact phrase is
-- the operative legal test used in the CBIC rate/exemption notification
-- structure for these goods (the branded-goods carve-out inside the
-- Chapter-1-to-21 exemption notification, paired with the corresponding
-- entry in the goods-rate notification for the branded case). This file does
-- not assert a specific notification number/date beyond what the surrounding
-- project brief already stated, because that could not be independently
-- verified from inside this codebase — see gstService.js for the same
-- caveat next to the code that reads these columns.
--
-- SCOPE — deliberately narrow
-- This migration only touches HSN rows that already exist in
-- hsn_gst_mapping (047, lines 264-296) and only flags the ones where the
-- branded/unbranded split is real: the Chapter 10 cereals (1001-1008),
-- already seeded there at gst_rate = 0. It does NOT invent new HSN codes for
-- pulses or flour (e.g. 0713, 1101, 1102) — 047 never seeded those, and
-- fabricating HSN rows with no existing anchor in this codebase would be
-- exactly the kind of guess this task was told not to make. Every other
-- existing HSN row (fresh fruit/veg, dairy, processed foods, tea, coffee)
-- keeps its single flat gst_rate: the branded/unbranded test in the real
-- notification structure is specific to a defined list of staples, not a
-- universal rule, and most of those other rows are not on that list.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. hsn_gst_mapping: carry two rates where the branding test genuinely
--    applies, plus a flag saying whether it applies at all for that row.
--    branding_dependent = FALSE (the default) means "ignore the two rate_*
--    columns, keep using the existing flat gst_rate" — every pre-existing
--    caller of hsn_gst_mapping.gst_rate keeps working unmodified.
-- ---------------------------------------------------------------------------

ALTER TABLE hsn_gst_mapping
  ADD COLUMN IF NOT EXISTS branding_dependent BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE hsn_gst_mapping
  ADD COLUMN IF NOT EXISTS rate_loose_unbranded DECIMAL(4,2);
ALTER TABLE hsn_gst_mapping
  ADD COLUMN IF NOT EXISTS rate_branded_packaged DECIMAL(4,2);

COMMENT ON COLUMN hsn_gst_mapping.branding_dependent IS
  'TRUE only for the specific staple HSN codes where CBIC''s branded/unbranded '
  'test actually changes the rate (per the branded-goods carve-out in the '
  'goods exemption/rate notification structure for agricultural staples). '
  'FALSE (default) for every other HSN code, which keeps one fixed gst_rate '
  'regardless of packaging or brand.';
COMMENT ON COLUMN hsn_gst_mapping.rate_loose_unbranded IS
  'Rate when sold loose or otherwise NOT put up in a unit container bearing '
  'a registered brand name. Only meaningful when branding_dependent = TRUE.';
COMMENT ON COLUMN hsn_gst_mapping.rate_branded_packaged IS
  'Rate when put up in a unit container AND bearing a registered brand name '
  '(both conditions, per the notification wording) — the operative test that '
  'moves these goods out of the NIL entry. Only meaningful when '
  'branding_dependent = TRUE.';

-- Backfill: Chapter 10 cereals (wheat, rye, barley, oats, maize, rice,
-- sorghum, buckwheat/millet/canary seed) are the textbook example of this
-- rule and are already seeded here at gst_rate = 0 (the unbranded/loose
-- rate). The branded/unit-container rate commonly applied to this class of
-- staple in practice is 5% — carried here as rate_branded_packaged, but
-- flagged low-confidence in the report back rather than asserted as
-- independently verified from this codebase. gst_rate is left untouched
-- (still 0) so any caller still reading only that column keeps getting the
-- conservative/NIL answer instead of silently overtaxing loose produce.
UPDATE hsn_gst_mapping
SET branding_dependent = TRUE,
    rate_loose_unbranded = 0.00,
    rate_branded_packaged = 5.00
WHERE hsn_code IN ('1001', '1002', '1003', '1004', '1005', '1006', '1007', '1008')
  AND category = 'agricultural_products';

CREATE INDEX IF NOT EXISTS idx_hsn_branding_dependent
  ON hsn_gst_mapping (branding_dependent) WHERE branding_dependent = TRUE;

-- ---------------------------------------------------------------------------
-- 2. products: the packaging/branding STATE of a specific sellable lot.
--    Same pattern already used for `organic` / `organic_certificate_number`
--    a few lines above in 000_base_schema — a boolean flag plus the
--    supporting detail fields, not a separate one-row-per-product table,
--    because this is a property of the product listing itself, not a
--    many-valued child record.
-- ---------------------------------------------------------------------------

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS is_branded_packaged BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS registered_brand_name VARCHAR(255);
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS unit_container_size VARCHAR(50);

COMMENT ON COLUMN products.is_branded_packaged IS
  'TRUE when this listing is put up in a unit container (packed for retail '
  'sale as a defined quantity) — the first half of the branded/unbranded GST '
  'test. Packaging alone, without a registered brand name, does not trigger '
  'the branded rate; see registered_brand_name.';
COMMENT ON COLUMN products.registered_brand_name IS
  'The registered brand name this listing is sold under, if any. Required '
  'together with is_branded_packaged = TRUE for gstService to apply a '
  'branding-dependent HSN''s rate_branded_packaged instead of '
  'rate_loose_unbranded — both conditions must hold, matching the '
  'notification wording ("unit container AND registered brand name"), not '
  'either one alone.';
COMMENT ON COLUMN products.unit_container_size IS
  'Free-text pack size (e.g. "5kg", "25kg") for display/audit purposes. NOT '
  'itself a GST rate trigger: no verified CBIC threshold ties a specific '
  'packet size to a rate change for the staple categories this platform '
  'sells. Do not branch GST logic on this column without a verified '
  'notification citation for the specific threshold.';

CREATE INDEX IF NOT EXISTS idx_products_hsn_code ON products (hsn_code)
  WHERE hsn_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_branded
  ON products (is_branded_packaged) WHERE is_branded_packaged = TRUE;

-- ---------------------------------------------------------------------------
-- 3. Prerequisite fix for real GST-invoice persistence.
--
-- gst_invoices.order_id, gst_invoice_items.product_id and
-- gst_invoice_items.order_item_id were declared INTEGER in
-- 028_gst_schema.sql (the winning definition per 999_schema_reconciliation),
-- while orders.id, products.id and order_items.id are all UUID
-- (000_base_schema.sql). Inserting a real order/product/order-item id into
-- these columns has never been possible — consistent with gstService.js's
-- generateGSTInvoice never having attempted such an INSERT (it only returned
-- a computed object, never persisted a row). Since nothing could have
-- written a real UUID into an INTEGER column, any existing row here is
-- either empty or already garbage; the guard below only converts empty
-- tables, and does nothing (leaving the mismatch for a human to resolve) if
-- it finds rows already present, rather than guessing at a lossy cast.
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM gst_invoices) = 0 THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'gst_invoices' AND column_name = 'order_id' AND data_type <> 'uuid'
    ) THEN
      ALTER TABLE gst_invoices ALTER COLUMN order_id TYPE UUID USING NULL;
    END IF;
  ELSE
    RAISE NOTICE 'gst_invoices has existing rows — skipping order_id UUID conversion; resolve manually.';
  END IF;

  IF (SELECT COUNT(*) FROM gst_invoice_items) = 0 THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'gst_invoice_items' AND column_name = 'product_id' AND data_type <> 'uuid'
    ) THEN
      ALTER TABLE gst_invoice_items ALTER COLUMN product_id TYPE UUID USING NULL;
    END IF;
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'gst_invoice_items' AND column_name = 'order_item_id' AND data_type <> 'uuid'
    ) THEN
      ALTER TABLE gst_invoice_items ALTER COLUMN order_item_id TYPE UUID USING NULL;
    END IF;
  ELSE
    RAISE NOTICE 'gst_invoice_items has existing rows — skipping UUID conversion; resolve manually.';
  END IF;
END $$;
