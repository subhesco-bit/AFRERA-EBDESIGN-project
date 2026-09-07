-- Regional Variety Directory — core master-data reference layer.
--
-- Source: user-provided "Commercial and Agronomic Master Database of the
-- Edible and Agricultural Biodiversity of North-East India" (2026-08-15).
-- 170+ real, citation-backed crop/livestock/fisheries varieties across NE
-- India, with GI status, botanical/biochemical detail, and commercial notes.
--
-- DESIGN DECISION: this is NOT the `products` table. `products` represents
-- real seller-owned SKUs with a real, farmer-set base_price — we do not
-- have real prices/inventory for these 170 varieties from real farmers, so
-- inventing them there would be exactly the kind of fabricated business
-- data this session has spent hours removing elsewhere. This table is
-- reference/master data (Layer 1 "core" in the ERP taxonomy sense): a
-- browsable directory of known-valuable regional varieties that a farmer
-- can use to pre-fill a REAL product listing (via the /from-variety
-- endpoint — see regionalVarietyService.js), and that customers can browse
-- for education/discovery, clearly separate from buyable inventory.

CREATE TABLE IF NOT EXISTS regional_variety_directory (
  id SERIAL PRIMARY KEY,
  category VARCHAR(50) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  scientific_name VARCHAR(255),
  primary_states TEXT NOT NULL,
  gi_status VARCHAR(50) NOT NULL DEFAULT 'non_gi' CHECK (gi_status IN ('registered', 'pending', 'non_gi')),
  gi_application_no VARCHAR(50),
  variety_detail TEXT,
  specialty_usp TEXT,
  commercial_potential TEXT,
  source_document VARCHAR(255) NOT NULL DEFAULT 'North East India Variety Directory.docx',
  -- Set by productMediaAIService when a farmer requests reference imagery
  -- for a variety (honest adapter — see products.image_generation_status
  -- in 9999_zz_product_media_ai_schema.sql for the same pattern).
  image_generation_status VARCHAR(30) DEFAULT 'not_requested',
  image_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(category, product_name)
);

CREATE INDEX IF NOT EXISTS idx_variety_directory_category ON regional_variety_directory(category);
CREATE INDEX IF NOT EXISTS idx_variety_directory_gi_status ON regional_variety_directory(gi_status);
CREATE INDEX IF NOT EXISTS idx_variety_directory_name ON regional_variety_directory(product_name);

-- Links a real product listing back to the variety it was created from, so
-- "browse the directory -> create a real listing" is traceable, not a
-- silent copy. Nullable: most products will never reference this (only
-- ones explicitly created via the "create listing from variety" flow).
ALTER TABLE products ADD COLUMN IF NOT EXISTS variety_directory_id INTEGER REFERENCES regional_variety_directory(id);
