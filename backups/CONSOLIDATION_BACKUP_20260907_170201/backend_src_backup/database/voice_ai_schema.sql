-- Voice AI Platform Database Schema
-- Manages voice interactions, speech recognition, and voice-activated commands

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- VOICE SESSIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS voice_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(100) UNIQUE NOT NULL,
    language VARCHAR(10) DEFAULT 'en',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    duration_seconds INTEGER,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'ended', 'error'
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_voice_sessions_user ON voice_sessions(user_id);
CREATE INDEX idx_voice_sessions_session ON voice_sessions(session_id);

-- ============================================================================
-- VOICE COMMANDS
-- ============================================================================

CREATE TABLE IF NOT EXISTS voice_commands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES voice_sessions(id) ON DELETE CASCADE,
    command_type VARCHAR(50) NOT NULL, -- 'product_search', 'order', 'navigation', 'information', 'control'
    transcript TEXT NOT NULL,
    intent VARCHAR(100),
    confidence_score DECIMAL(5, 2),
    parameters JSONB DEFAULT '{}',
    execution_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'executed', 'failed', 'cancelled'
    execution_result JSONB,
    error_message TEXT,
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_voice_commands_session ON voice_commands(session_id);
CREATE INDEX idx_voice_commands_status ON voice_commands(execution_status);

-- ============================================================================
-- SPEECH RECOGNITION LOGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS speech_recognition_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES voice_sessions(id) ON DELETE CASCADE,
    audio_duration_ms INTEGER,
    transcript TEXT,
    confidence_score DECIMAL(5, 2),
    language_detected VARCHAR(10),
    recognition_provider VARCHAR(50), -- 'google', 'azure', 'aws', 'local'
    processing_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- VOICE RESPONSES
-- ============================================================================

CREATE TABLE IF NOT EXISTS voice_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES voice_sessions(id) ON DELETE CASCADE,
    command_id UUID REFERENCES voice_commands(id),
    response_type VARCHAR(50) NOT NULL, -- 'text', 'audio', 'action'
    content TEXT NOT NULL,
    audio_url TEXT,
    tts_provider VARCHAR(50), -- 'google', 'azure', 'aws', 'local'
    voice_gender VARCHAR(20), -- 'male', 'female', 'neutral'
    language VARCHAR(10),
    duration_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_voice_responses_session ON voice_responses(session_id);

-- ============================================================================
-- VOICE INTENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS voice_intents (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    training_phrases TEXT[],
    required_parameters JSONB DEFAULT '[]',
    response_template TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- VOICE ANALYTICS
-- ============================================================================

CREATE TABLE IF NOT EXISTS voice_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    total_sessions INTEGER DEFAULT 0,
    total_commands INTEGER DEFAULT 0,
    successful_commands INTEGER DEFAULT 0,
    failed_commands INTEGER DEFAULT 0,
    avg_confidence_score DECIMAL(5, 2),
    avg_session_duration_seconds DECIMAL(10, 2),
    most_used_commands JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_voice_analytics_user ON voice_analytics(user_id);
CREATE INDEX idx_voice_analytics_date ON voice_analytics(date);

-- ============================================================================
-- VOICE PREFERENCES
-- ============================================================================

CREATE TABLE IF NOT EXISTS voice_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    preferred_language VARCHAR(10) DEFAULT 'en',
    voice_gender VARCHAR(20) DEFAULT 'female',
    speech_rate DECIMAL(3, 2) DEFAULT 1.0,
    voice_volume DECIMAL(3, 2) DEFAULT 1.0,
    auto_response_enabled BOOLEAN DEFAULT true,
    confirmation_required BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_voice_preferences_user ON voice_preferences(user_id);

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
    FROM voice_sessions
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

CREATE TRIGGER update_voice_preferences_updated_at BEFORE UPDATE ON voice_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
