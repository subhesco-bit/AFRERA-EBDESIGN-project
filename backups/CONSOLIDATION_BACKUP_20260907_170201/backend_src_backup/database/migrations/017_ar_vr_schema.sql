-- FK TYPE FIX 2026-08-04: 3 column(s) declared UUID while referencing
-- ar_vr_experiences(id), which is SERIAL. ar_vr_experiences is defined in BOTH
-- 015_advanced_features.sql (SERIAL, runs first and therefore wins) and in
-- this file (UUID). Because CREATE TABLE IF NOT EXISTS makes the second
-- definition a no-op, the real column is INTEGER — so these FKs could never
-- be created, and every table carrying them failed with it.

-- AR/VR Experience Platform Database Schema
-- Manages augmented reality and virtual reality experiences

-- Enable required extensions
-- CREATE EXTENSION "uuid-ossp" removed 2026-08-04: gen_random_uuid()
-- is built into PostgreSQL core (13+), so no extension is required. Many
-- managed Postgres services do not enable uuid-ossp by default, which made
-- this a hard deployment dependency for no benefit.
-- Extension declaration removed 2026-08-04: nothing in this file calls a
-- pgcrypto function. It was declared reflexively and made the file fail on any
-- Postgres where the extension is not installed, for no benefit.

-- ============================================================================
-- AR/VR EXPERIENCES
-- ============================================================================

CREATE TABLE IF NOT EXISTS ar_vr_experiences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experience_name VARCHAR(255) NOT NULL,
    experience_type VARCHAR(50) NOT NULL, -- 'ar', 'vr', 'mixed_reality'
    experience_category VARCHAR(50), -- 'product_view', 'farm_tour', 'training', 'education', 'showcase'
    description TEXT,
    target_entity_id UUID,
    target_entity_type VARCHAR(50), -- 'product', 'farm', 'location'
    thumbnail_url TEXT,
    experience_data JSONB NOT NULL, -- 3D models, scenes, interactions
    platform_requirements JSONB DEFAULT '{}',
    is_published BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reconciliation 2026-08-04: ar_vr_experiences is also defined in an earlier migration,
-- so the CREATE TABLE above is a no-op and this file's extra columns were
-- silently lost — surfacing later as "column ... does not exist" on its
-- indexes. These ALTERs make this file's expected shape real either way.
ALTER TABLE ar_vr_experiences ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE ar_vr_experiences ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE ar_vr_experiences ADD COLUMN IF NOT EXISTS experience_category VARCHAR(50);
ALTER TABLE ar_vr_experiences ADD COLUMN IF NOT EXISTS experience_data JSONB;
ALTER TABLE ar_vr_experiences ADD COLUMN IF NOT EXISTS experience_name VARCHAR(255);
ALTER TABLE ar_vr_experiences ADD COLUMN IF NOT EXISTS is_published BOOLEAN;
ALTER TABLE ar_vr_experiences ADD COLUMN IF NOT EXISTS platform_requirements JSONB;
ALTER TABLE ar_vr_experiences ADD COLUMN IF NOT EXISTS target_entity_id UUID;
ALTER TABLE ar_vr_experiences ADD COLUMN IF NOT EXISTS target_entity_type VARCHAR(50);
ALTER TABLE ar_vr_experiences ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

CREATE INDEX IF NOT EXISTS idx_ar_vr_experiences_type ON ar_vr_experiences(experience_type);
CREATE INDEX IF NOT EXISTS idx_ar_vr_experiences_category ON ar_vr_experiences(experience_category);
CREATE INDEX IF NOT EXISTS idx_ar_vr_experiences_entity ON ar_vr_experiences(target_entity_id, target_entity_type);

-- ============================================================================
-- 3D ASSETS
-- ============================================================================

CREATE TABLE IF NOT EXISTS ar_vr_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_name VARCHAR(255) NOT NULL,
    asset_type VARCHAR(50) NOT NULL, -- 'model', 'texture', 'animation', 'audio', 'environment'
    asset_format VARCHAR(50), -- 'glb', 'gltf', 'fbx', 'obj', 'mp3', 'wav'
    file_url TEXT NOT NULL,
    file_size_bytes BIGINT,
    thumbnail_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ar_vr_assets_type ON ar_vr_assets(asset_type);

-- ============================================================================
-- EXPERIENCE ASSETS
-- ============================================================================

CREATE TABLE IF NOT EXISTS experience_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experience_id INTEGER REFERENCES ar_vr_experiences(id) ON DELETE CASCADE,
    asset_id UUID REFERENCES ar_vr_assets(id) ON DELETE CASCADE,
    asset_role VARCHAR(50), -- 'main_model', 'background', 'overlay', 'audio'
    position_x DECIMAL(10, 4),
    position_y DECIMAL(10, 4),
    position_z DECIMAL(10, 4),
    rotation_x DECIMAL(10, 4),
    rotation_y DECIMAL(10, 4),
    rotation_z DECIMAL(10, 4),
    scale DECIMAL(10, 4) DEFAULT 1.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_experience_assets_experience ON experience_assets(experience_id);

-- ============================================================================
-- INTERACTION POINTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS interaction_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experience_id INTEGER REFERENCES ar_vr_experiences(id) ON DELETE CASCADE,
    point_name VARCHAR(255) NOT NULL,
    point_type VARCHAR(50) NOT NULL, -- 'hotspot', 'marker', 'trigger', 'info_point'
    position_x DECIMAL(10, 4),
    position_y DECIMAL(10, 4),
    position_z DECIMAL(10, 4),
    interaction_data JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_interaction_points_experience ON interaction_points(experience_id);

-- ============================================================================
-- USER SESSIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS ar_vr_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    experience_id INTEGER REFERENCES ar_vr_experiences(id) ON DELETE CASCADE,
    session_type VARCHAR(50) NOT NULL, -- 'ar', 'vr', 'mixed_reality'
    device_type VARCHAR(50), -- 'mobile', 'tablet', 'headset', 'desktop'
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    duration_seconds INTEGER,
    interaction_count INTEGER DEFAULT 0,
    session_data JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ar_vr_sessions_user ON ar_vr_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ar_vr_sessions_experience ON ar_vr_sessions(experience_id);

-- ============================================================================
-- SESSION ANALYTICS
-- ============================================================================

CREATE TABLE IF NOT EXISTS ar_vr_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    total_sessions INTEGER DEFAULT 0,
    unique_users INTEGER DEFAULT 0,
    average_session_duration DECIMAL(10, 2),
    total_interactions INTEGER DEFAULT 0,
    most_viewed_experiences JSONB DEFAULT '{}',
    device_distribution JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ar_vr_analytics_date ON ar_vr_analytics(date);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to calculate session duration
CREATE OR REPLACE FUNCTION calculate_session_duration(session_id UUID)
RETURNS INTEGER AS $$
DECLARE
    duration INTEGER;
BEGIN
    SELECT EXTRACT(EPOCH FROM (ended_at - started_at))::INTEGER INTO duration
    FROM ar_vr_sessions
    WHERE id = session_id;
    
    RETURN duration;
END;
$$ LANGUAGE plpgsql;

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_ar_vr_experiences_updated_at ON ar_vr_experiences;
CREATE TRIGGER update_ar_vr_experiences_updated_at BEFORE UPDATE ON ar_vr_experiences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
