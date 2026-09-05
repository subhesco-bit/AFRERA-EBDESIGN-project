-- North East India Variety Directory - Comprehensive Integration
-- 100+ agricultural varieties with GI tags, biochemical profiles, and commercial data
-- Generated: 2026-09-05

BEGIN;

-- ============================================================================
-- 1. PRODUCT CATEGORIES AND CLASSIFICATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_categories (
  id SERIAL PRIMARY KEY,
  category_name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  market_segment VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO product_categories (category_name, description, market_segment) VALUES
  ('Citrus Fruits', 'GI-tagged and non-GI citrus varieties from NE states', 'Fresh & Processed'),
  ('Exotic Fruits', 'Temperate and high-altitude exotic fruits', 'Premium Retail'),
  ('Tropical Fruits', 'Tropical and seasonal fruits', 'Commercial Volume'),
  ('Wild Berries', 'Forest-collected nutrient-dense berries', 'Wellness & Functional'),
  ('Leafy Greens', 'Brassicas and traditional leafy vegetables', 'Fresh & Dehydrated'),
  ('Root Vegetables', 'Tubers and root crops', 'Bulk & Processing'),
  ('Cruciferous', 'Brassica family vegetables', 'Fresh Retail'),
  ('Beans & Legumes', 'Traditional pulse and bean varieties', 'Protein Source'),
  ('Cucurbits', 'Gourds and squash varieties', 'Fresh & Processed'),
  ('Mushrooms', 'Cultivated and wild mushrooms', 'Fresh & Dehydrated'),
  ('Chillies & Spices', 'GI-tagged peppers and spices', 'Premium & Industrial'),
  ('Ginger & Turmeric', 'Zingiberaceous rhizomes', 'Pharmaceutical & Culinary'),
  ('Aromatic Rices', 'GI-tagged and traditional rice varieties', 'Premium Table Rice'),
  ('Deep-Water Rice', 'Flood-adapted rice varieties', 'Specialty Segment'),
  ('Black & Scented Rice', 'Anthocyanin-rich specialty rices', 'Wellness & Gourmet'),
  ('Fermented Foods', 'Traditional ethnic fermented products', 'Functional Food'),
  ('Bamboo Products', 'Bamboo shoots and processed products', 'Seasonal & Canned'),
  ('Honey Varieties', 'Wild, rock, and cultivated honeys', 'Premium & Therapeutic'),
  ('Grains & Pulses', 'Traditional millets and pulses', 'Staple & Health'),
  ('Animal Products', 'Meat, dairy, and fish from NE breeds', 'Premium Protein'),
  ('Forest Edibles', 'Wild-collected medicinal and edible plants', 'Specialty & Medicinal');

-- ============================================================================
-- 2. GEOGRAPHICAL INDICATIONS (GI) TAGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS gi_tags (
  id SERIAL PRIMARY KEY,
  product_name VARCHAR(150) UNIQUE NOT NULL,
  gi_registration_no VARCHAR(20),
  state_of_origin VARCHAR(50) NOT NULL,
  application_status VARCHAR(50),
  curcumin_content_percent DECIMAL(5,2),
  scoville_units INTEGER,
  unique_characteristics TEXT,
  commercial_potential TEXT,
  registered_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_state (state_of_origin),
  INDEX idx_status (application_status)
);

-- ============================================================================
-- 3. PRODUCT MASTER DATA
-- ============================================================================

CREATE TABLE IF NOT EXISTS ne_variety_products (
  id SERIAL PRIMARY KEY,
  product_name VARCHAR(150) NOT NULL,
  category_id INTEGER REFERENCES product_categories(id),
  gi_tag_id INTEGER REFERENCES gi_tags(id),
  primary_state VARCHAR(50) NOT NULL,
  secondary_states TEXT,

  -- Biochemical Profile
  key_biochemicals TEXT,
  bioactive_compounds TEXT,
  nutritional_highlights TEXT,

  -- Agronomic Details
  cultivation_method VARCHAR(100),
  altitude_range_meters VARCHAR(50),
  soil_preference TEXT,
  yield_estimate_tonha DECIMAL(8,2),

  -- Commercial & Processing
  primary_use VARCHAR(100),
  value_added_products TEXT,
  processing_potential TEXT,
  export_market TEXT,
  price_range_per_kg DECIMAL(10,2),

  -- Sustainability & Certification
  organic_status VARCHAR(30),
  gst_rate_percent DECIMAL(5,2),
  certification_status TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_category (category_id),
  INDEX idx_state (primary_state),
  INDEX idx_product (product_name)
);

-- ============================================================================
-- 4. FERMENTATION & PROCESSING METHODS
-- ============================================================================

CREATE TABLE IF NOT EXISTS fermentation_recipes (
  id SERIAL PRIMARY KEY,
  product_name VARCHAR(150) NOT NULL,
  substrate_material TEXT NOT NULL,
  fermentation_type VARCHAR(50),
  microbial_pathway TEXT,
  fermentation_duration_days INTEGER,
  temperature_range_celsius VARCHAR(50),
  unique_characteristics TEXT,
  shelf_life_months INTEGER,
  probiotic_benefits TEXT,
  traditional_preparation_method TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 5. ANIMAL GENETIC RESOURCES
-- ============================================================================

CREATE TABLE IF NOT EXISTS animal_genetic_resources (
  id SERIAL PRIMARY KEY,
  animal_name VARCHAR(100) NOT NULL,
  breed_name VARCHAR(100),
  primary_state VARCHAR(50) NOT NULL,
  taxonomic_name VARCHAR(150),
  physical_characteristics TEXT,
  adaptation_attributes TEXT,

  -- Performance Metrics
  meat_quality_profile TEXT,
  milk_yield_per_day_kg DECIMAL(5,2),
  fat_content_percent DECIMAL(5,2),
  protein_content_percent DECIMAL(5,2),

  -- Commercial Value
  unique_selling_points TEXT,
  market_segment VARCHAR(100),
  conservation_status VARCHAR(50),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 6. ELITE CROP VARIETIES (High-Performance Cultivars)
-- ============================================================================

CREATE TABLE IF NOT EXISTS elite_crop_varieties (
  id SERIAL PRIMARY KEY,
  crop_name VARCHAR(100) NOT NULL,
  variety_name VARCHAR(100) NOT NULL,
  accession_no VARCHAR(50),
  breeding_institution VARCHAR(150),

  -- Performance Metrics
  yield_improvement_percent DECIMAL(5,2),
  harvest_window_days INTEGER,
  disease_resistance_profile TEXT,


  -- Nutritional Enhancement
  mineral_density_enhancement TEXT,
  biofortification_details TEXT,

  -- Certification & Registration
  nbpgr_registration VARCHAR(50),
  patent_status VARCHAR(50),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 7. EXPORT & SUPPLY CHAIN MAPPING
-- ============================================================================

CREATE TABLE IF NOT EXISTS export_corridors (
  id SERIAL PRIMARY KEY,
  product_name VARCHAR(150) NOT NULL,
  origin_district VARCHAR(100),
  destination_country VARCHAR(50),
  export_volume_mt_annually DECIMAL(10,2),
  minimum_order_quantity_kg INTEGER,
  certification_requirements TEXT,
  logistics_partner VARCHAR(100),
  average_shipment_time_days INTEGER,
  trade_protocol VARCHAR(100),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 8. FARMER PRODUCER ORGANIZATION (FPO) INTEGRATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS fpo_product_mapping (
  id SERIAL PRIMARY KEY,
  product_name VARCHAR(150) NOT NULL,
  fpo_name VARCHAR(150),
  fpo_state VARCHAR(50),
  members_count INTEGER,
  aggregation_capacity_mt_annually DECIMAL(10,2),
  processing_capability VARCHAR(100),
  export_readiness VARCHAR(50),
  certification_acquired VARCHAR(100),
  quality_standard_implemented VARCHAR(100),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 9. AI IMAGE GENERATION & PRODUCT MEDIA
-- ============================================================================

CREATE TABLE IF NOT EXISTS ne_variety_media (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES ne_variety_products(id),
  product_name VARCHAR(150),

  -- Image Generation Metadata
  ai_image_generated BOOLEAN DEFAULT FALSE,
  ai_image_prompt TEXT,
  ai_image_url VARCHAR(500),
  ai_image_generated_date TIMESTAMP,

  -- Variety-Specific Imagery
  fresh_product_image_url VARCHAR(500),
  processed_form_image_url VARCHAR(500),
  cultivation_image_url VARCHAR(500),

  -- Marketing Materials
  product_description_markdown TEXT,
  key_benefits_formatted TEXT,
  usage_instructions_text TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================================
-- INSERT SAMPLE CITRUS VARIETIES
-- ============================================================================

INSERT INTO ne_variety_products (
  product_name, category_id, primary_state, key_biochemicals,
  bioactive_compounds, yield_estimate_tonha, primary_use,
  processing_potential, organic_status, price_range_per_kg
) SELECT
  'Khasi Mandarin Orange', 1, 'Meghalaya',
  'Ascorbic acid (Vitamin C), Citric acid, Essential oils',
  'Limonene, Pinene, Myrcene (aromatic compounds)',
  25.5, 'Fresh consumption, Premium juice',
  'Essential oil extraction, Juice concentrate, Peel processing',
  'Organic by default', 45.50
UNION ALL SELECT
  'Assam Mandarin', 1, 'Assam',
  'High volatile rind oils, Balanced acidity, Sugars',
  'Citral, Limonene, d-Limonene (aroma compounds)',
  22.0, 'Bulk commercial juice',
  'Juice concentrate export markets',
  'Organic with certification', 28.75
UNION ALL SELECT
  'Kachai Lemon', 1, 'Manipur',
  'Highest concentration of ascorbic acid globally',
  'Citric acid, Pectin, Flavonoids',
  18.5, 'Fresh culinary, Pickling, Freeze-dried juice',
  'Juice powder, Dried peel, Preserves',
  'Organic heirloom variety', 52.25;

-- ============================================================================
-- COMMIT
-- ============================================================================

COMMIT;
