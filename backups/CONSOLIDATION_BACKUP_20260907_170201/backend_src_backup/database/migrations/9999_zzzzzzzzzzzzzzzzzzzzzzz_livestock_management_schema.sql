-- Schema for the 8 Livestock-domain CRUD resources backing
-- backend/src/services/livestockManagementService.js. Columns match the
-- ResourceManager `fields` already shipped on
-- frontend/src/pages/LivestockManagementPage.jsx - taken directly from that
-- UI, not invented. M127 Animal Health's real animal_health_examinations
-- table (and treatments/outbreaks/quarantines) is untouched here.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS cattle_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag_number VARCHAR(100) NOT NULL,
    breed VARCHAR(50) DEFAULT 'Local/Indigenous',
    purpose VARCHAR(20) DEFAULT 'Dairy',
    owner_name VARCHAR(200) NOT NULL,
    date_of_birth DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_cattle_registry_tag ON cattle_registry(tag_number);

CREATE TABLE IF NOT EXISTS poultry_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_code VARCHAR(100) NOT NULL,
    poultry_type VARCHAR(30) DEFAULT 'Broiler',
    bird_count INTEGER,
    owner_name VARCHAR(200) NOT NULL,
    hatch_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS goat_farming_animals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag_number VARCHAR(100) NOT NULL,
    breed VARCHAR(50) DEFAULT 'Local/Indigenous',
    owner_name VARCHAR(200) NOT NULL,
    date_of_birth DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sheep_farming_animals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag_number VARCHAR(100) NOT NULL,
    breed VARCHAR(50) DEFAULT 'Local/Indigenous',
    owner_name VARCHAR(200) NOT NULL,
    date_of_birth DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pig_farming_animals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag_number VARCHAR(100) NOT NULL,
    breed VARCHAR(50) DEFAULT 'Local/Indigenous',
    owner_name VARCHAR(200) NOT NULL,
    date_of_birth DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS livestock_feed_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feed_type VARCHAR(30) NOT NULL DEFAULT 'Concentrate',
    supplier VARCHAR(200),
    quantity_kg NUMERIC(12,2),
    cost NUMERIC(12,2),
    purchase_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS breeding_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dam_tag VARCHAR(100) NOT NULL,
    sire_tag VARCHAR(100),
    method VARCHAR(30) DEFAULT 'Natural',
    breeding_date DATE,
    expected_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS livestock_analytics_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(50) DEFAULT 'Herd Growth',
    period VARCHAR(30) NOT NULL,
    value NUMERIC(14,2),
    unit VARCHAR(30),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);
