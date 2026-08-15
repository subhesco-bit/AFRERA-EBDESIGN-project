-- Farmer Profile Schema (M022)
-- Comprehensive farmer profile management with demographic, household, and professional information

CREATE TABLE IF NOT EXISTS farmer_profiles (
    profile_id VARCHAR(50) PRIMARY KEY,
    farmer_id VARCHAR(50) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(20),
    marital_status VARCHAR(20),
    nationality VARCHAR(50),
    language VARCHAR(50),
    education_level VARCHAR(50),
    occupation VARCHAR(100),
    annual_income DECIMAL(15,2),
    household_size INTEGER,
    dependents INTEGER,
    profile_completeness DECIMAL(5,2) DEFAULT 0,
    verification_status VARCHAR(20) DEFAULT 'pending',
    ai_recommendations JSONB,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS farmer_contact_info (
    contact_id VARCHAR(50) PRIMARY KEY,
    profile_id VARCHAR(50) NOT NULL REFERENCES farmer_profiles(profile_id),
    phone VARCHAR(20),
    alternate_phone VARCHAR(20),
    email VARCHAR(100),
    address_line1 VARCHAR(200),
    address_line2 VARCHAR(200),
    city VARCHAR(100),
    district VARCHAR(50),
    state VARCHAR(50),
    postal_code VARCHAR(20),
    country VARCHAR(50) DEFAULT 'India',
    is_primary BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS farmer_household (
    household_id VARCHAR(50) PRIMARY KEY,
    profile_id VARCHAR(50) NOT NULL REFERENCES farmer_profiles(profile_id),
    member_name VARCHAR(100) NOT NULL,
    relationship VARCHAR(50) NOT NULL,
    age INTEGER,
    gender VARCHAR(20),
    education VARCHAR(50),
    occupation VARCHAR(100),
    income_contribution DECIMAL(15,2),
    is_working_on_farm BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS farmer_education (
    education_id VARCHAR(50) PRIMARY KEY,
    profile_id VARCHAR(50) NOT NULL REFERENCES farmer_profiles(profile_id),
    institution_name VARCHAR(200),
    degree VARCHAR(100),
    field_of_study VARCHAR(100),
    start_year INTEGER,
    end_year INTEGER,
    grade VARCHAR(20),
    is_agricultural BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS farmer_skills (
    skill_id VARCHAR(50) PRIMARY KEY,
    profile_id VARCHAR(50) NOT NULL REFERENCES farmer_profiles(profile_id),
    skill_name VARCHAR(100) NOT NULL,
    skill_category VARCHAR(50),
    proficiency_level VARCHAR(20),
    years_experience INTEGER,
    certification VARCHAR(100),
    certification_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS profile_enrichment_log (
    log_id SERIAL PRIMARY KEY,
    profile_id VARCHAR(50) NOT NULL REFERENCES farmer_profiles(profile_id),
    enrichment_type VARCHAR(50) NOT NULL,
    field_name VARCHAR(100),
    previous_value TEXT,
    new_value TEXT,
    enrichment_source VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_farmer_profiles_farmer_id ON farmer_profiles(farmer_id);
CREATE INDEX idx_farmer_profiles_completeness ON farmer_profiles(profile_completeness);
CREATE INDEX idx_farmer_profiles_verification ON farmer_profiles(verification_status);
CREATE INDEX idx_farmer_contact_info_profile ON farmer_contact_info(profile_id);
CREATE INDEX idx_farmer_household_profile ON farmer_household(profile_id);
CREATE INDEX idx_farmer_education_profile ON farmer_education(profile_id);
CREATE INDEX idx_farmer_skills_profile ON farmer_skills(profile_id);
CREATE INDEX idx_profile_enrichment_profile ON profile_enrichment_log(profile_id);
