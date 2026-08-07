-- Indigenous Knowledge Platform Database Schema
-- CAP-209 to CAP-216: Traditional Recipes, Traditional Medicine, Indigenous Farming, 
-- Oral History, Tribal Knowledge, Documentation System, Protection System, IP Management

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TRADITIONAL RECIPES DATABASE (CAP-209)
-- ============================================================================

CREATE TABLE IF NOT EXISTS traditional_recipes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    indigenous_community VARCHAR(255),
    region VARCHAR(255),
    ingredients JSONB,
    preparation_method TEXT,
    cultural_significance TEXT,
    seasonal_relevance JSONB,
    nutritional_info JSONB,
    media_files JSONB,
    contributor_id INTEGER,
    verified_by INTEGER,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_traditional_recipes_community ON traditional_recipes(indigenous_community);
CREATE INDEX idx_traditional_recipes_region ON traditional_recipes(region);
CREATE INDEX idx_traditional_recipes_seasonal ON traditional_recipes USING GIN(seasonal_relevance);

-- ============================================================================
-- TRADITIONAL MEDICINE DATABASE (CAP-210)
-- ============================================================================

CREATE TABLE IF NOT EXISTS traditional_medicine (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    indigenous_community VARCHAR(255),
    region VARCHAR(255),
    medicinal_plants JSONB,
    preparation_method TEXT,
    traditional_uses JSONB,
    dosage TEXT,
    contraindications TEXT,
    scientific_validation JSONB,
    practitioner_notes TEXT,
    media_files JSONB,
    contributor_id INTEGER,
    verified_by INTEGER,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_traditional_medicine_community ON traditional_medicine(indigenous_community);
CREATE INDEX idx_traditional_medicine_region ON traditional_medicine(region);

-- ============================================================================
-- INDIGENOUS FARMING DATABASE (CAP-211)
-- ============================================================================

CREATE TABLE IF NOT EXISTS indigenous_farming_practices (
    id SERIAL PRIMARY KEY,
    practice_name VARCHAR(255) NOT NULL,
    indigenous_community VARCHAR(255),
    region VARCHAR(255),
    crops JSONB,
    techniques JSONB,
    seasonal_calendar JSONB,
    soil_management TEXT,
    water_management TEXT,
    pest_management TEXT,
    climate_adaptation TEXT,
    cultural_context TEXT,
    modern_applications JSONB,
    media_files JSONB,
    contributor_id INTEGER,
    verified_by INTEGER,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_indigenous_farming_community ON indigenous_farming_practices(indigenous_community);
CREATE INDEX idx_indigenous_farming_region ON indigenous_farming_practices(region);

-- ============================================================================
-- ORAL HISTORY DATABASE (CAP-212)
-- ============================================================================

CREATE TABLE IF NOT EXISTS oral_history (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    indigenous_community VARCHAR(255),
    region VARCHAR(255),
    narrator VARCHAR(255),
    narrator_age INTEGER,
    narrator_role VARCHAR(255),
    recording_date DATE,
    language VARCHAR(10),
    transcript TEXT,
    summary TEXT,
    topics JSONB,
    historical_period VARCHAR(100),
    cultural_significance TEXT,
    audio_file TEXT,
    video_file TEXT,
    contributor_id INTEGER,
    verified_by INTEGER,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_oral_history_community ON oral_history(indigenous_community);
CREATE INDEX idx_oral_history_region ON oral_history(region);
CREATE INDEX idx_oral_history_topics ON oral_history USING GIN(topics);

-- ============================================================================
-- TRIBAL KNOWLEDGE DATABASE (CAP-213)
-- ============================================================================

CREATE TABLE IF NOT EXISTS tribal_knowledge (
    id SERIAL PRIMARY KEY,
    knowledge_type VARCHAR(100) NOT NULL,
    indigenous_community VARCHAR(255),
    region VARCHAR(255),
    title VARCHAR(255),
    description TEXT,
    knowledge_holders JSONB,
    transmission_method VARCHAR(100),
    restrictions TEXT,
    applications JSONB,
    cross_references JSONB,
    media_files JSONB,
    contributor_id INTEGER,
    verified_by INTEGER,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tribal_knowledge_type ON tribal_knowledge(knowledge_type);
CREATE INDEX idx_tribal_knowledge_community ON tribal_knowledge(indigenous_community);

-- ============================================================================
-- DOCUMENTATION SYSTEM (CAP-214)
-- ============================================================================

CREATE TABLE IF NOT EXISTS indigenous_documentation (
    id SERIAL PRIMARY KEY,
    knowledge_id INTEGER,
    knowledge_type VARCHAR(100),
    documentation_type VARCHAR(100),
    document_format VARCHAR(50),
    content TEXT,
    metadata JSONB,
    location TEXT,
    access_level VARCHAR(50),
    contributors JSONB,
    reviewed_by INTEGER,
    approved_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_indigenous_documentation_knowledge ON indigenous_documentation(knowledge_id);
CREATE INDEX idx_indigenous_documentation_type ON indigenous_documentation(documentation_type);

-- ============================================================================
-- PROTECTION SYSTEM (CAP-215)
-- ============================================================================

CREATE TABLE IF NOT EXISTS indigenous_protection (
    id SERIAL PRIMARY KEY,
    knowledge_id INTEGER,
    knowledge_type VARCHAR(100),
    protection_type VARCHAR(100),
    reason TEXT,
    requested_by INTEGER,
    community_consent BOOLEAN,
    legal_basis TEXT,
    scope TEXT,
    duration VARCHAR(100),
    conditions JSONB,
    status VARCHAR(50) DEFAULT 'pending',
    reviewed_by INTEGER,
    review_notes TEXT,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_indigenous_protection_knowledge ON indigenous_protection(knowledge_id);
CREATE INDEX idx_indigenous_protection_status ON indigenous_protection(status);

-- ============================================================================
-- IP MANAGEMENT (CAP-216)
-- ============================================================================

CREATE TABLE IF NOT EXISTS indigenous_ip_management (
    id SERIAL PRIMARY KEY,
    knowledge_id INTEGER,
    knowledge_type VARCHAR(100),
    ip_type VARCHAR(100),
    registration_type VARCHAR(100),
    indigenous_community VARCHAR(255),
    ownership_structure JSONB,
    commercial_rights JSONB,
    licensing_terms JSONB,
    benefit_sharing JSONB,
    prior_informed_consent BOOLEAN,
    legal_protection_status VARCHAR(50),
    expiry_date DATE,
    jurisdiction VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_indigenous_ip_knowledge ON indigenous_ip_management(knowledge_id);
CREATE INDEX idx_indigenous_ip_community ON indigenous_ip_management(indigenous_community);
CREATE INDEX idx_indigenous_ip_status ON indigenous_ip_management(legal_protection_status);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER update_traditional_recipes_updated_at BEFORE UPDATE ON traditional_recipes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_traditional_medicine_updated_at BEFORE UPDATE ON traditional_medicine
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_indigenous_farming_practices_updated_at BEFORE UPDATE ON indigenous_farming_practices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_oral_history_updated_at BEFORE UPDATE ON oral_history
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tribal_knowledge_updated_at BEFORE UPDATE ON tribal_knowledge
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_indigenous_documentation_updated_at BEFORE UPDATE ON indigenous_documentation
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_indigenous_protection_updated_at BEFORE UPDATE ON indigenous_protection
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_indigenous_ip_management_updated_at BEFORE UPDATE ON indigenous_ip_management
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
