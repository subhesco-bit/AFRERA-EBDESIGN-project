-- Schema for M023 Farmer Family plus the 6 Land-domain CRUD resources
-- backing farmerFamilyService.js and landManagementService.js. Columns
-- match the ResourceManager `fields` already shipped on
-- FarmerFamilyPage.jsx and LandManagementPage.jsx - taken directly from
-- that UI, not invented.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS farmer_family_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_name VARCHAR(200) NOT NULL,
    member_name VARCHAR(200) NOT NULL,
    relation VARCHAR(30) DEFAULT 'Spouse',
    age INTEGER,
    gender VARCHAR(10) DEFAULT 'Female',
    occupation VARCHAR(150),
    is_dependent VARCHAR(5) DEFAULT 'Yes',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_farmer_family_members_farmer ON farmer_family_members(farmer_name);

CREATE TABLE IF NOT EXISTS land_leases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parcel_code VARCHAR(100) NOT NULL,
    lessor_name VARCHAR(200) NOT NULL,
    lessee_name VARCHAR(200) NOT NULL,
    lease_type VARCHAR(30) DEFAULT 'Cash Lease',
    rent_amount NUMERIC(12,2),
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'Active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_land_leases_status ON land_leases(status);

CREATE TABLE IF NOT EXISTS gis_land_mapping_parcels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parcel_code VARCHAR(100) NOT NULL,
    latitude NUMERIC(10,6) NOT NULL,
    longitude NUMERIC(10,6) NOT NULL,
    area_hectares NUMERIC(12,2),
    mapped_by VARCHAR(200),
    boundary_polygon TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS soil_mapping_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_name VARCHAR(200) NOT NULL,
    village VARCHAR(200),
    soil_type VARCHAR(30) NOT NULL DEFAULT 'Alluvial',
    ph_level NUMERIC(4,2),
    organic_carbon_pct NUMERIC(6,2),
    nutrient_index VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS water_resource_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_name VARCHAR(200) NOT NULL,
    resource_type VARCHAR(30) NOT NULL DEFAULT 'Well',
    village VARCHAR(200),
    latitude NUMERIC(10,6),
    longitude NUMERIC(10,6),
    capacity_liters NUMERIC(14,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS geo_boundaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    boundary_name VARCHAR(200) NOT NULL,
    boundary_type VARCHAR(30) NOT NULL DEFAULT 'Village',
    parent_boundary VARCHAR(200),
    area_hectares NUMERIC(12,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS land_surveys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parcel_code VARCHAR(100) NOT NULL,
    surveyor_name VARCHAR(200) NOT NULL,
    scheduled_date DATE,
    completed_date DATE,
    status VARCHAR(20) DEFAULT 'Scheduled',
    findings TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_land_surveys_status ON land_surveys(status);
