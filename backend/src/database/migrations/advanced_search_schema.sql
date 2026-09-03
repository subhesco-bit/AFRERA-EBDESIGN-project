-- Advanced Search Schema
-- Enhanced search capabilities with filters, indexing, and analytics

-- Add search vector column to products if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'search_vector'
  ) THEN
    ALTER TABLE products ADD COLUMN search_vector tsvector;
    
    -- Create GIN index for full-text search
    CREATE INDEX idx_products_search_vector ON products USING GIN(search_vector);
    
    -- Update search vector for existing products
    UPDATE products 
    SET search_vector = to_tsvector('english', 
      COALESCE(name, '') || ' ' || 
      COALESCE(description, '') || ' ' || 
      COALESCE(category, '') || ' ' || 
      COALESCE(location, '')
    );
    
    -- Create trigger to auto-update search vector
    CREATE OR REPLACE FUNCTION products_search_vector_update() RETURNS trigger AS $$
    BEGIN
      NEW.search_vector := to_tsvector('english', 
        COALESCE(NEW.name, '') || ' ' || 
        COALESCE(NEW.description, '') || ' ' || 
        COALESCE(NEW.category, '') || ' ' || 
        COALESCE(NEW.location, '')
      );
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    
    CREATE TRIGGER products_search_vector_trigger
      BEFORE INSERT OR UPDATE ON products
      FOR EACH ROW EXECUTE FUNCTION products_search_vector_update();
  END IF;
END $$;

-- Search logs table for analytics
CREATE TABLE IF NOT EXISTS search_logs (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255),
  search_term TEXT NOT NULL,
  results_count INTEGER DEFAULT 0,
  filters JSONB,
  searched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address INET,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_search_logs_user_id ON search_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_search_logs_searched_at ON search_logs(searched_at);
CREATE INDEX IF NOT EXISTS idx_search_logs_search_term ON search_logs USING GIN(to_tsvector('english', search_term));

-- Search filters cache table
CREATE TABLE IF NOT EXISTS search_filters_cache (
  id VARCHAR(255) PRIMARY KEY,
  filter_type VARCHAR(100) NOT NULL,
  filter_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_search_filters_cache_type ON search_filters_cache(filter_type);
CREATE INDEX IF NOT EXISTS idx_search_filters_cache_expires ON search_filters_cache(expires_at);

-- Comment for advanced search tables
COMMENT ON TABLE search_logs IS 'Logs all search queries for analytics and improvement';
COMMENT ON TABLE search_filters_cache IS 'Caches frequently used filter combinations';

-- Insert sample popular search terms for analytics
INSERT INTO search_logs (id, user_id, search_term, results_count, filters, searched_at)
SELECT 
  'log_' || md5(random()::text || clock_timestamp()::text),
  NULL,
  term,
  FLOOR(RANDOM() * 50 + 10)::INTEGER,
  '{}'::jsonb,
  NOW() - (RANDOM() * INTERVAL '30 days')
FROM (
  SELECT 'organic rice' as term UNION ALL
  SELECT 'fresh vegetables' UNION ALL
  SELECT 'dairy products' UNION ALL
  SELECT 'local honey' UNION ALL
  SELECT 'organic wheat' UNION ALL
  SELECT 'farm fresh eggs' UNION ALL
  SELECT 'seasonal fruits' UNION ALL
  SELECT 'organic pulses' UNION ALL
  SELECT 'natural fertilizers' UNION ALL
  SELECT 'sustainable farming'
) terms
CROSS JOIN generate_series(1, 50);