-- Seed real, sellable `products` rows from the 142-entry
-- regional_variety_directory (itself transcribed verbatim from the
-- user-provided "North East India Variety Directory.docx").
--
-- WHY THIS EXISTS (2026-08-30)
-- The marketplace had zero seeded products anywhere in this codebase - a
-- real, confirmed gap, not a rendering bug. regional_variety_directory
-- deliberately holds no commercial data of its own (no price, no seller) -
-- see services/legacy/regionalVarietyService.js's own header. Populating
-- the marketplace from it requires a real product-level decision about
-- price, which nobody in this codebase has the authority to invent as a
-- real seller-set figure.
--
-- User's explicit decision: seed with indicative directory-estimate
-- pricing, clearly labelled - matching the exact disclaimer language their
-- own afrera_platform_v42.html reference already uses ("Product prices are
-- indicative directory estimates"). This is NOT a real seller price: no
-- `created_by` user is set, and every row is tagged 'indicative-pricing'
-- plus carries the disclaimer in its own description, so nothing downstream
-- can mistake it for a real farmer-set offer. A farmer replacing this with
-- their own real listing (see regionalVarietyService.createListingFromVariety,
-- which still requires a real seller-entered price) is the intended path
-- once real sellers onboard.
--
-- Category mapping: regional_variety_directory's 21 granular categories
-- collapse onto the 12 real product categories already seeded in
-- 000_base_schema.sql. Animal Product and Fisheries entries are excluded -
-- no honest fit among the existing categories, and meat/fish sit oddly next
-- to a plant-forward GI marketplace; left for a dedicated pass if wanted.
-- Multi-state entries (e.g. "Mizoram, Assam") take the first listed state
-- as the primary state; "All States" defaults to Assam as the largest NER
-- state and existing logistics hub.
--
-- Indicative price is a flat per-category tier (₹/kg-equivalent retail),
-- not researched per product - real market prices vary enormously even
-- within one category (Bhut Jolokia vs. black pepper are both "Spice").
-- This is a directory estimate for browsing, not a quote.

INSERT INTO products (
  name, slug, category_id, state_id, unit_id, description, usp,
  gi_status, gi_certificate_number, base_price, tags, is_active, variety_directory_id
)
SELECT
  rvd.product_name,
  lower(regexp_replace(regexp_replace(rvd.product_name, '[^a-zA-Z0-9]+', '-', 'g'), '(^-|-$)', '', 'g'))
    || '-' || substr(md5(rvd.id::text), 1, 6),
  c.id,
  s.id,
  u.id,
  concat_ws(' ', rvd.specialty_usp,
    '— Indicative directory estimate, not a real seller-set price. From the North East India Variety Directory master reference.'),
  rvd.commercial_potential,
  (rvd.gi_status = 'registered'),
  rvd.gi_application_no,
  CASE rvd.category
    WHEN 'Spice'          THEN 550
    WHEN 'Honey'           THEN 480
    WHEN 'Oilseed'         THEN 420
    WHEN 'Nut'             THEN 420
    WHEN 'Pulse'           THEN 420
    WHEN 'Forest Edible'   THEN 380
    WHEN 'Tea/Coffee'      THEN 320
    WHEN 'Fermented Food'  THEN 260
    WHEN 'Mushroom'        THEN 220
    WHEN 'Bamboo'          THEN 180
    WHEN 'Fruit'           THEN 140
    WHEN 'Citrus'          THEN 140
    WHEN 'Exotic'          THEN 140
    WHEN 'Tropical'        THEN 140
    WHEN 'Wild'            THEN 140
    WHEN 'Grain'           THEN 90
    WHEN 'Leafy Vegetable' THEN 60
    WHEN 'Root Vegetable'  THEN 60
    WHEN 'Cruciferous'     THEN 60
    WHEN 'Beans'           THEN 60
    WHEN 'Cucurbits'       THEN 60
    ELSE 100
  END,
  ARRAY['indicative-pricing', 'ne-variety-directory'],
  true,
  rvd.id
FROM regional_variety_directory rvd
JOIN categories c ON c.name = CASE rvd.category
    WHEN 'Citrus'          THEN 'Fruits'
    WHEN 'Exotic'          THEN 'Fruits'
    WHEN 'Tropical'        THEN 'Fruits'
    WHEN 'Wild'            THEN 'Fruits'
    WHEN 'Fruit'           THEN 'Fruits'
    WHEN 'Leafy Vegetable' THEN 'Vegetables & Greens'
    WHEN 'Root Vegetable'  THEN 'Vegetables & Greens'
    WHEN 'Cruciferous'     THEN 'Vegetables & Greens'
    WHEN 'Beans'           THEN 'Vegetables & Greens'
    WHEN 'Cucurbits'       THEN 'Vegetables & Greens'
    WHEN 'Mushroom'        THEN 'Mushrooms'
    WHEN 'Spice'           THEN 'Spices'
    WHEN 'Fermented Food'  THEN 'Fermented & Pickles'
    WHEN 'Bamboo'          THEN 'Bamboo Foods'
    WHEN 'Honey'           THEN 'Honey & Sweeteners'
    WHEN 'Grain'           THEN 'Grains & Millets'
    WHEN 'Tea/Coffee'      THEN 'Tea & Beverages'
    WHEN 'Pulse'           THEN 'Oils, Nuts & Seeds'
    WHEN 'Oilseed'         THEN 'Oils, Nuts & Seeds'
    WHEN 'Nut'             THEN 'Oils, Nuts & Seeds'
    WHEN 'Forest Edible'   THEN 'Herbs & Wellness'
    ELSE NULL
  END
JOIN states s ON s.name = trim(split_part(rvd.primary_states, ',', 1))
  OR (rvd.primary_states = 'All States' AND s.name = 'Assam')
JOIN units u ON u.symbol = 'KG'
WHERE rvd.category NOT IN ('Animal Product', 'Fisheries')
  AND NOT EXISTS (
    SELECT 1 FROM products p WHERE p.variety_directory_id = rvd.id
  )
ON CONFLICT (slug) DO NOTHING;
