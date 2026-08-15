-- ============================================================================
-- AFRERA Nutrient-Value-Based Sales Database Schema
-- Revolutionary agricultural commerce: Sell by nutrient value, not just kg
-- ============================================================================

-- Add nutrient-value columns to product_listings
ALTER TABLE product_listings
ADD COLUMN IF NOT EXISTS verified_nutrient_content JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS nutrient_verification_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS nutrient_tier VARCHAR(20),
ADD COLUMN IF NOT EXISTS nutrient_badge VARCHAR(50),
ADD COLUMN IF NOT EXISTS nutrient_tier_description TEXT,
ADD COLUMN IF NOT EXISTS selling_by_nutrient BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS primary_nutrient_metric VARCHAR(20),
ADD COLUMN IF NOT EXISTS nutrient_value_price DECIMAL(15, 2),
ADD COLUMN IF NOT EXISTS nutrient_density_score DECIMAL(3, 2),
ADD COLUMN IF NOT EXISTS pricing_model VARCHAR(50) DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS nutrient_certificate_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS certification_body VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_product_listings_nutrient_tier ON product_listings(nutrient_tier);
CREATE INDEX IF NOT EXISTS idx_product_listings_selling_by_nutrient ON product_listings(selling_by_nutrient);
CREATE INDEX IF NOT EXISTS idx_product_listings_nutrient_density ON product_listings(nutrient_density_score DESC);

-- ============================================================================
-- NUTRIENT BENCHMARKS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS nutrient_benchmarks (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES categories(id),
    category_name VARCHAR(100),
    protein DECIMAL(10, 2) DEFAULT 8.0,
    iron DECIMAL(10, 2) DEFAULT 2.0,
    calcium DECIMAL(10, 2) DEFAULT 20.0,
    fiber DECIMAL(10, 2) DEFAULT 3.0,
    vitamins DECIMAL(10, 2) DEFAULT 15.0,
    benchmark_source VARCHAR(100),
    effective_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_nutrient_benchmarks_category ON nutrient_benchmarks(category_id);

-- Insert default benchmarks for common categories
INSERT INTO nutrient_benchmarks (category_id, category_name, protein, iron, calcium, fiber, vitamins, benchmark_source)
VALUES 
(1, 'Grains & Millets', 8.0, 2.0, 20.0, 3.0, 15.0, 'FSSAI Standards'),
(2, 'Spices', 10.0, 15.0, 50.0, 25.0, 30.0, 'FSSAI Standards'),
(3, 'Fruits', 1.0, 0.5, 10.0, 2.5, 20.0, 'FSSAI Standards'),
(4, 'Vegetables', 2.0, 1.0, 15.0, 2.0, 25.0, 'FSSAI Standards'),
(5, 'Dairy Products', 25.0, 0.1, 120.0, 0.0, 10.0, 'FSSAI Standards'),
(6, 'Pulses & Legumes', 20.0, 5.0, 60.0, 15.0, 5.0, 'FSSAI Standards')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- NUTRIENT CONTENT VERIFICATION TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS nutrient_content_verification (
    id VARCHAR(50) PRIMARY KEY,
    product_id VARCHAR(50) REFERENCES product_listings(id),
    farmer_id VARCHAR(50) REFERENCES users(id),
    nutrient_content JSONB NOT NULL,
    testing_method VARCHAR(100),
    sample_batch_number VARCHAR(100),
    testing_laboratory VARCHAR(200),
    test_date DATE,
    harvest_date DATE,
    location TEXT,
    farming_practices JSONB DEFAULT '{}',
    verification_status VARCHAR(20) DEFAULT 'pending',
    approved_by VARCHAR(50) REFERENCES users(id),
    approval_notes TEXT,
    approved_at TIMESTAMP,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_nutrient_verification_product ON nutrient_content_verification(product_id);
CREATE INDEX IF NOT EXISTS idx_nutrient_verification_farmer ON nutrient_content_verification(farmer_id);
CREATE INDEX IF NOT EXISTS idx_nutrient_verification_status ON nutrient_content_verification(verification_status);

-- ============================================================================
-- NUTRIENT VALUE PRICING TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS nutrient_value_pricing (
    id SERIAL PRIMARY KEY,
    product_id VARCHAR(50) REFERENCES product_listings(id),
    pricing_data JSONB NOT NULL,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_nutrient_value_pricing_product ON nutrient_value_pricing(product_id);

-- ============================================================================
-- NUTRIENT CERTIFICATES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS nutrient_certificates (
    id VARCHAR(50) PRIMARY KEY,
    product_id VARCHAR(50) REFERENCES product_listings(id),
    certificate_type VARCHAR(100),
    certifying_body VARCHAR(200),
    certification_standard VARCHAR(200),
    certification_number VARCHAR(100),
    valid_from DATE,
    valid_until DATE,
    certificate_status VARCHAR(20) DEFAULT 'active',
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_nutrient_certificates_product ON nutrient_certificates(product_id);
CREATE INDEX IF NOT EXISTS idx_nutrient_certificates_body ON nutrient_certificates(certifying_body);
CREATE INDEX IF NOT EXISTS idx_nutrient_certificates_status ON nutrient_certificates(certificate_status);

-- ============================================================================
-- NUTRIENT-BASED COMMISSIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS nutrient_based_commissions (
    id VARCHAR(50) PRIMARY KEY,
    order_id VARCHAR(50) REFERENCES orders(id),
    commission_breakdown JSONB NOT NULL,
    total_commission DECIMAL(15, 2) NOT NULL,
    total_value DECIMAL(15, 2) NOT NULL,
    average_commission_rate DECIMAL(5, 2),
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_nutrient_based_commissions_order ON nutrient_based_commissions(order_id);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE TRIGGER update_nutrient_benchmarks_updated_at BEFORE UPDATE ON nutrient_benchmarks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE nutrient_benchmarks IS 'Nutritional benchmarks for agricultural products by category';
COMMENT ON TABLE nutrient_content_verification IS 'Lab verification of nutrient content for products';
COMMENT ON TABLE nutrient_value_pricing IS 'Nutrient-value-based pricing calculations';
COMMENT ON TABLE nutrient_certificates IS 'Nutrient quality certificates for products';
COMMENT ON TABLE nutrient_based_commissions IS 'Commission structure based on nutrient quality tiers';

COMMENT ON COLUMN product_listings.selling_by_nutrient IS 'Flag indicating if product sold by nutrient value instead of weight';
COMMENT ON COLUMN product_listings.nutrient_tier IS 'Quality tier: diamond, platinum, gold, silver, bronze, standard';
COMMENT ON COLUMN product_listings.nutrient_density_score IS 'Overall nutrient density score (0-1)';

-- ============================================================================
-- GRANT PERMISSIONS (adjust as needed for your setup)
-- ============================================================================
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_app_user;
