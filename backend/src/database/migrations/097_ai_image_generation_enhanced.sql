-- Enhanced AI image-generation persistence and marketplace-quality tracking.
-- Reconciled from MAIN; deployment-specific grants remain environment-managed.

CREATE TABLE IF NOT EXISTS ai_generated_images (
  id SERIAL PRIMARY KEY,
  image_id VARCHAR(255) UNIQUE NOT NULL,
  product_id INTEGER REFERENCES products(id),
  farmer_id INTEGER REFERENCES farmers(id),
  prompt_text TEXT,
  image_url VARCHAR(500),
  cdn_url VARCHAR(500),
  quality_score DECIMAL(5, 2),
  quality_grade VARCHAR(10),
  region VARCHAR(50),
  language VARCHAR(10),
  generation_time_ms INTEGER,
  is_fallback BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_images_product_id ON ai_generated_images(product_id);
CREATE INDEX IF NOT EXISTS idx_images_farmer_id ON ai_generated_images(farmer_id);
CREATE INDEX IF NOT EXISTS idx_images_language ON ai_generated_images(language);
CREATE INDEX IF NOT EXISTS idx_images_region ON ai_generated_images(region);
CREATE INDEX IF NOT EXISTS idx_images_quality_score ON ai_generated_images(quality_score);

CREATE TABLE IF NOT EXISTS ai_image_metadata (
  id SERIAL PRIMARY KEY,
  image_id VARCHAR(255) UNIQUE NOT NULL REFERENCES ai_generated_images(image_id) ON DELETE CASCADE,
  product_name VARCHAR(255), category VARCHAR(100), color_profile VARCHAR(255), size_range VARCHAR(100),
  certified BOOLEAN, gi_tag VARCHAR(255), seo_title VARCHAR(255), seo_description TEXT, seo_keywords TEXT,
  prompt_quality_score DECIMAL(5, 2), product_accuracy_score DECIMAL(5, 2), image_clarity_score DECIMAL(5, 2),
  marketplace_readiness_score DECIMAL(5, 2), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_metadata_image_id ON ai_image_metadata(image_id);
CREATE INDEX IF NOT EXISTS idx_metadata_category ON ai_image_metadata(category);

CREATE TABLE IF NOT EXISTS product_listings (
  id SERIAL PRIMARY KEY,
  listing_id VARCHAR(255) UNIQUE NOT NULL,
  product_id INTEGER REFERENCES products(id),
  primary_image_id VARCHAR(255) REFERENCES ai_generated_images(image_id),
  category VARCHAR(100), quality_score DECIMAL(5, 2), region VARCHAR(50), language VARCHAR(10),
  visibility_marketplace BOOLEAN DEFAULT TRUE, visibility_website BOOLEAN DEFAULT TRUE, visibility_mobile BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_listings_product_id ON product_listings(product_id);
CREATE INDEX IF NOT EXISTS idx_listings_quality_score ON product_listings(quality_score);
CREATE INDEX IF NOT EXISTS idx_listings_region ON product_listings(region);

CREATE TABLE IF NOT EXISTS listing_marketplace_optimization (
  id SERIAL PRIMARY KEY,
  listing_id VARCHAR(255) NOT NULL REFERENCES product_listings(listing_id) ON DELETE CASCADE,
  marketplace_name VARCHAR(100), primary_image_size VARCHAR(50), compression_quality INTEGER,
  image_format VARCHAR(10), optimized_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_optimization_listing ON listing_marketplace_optimization(listing_id);
CREATE INDEX IF NOT EXISTS idx_optimization_marketplace ON listing_marketplace_optimization(marketplace_name);

CREATE TABLE IF NOT EXISTS farmer_image_portfolios (
  id SERIAL PRIMARY KEY,
  portfolio_id VARCHAR(255) UNIQUE NOT NULL,
  farmer_id INTEGER NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  farmer_name VARCHAR(255), region VARCHAR(50), languages TEXT,
  total_images INTEGER DEFAULT 0, approved_images INTEGER DEFAULT 0, pending_images INTEGER DEFAULT 0, rejected_images INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_portfolio_farmer_id ON farmer_image_portfolios(farmer_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_region ON farmer_image_portfolios(region);

CREATE TABLE IF NOT EXISTS farmer_products (
  id SERIAL PRIMARY KEY,
  product_id VARCHAR(255) UNIQUE NOT NULL,
  portfolio_id VARCHAR(255) NOT NULL REFERENCES farmer_image_portfolios(portfolio_id) ON DELETE CASCADE,
  farmer_id INTEGER NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  product_name VARCHAR(255), category VARCHAR(100), description TEXT, quantity INTEGER, price_per_unit DECIMAL(10, 2),
  status VARCHAR(50), marketplace_listing_id VARCHAR(255), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, published_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_farmer_products_farmer_id ON farmer_products(farmer_id);
CREATE INDEX IF NOT EXISTS idx_farmer_products_status ON farmer_products(status);
CREATE INDEX IF NOT EXISTS idx_farmer_products_listing ON farmer_products(marketplace_listing_id);

CREATE TABLE IF NOT EXISTS farmer_product_images (
  id SERIAL PRIMARY KEY,
  farmer_product_id VARCHAR(255) NOT NULL REFERENCES farmer_products(product_id) ON DELETE CASCADE,
  image_id VARCHAR(255) NOT NULL REFERENCES ai_generated_images(image_id) ON DELETE CASCADE,
  language VARCHAR(10), region VARCHAR(50), quality_score DECIMAL(5, 2), status VARCHAR(50),
  approval_notes TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, approved_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_farmer_images_product ON farmer_product_images(farmer_product_id);
CREATE INDEX IF NOT EXISTS idx_farmer_images_status ON farmer_product_images(status);
CREATE INDEX IF NOT EXISTS idx_farmer_images_language ON farmer_product_images(language);

CREATE TABLE IF NOT EXISTS listing_performance_metrics (
  id SERIAL PRIMARY KEY,
  listing_id VARCHAR(255) NOT NULL REFERENCES product_listings(listing_id) ON DELETE CASCADE,
  views INTEGER DEFAULT 0, clicks INTEGER DEFAULT 0, conversions INTEGER DEFAULT 0, cart_adds INTEGER DEFAULT 0,
  avg_time_on_listing INTEGER DEFAULT 0, image_downloads INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5, 2), cart_conversion_rate DECIMAL(5, 2), last_tracked TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_metrics_listing ON listing_performance_metrics(listing_id);

CREATE TABLE IF NOT EXISTS image_quality_feedback (
  id SERIAL PRIMARY KEY,
  image_id VARCHAR(255) NOT NULL REFERENCES ai_generated_images(image_id) ON DELETE CASCADE,
  feedback_text TEXT, rating DECIMAL(2, 1), suggestions TEXT, improvement_areas TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_feedback_image ON image_quality_feedback(image_id);

CREATE TABLE IF NOT EXISTS sku_images (
  id SERIAL PRIMARY KEY,
  sku VARCHAR(255) UNIQUE NOT NULL,
  product_id INTEGER REFERENCES products(id), image_id VARCHAR(255) REFERENCES ai_generated_images(image_id),
  variant_name VARCHAR(255), quality_score DECIMAL(5, 2), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_sku_images_product ON sku_images(product_id);
CREATE INDEX IF NOT EXISTS idx_sku_images_sku ON sku_images(sku);

CREATE TABLE IF NOT EXISTS image_generation_batch_logs (
  id SERIAL PRIMARY KEY,
  batch_id VARCHAR(255) UNIQUE NOT NULL,
  total_count INTEGER, successful_count INTEGER, fallback_count INTEGER,
  average_quality_score DECIMAL(5, 2), processing_time_ms INTEGER, region VARCHAR(50), language VARCHAR(10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_batch_logs_created ON image_generation_batch_logs(created_at DESC);

ALTER TABLE products ADD COLUMN IF NOT EXISTS primary_image_id VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS quality_score DECIMAL(5, 2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS region VARCHAR(50);
ALTER TABLE products ADD COLUMN IF NOT EXISTS language VARCHAR(10);
