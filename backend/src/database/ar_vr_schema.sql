-- AR/VR Experience Platform Database Schema
-- Manages augmented reality and virtual reality experiences

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- AR/VR EXPERIENCES
-- ============================================================================

CREATE TABLE IF NOT EXISTS ar_vr_experiences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

CREATE INDEX idx_ar_vr_experiences_type ON ar_vr_experiences(experience_type);
CREATE INDEX idx_ar_vr_experiences_category ON ar_vr_experiences(experience_category);
CREATE INDEX idx_ar_vr_experiences_entity ON ar_vr_experiences(target_entity_id, target_entity_type);

-- ============================================================================
-- 3D ASSETS
-- ============================================================================

CREATE TABLE IF NOT EXISTS ar_vr_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

CREATE INDEX idx_ar_vr_assets_type ON ar_vr_assets(asset_type);

-- ============================================================================
-- EXPERIENCE ASSETS
-- ============================================================================

CREATE TABLE IF NOT EXISTS experience_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    experience_id UUID REFERENCES ar_vr_experiences(id) ON DELETE CASCADE,
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

CREATE INDEX idx_experience_assets_experience ON experience_assets(experience_id);

-- ============================================================================
-- INTERACTION POINTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS interaction_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    experience_id UUID REFERENCES ar_vr_experiences(id) ON DELETE CASCADE,
    point_name VARCHAR(255) NOT NULL,
    point_type VARCHAR(50) NOT NULL, -- 'hotspot', 'marker', 'trigger', 'info_point'
    position_x DECIMAL(10, 4),
    position_y DECIMAL(10, 4),
    position_z DECIMAL(10, 4),
    interaction_data JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_interaction_points_experience ON interaction_points(experience_id);

-- ============================================================================
-- USER SESSIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS ar_vr_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    experience_id UUID REFERENCES ar_vr_experiences(id) ON DELETE CASCADE,
    session_type VARCHAR(50) NOT NULL, -- 'ar', 'vr', 'mixed_reality'
    device_type VARCHAR(50), -- 'mobile', 'tablet', 'headset', 'desktop'
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    duration_seconds INTEGER,
    interaction_count INTEGER DEFAULT 0,
    session_data JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ar_vr_sessions_user ON ar_vr_sessions(user_id);
CREATE INDEX idx_ar_vr_sessions_experience ON ar_vr_sessions(experience_id);

-- ============================================================================
-- SESSION ANALYTICS
-- ============================================================================

CREATE TABLE IF NOT EXISTS ar_vr_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    total_sessions INTEGER DEFAULT 0,
    unique_users INTEGER DEFAULT 0,
    average_session_duration DECIMAL(10, 2),
    total_interactions INTEGER DEFAULT 0,
    most_viewed_experiences JSONB DEFAULT '{}',
    device_distribution JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ar_vr_analytics_date ON ar_vr_analytics(date);

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

CREATE TRIGGER update_ar_vr_experiences_updated_at BEFORE UPDATE ON ar_vr_experiences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
