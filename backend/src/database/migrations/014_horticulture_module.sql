-- Migration: Horticulture Module (M141-M150)
-- Created: August 12, 2026
-- Description: Create tables for orchard management and horticulture operations

-- Orchards Table (M141)
CREATE TABLE IF NOT EXISTS orchards (
    id SERIAL PRIMARY KEY,
    farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    area DECIMAL(10, 2), -- in hectares
    orchard_type VARCHAR(50) NOT NULL, -- 'FRUIT', 'NUT', 'MIXED', 'OTHER'
    tree_count INTEGER,
    planting_date DATE,
    varieties JSONB DEFAULT '[]', -- array of variety objects
    soil_type VARCHAR(50),
    irrigation_system VARCHAR(50), -- 'DRIP', 'SPRINKLER', 'FLOOD', 'NONE'
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for orchards
CREATE INDEX IF NOT EXISTS idx_orchards_farmer_id ON orchards(farmer_id);
CREATE INDEX IF NOT EXISTS idx_orchards_orchard_type ON orchards(orchard_type);
CREATE INDEX IF NOT EXISTS idx_orchards_location ON orchards(location);

-- Orchard Production Table
CREATE TABLE IF NOT EXISTS orchard_production (
    id SERIAL PRIMARY KEY,
    orchard_id INTEGER NOT NULL REFERENCES orchards(id) ON DELETE CASCADE,
    production_year INTEGER NOT NULL,
    variety VARCHAR(100) NOT NULL,
    quantity DECIMAL(10, 2), -- in metric tons
    quality_grade VARCHAR(5), -- 'A', 'B', 'C'
    harvest_date DATE,
    revenue DECIMAL(15, 2),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(orchard_id, production_year, variety)
);

-- Indexes for orchard_production
CREATE INDEX IF NOT EXISTS idx_orchard_production_orchard_id ON orchard_production(orchard_id);
CREATE INDEX IF NOT EXISTS idx_orchard_production_year ON orchard_production(production_year);
CREATE INDEX IF NOT EXISTS idx_orchard_production_variety ON orchard_production(variety);

-- Vegetable Crops Table (M142)
CREATE TABLE IF NOT EXISTS vegetable_crops (
    id SERIAL PRIMARY KEY,
    farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    variety VARCHAR(100),
    location VARCHAR(255),
    area DECIMAL(10, 2),
    planting_date DATE,
    expected_harvest_date DATE,
    category VARCHAR(50), -- 'LEAFY', 'ROOT', 'FRUIT', 'TUBER', 'OTHER'
    cultivation_method VARCHAR(50), -- 'OPEN_FIELD', 'GREENHOUSE', 'HYDROPONIC'
    current_stage VARCHAR(50), -- 'SEEDLING', 'VEGETATIVE', 'FLOWERING', 'FRUITING', 'MATURE'
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for vegetable_crops
CREATE INDEX IF NOT EXISTS idx_vegetable_crops_farmer_id ON vegetable_crops(farmer_id);
CREATE INDEX IF NOT EXISTS idx_vegetable_crops_category ON vegetable_crops(category);
CREATE INDEX IF NOT EXISTS idx_vegetable_crops_cultivation_method ON vegetable_crops(cultivation_method);

-- Floriculture Table (M143)
CREATE TABLE IF NOT EXISTS floriculture (
    id SERIAL PRIMARY KEY,
    farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    flower_type VARCHAR(100) NOT NULL,
    variety VARCHAR(100),
    location VARCHAR(255),
    area DECIMAL(10, 2),
    planting_date DATE,
    expected_harvest_date DATE,
    purpose VARCHAR(50), -- 'CUT_FLOWERS', 'POTTED', 'LANDSCAPING', 'OTHER'
    greenhouse_type VARCHAR(50), -- 'POLYHOUSE', 'GREENHOUSE', 'SHADE_NET', 'OPEN'
    current_stage VARCHAR(50),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for floriculture
CREATE INDEX IF NOT EXISTS idx_floriculture_farmer_id ON floriculture(farmer_id);
CREATE INDEX IF NOT EXISTS idx_floriculture_flower_type ON floriculture(flower_type);
CREATE INDEX IF NOT EXISTS idx_floriculture_purpose ON floriculture(purpose);

-- Greenhouses Table (M144)
CREATE TABLE IF NOT EXISTS greenhouses (
    id SERIAL PRIMARY KEY,
    farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    area DECIMAL(10, 2),
    greenhouse_type VARCHAR(50), -- 'POLYCARBONATE', 'GLASS', 'POLYHOUSE', 'SHADE_NET'
    construction_date DATE,
    temperature_control BOOLEAN DEFAULT false,
    humidity_control BOOLEAN DEFAULT false,
    irrigation_system VARCHAR(50),
    lighting_system VARCHAR(50),
    current_usage VARCHAR(50), -- 'VEGETABLES', 'FLOWERS', 'NURSERY', 'OTHER'
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for greenhouses
CREATE INDEX IF NOT EXISTS idx_greenhouses_farmer_id ON greenhouses(farmer_id);
CREATE INDEX IF NOT EXISTS idx_greenhouses_type ON greenhouses(greenhouse_type);
CREATE INDEX IF NOT EXISTS idx_greenhouses_usage ON greenhouses(current_usage);

-- Hydroponics Systems Table (M146)
CREATE TABLE IF NOT EXISTS hydroponics_systems (
    id SERIAL PRIMARY KEY,
    farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    system_type VARCHAR(50), -- 'NFT', 'DWC', 'EBB_AND_FLOW', 'DRIP', 'AEROPONIC'
    area DECIMAL(10, 2),
    installation_date DATE,
    crop_type VARCHAR(50),
    nutrient_solution VARCHAR(100),
    ph_level DECIMAL(4, 2),
    ec_level DECIMAL(4, 2),
    lighting_type VARCHAR(50),
    water_source VARCHAR(50),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for hydroponics_systems
CREATE INDEX IF NOT EXISTS idx_hydroponics_systems_farmer_id ON hydroponics_systems(farmer_id);
CREATE INDEX IF NOT EXISTS idx_hydroponics_systems_type ON hydroponics_systems(system_type);
CREATE INDEX IF NOT EXISTS idx_hydroponics_systems_crop_type ON hydroponics_systems(crop_type);

-- Horticulture Analytics Table (M150)
CREATE TABLE IF NOT EXISTS horticulture_analytics (
    id SERIAL PRIMARY KEY,
    farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    module_type VARCHAR(50) NOT NULL, -- 'ORCHARD', 'VEGETABLE', 'FLORICULTURE', 'GREENHOUSE', 'HYDROPONICS'
    module_id INTEGER NOT NULL,
    analytics_date DATE NOT NULL,
    metrics JSONB NOT NULL, -- various metrics based on module type
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for horticulture_analytics
CREATE INDEX IF NOT EXISTS idx_horticulture_analytics_farmer_id ON horticulture_analytics(farmer_id);
CREATE INDEX IF NOT EXISTS idx_horticulture_analytics_module_type ON horticulture_analytics(module_type);
CREATE INDEX IF NOT EXISTS idx_horticulture_analytics_date ON horticulture_analytics(analytics_date);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_horticulture_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER trigger_orchards_updated_at
    BEFORE UPDATE ON orchards
    FOR EACH ROW
    EXECUTE FUNCTION update_horticulture_updated_at();

CREATE TRIGGER trigger_orchard_production_updated_at
    BEFORE UPDATE ON orchard_production
    FOR EACH ROW
    EXECUTE FUNCTION update_horticulture_updated_at();

CREATE TRIGGER trigger_vegetable_crops_updated_at
    BEFORE UPDATE ON vegetable_crops
    FOR EACH ROW
    EXECUTE FUNCTION update_horticulture_updated_at();

CREATE TRIGGER trigger_floriculture_updated_at
    BEFORE UPDATE ON floriculture
    FOR EACH ROW
    EXECUTE FUNCTION update_horticulture_updated_at();

CREATE TRIGGER trigger_greenhouses_updated_at
    BEFORE UPDATE ON greenhouses
    FOR EACH ROW
    EXECUTE FUNCTION update_horticulture_updated_at();

CREATE TRIGGER trigger_hydroponics_systems_updated_at
    BEFORE UPDATE ON hydroponics_systems
    FOR EACH ROW
    EXECUTE FUNCTION update_horticulture_updated_at();

-- Insert sample data for demonstration
INSERT INTO orchards (farmer_id, name, location, area, orchard_type, tree_count, planting_date, varieties, soil_type, irrigation_system) VALUES
(1, 'Mango Orchard', 'North Field', 2.5, 'FRUIT', 150, '2020-03-15', '[{"variety": "Alphonso", "count": 100}, {"variety": "Kesar", "count": 50}]', 'LOAMY', 'DRIP'),
(1, 'Coconut Grove', 'South Field', 1.8, 'FRUIT', 80, '2018-06-20', '[{"variety": "Tall", "count": 60}, {"variety": "Dwarf", "count": 20}]', 'SANDY', 'SPRINKLER')
ON CONFLICT DO NOTHING;

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON orchards TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON orchard_production TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON vegetable_crops TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON floriculture TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON greenhouses TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON hydroponics_systems TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON horticulture_analytics TO your_app_user;