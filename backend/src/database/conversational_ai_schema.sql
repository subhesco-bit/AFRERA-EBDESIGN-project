-- Enterprise Conversational AI Platform Database Schema
-- AI-powered conversational assistance across all business domains

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- CONVERSATION DOMAINS
-- ============================================================================

CREATE TABLE IF NOT EXISTS conversation_domains (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    capabilities JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pre-populate domains
INSERT INTO conversation_domains (name, description, capabilities, priority) VALUES
('General', 'General assistance and information', '["greeting", "help", "information"]', 100),
('Products', 'Product information, catalog, recommendations', '["product_search", "product_details", "recommendations"]', 90),
('Orders', 'Order management, tracking, status', '["order_status", "order_history", "place_order"]', 85),
('Farmers', 'Farmer information, registration, support', '["farmer_profile", "farmer_registration", "farmer_support"]', 80),
('Financial', 'Loans, payments, financial services', '["loan_inquiry", "payment_status", "financial_advice"]', 75),
('Logistics', 'Shipping, tracking, delivery', '["shipment_tracking", "delivery_status", "logistics_info"]', 70),
('Insurance', 'Insurance policies, claims', '["policy_info", "claim_status", "insurance_advice"]', 65),
('Organic', 'Organic certification, traceability', '["organic_status", "traceability_info", "certification_help"]', 60),
('Nutrition', 'Nutrition information, recommendations', '["nutrition_info", "dietary_advice", "health_recommendations"]', 55);

-- ============================================================================
-- CONVERSATION SESSIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS conversation_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(100) UNIQUE NOT NULL,
    domain_id INTEGER REFERENCES conversation_domains(id),
    language VARCHAR(10) DEFAULT 'en',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'ended', 'archived'
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_conversation_sessions_user ON conversation_sessions(user_id);
CREATE INDEX idx_conversation_sessions_session ON conversation_sessions(session_id);

-- ============================================================================
-- CONVERSATION MESSAGES
-- ============================================================================

CREATE TABLE IF NOT EXISTS conversation_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES conversation_sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL, -- 'user', 'assistant', 'system'
    content TEXT NOT NULL,
    content_type VARCHAR(20) DEFAULT 'text', -- 'text', 'image', 'audio', 'file'
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    intent_detected VARCHAR(100),
    confidence_score DECIMAL(5, 2),
    processing_time_ms INTEGER
);

CREATE INDEX idx_conversation_messages_session ON conversation_messages(session_id);
CREATE INDEX idx_conversation_messages_timestamp ON conversation_messages(timestamp);

-- ============================================================================
-- INTENT RECOGNITION
-- ============================================================================

CREATE TABLE IF NOT EXISTS intents (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    domain_id INTEGER REFERENCES conversation_domains(id),
    description TEXT,
    training_phrases TEXT[],
    response_template TEXT,
    required_parameters JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- CONVERSATION CONTEXT
-- ============================================================================

CREATE TABLE IF NOT EXISTS conversation_context (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES conversation_sessions(id) ON DELETE CASCADE,
    context_key VARCHAR(100) NOT NULL,
    context_value JSONB NOT NULL,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, context_key)
);

CREATE INDEX idx_conversation_context_session ON conversation_context(session_id);

-- ============================================================================
-- KNOWLEDGE BASE
-- ============================================================================

CREATE TABLE IF NOT EXISTS knowledge_base_articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100),
    domain_id INTEGER REFERENCES conversation_domains(id),
    tags TEXT[],
    language VARCHAR(10) DEFAULT 'en',
    embedding VECTOR(1536), -- For semantic search
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_knowledge_base_category ON knowledge_base_articles(category);
CREATE INDEX idx_knowledge_base_domain ON knowledge_base_articles(domain_id);

-- ============================================================================
-- CONVERSATION ANALYTICS
-- ============================================================================

CREATE TABLE IF NOT EXISTS conversation_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES conversation_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    domain_id INTEGER REFERENCES conversation_domains(id),
    total_messages INTEGER DEFAULT 0,
    user_messages INTEGER DEFAULT 0,
    assistant_messages INTEGER DEFAULT 0,
    avg_response_time_ms DECIMAL(10, 2),
    resolution_status VARCHAR(20), -- 'resolved', 'escalated', 'abandoned'
    user_satisfaction INTEGER, -- 1-5 rating
    feedback TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- AI MODEL CONFIGURATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_models (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    model_type VARCHAR(50) NOT NULL, -- 'intent_recognition', 'response_generation', 'embedding', 'translation'
    provider VARCHAR(50) NOT NULL, -- 'openai', 'anthropic', 'google', 'local'
    model_identifier VARCHAR(100) NOT NULL, -- e.g., 'gpt-4', 'claude-3', 'text-embedding-ada-002'
    api_endpoint VARCHAR(255),
    parameters JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- CONVERSATION HANDOFF
-- ============================================================================

CREATE TABLE IF NOT EXISTS conversation_handoffs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES conversation_sessions(id) ON DELETE CASCADE,
    from_type VARCHAR(50) NOT NULL, -- 'ai', 'bot', 'agent'
    to_type VARCHAR(50) NOT NULL,
    reason TEXT,
    handoff_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to update session last activity
CREATE OR REPLACE FUNCTION update_session_activity(session_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE conversation_sessions 
    SET last_activity_at = CURRENT_TIMESTAMP 
    WHERE id = session_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get conversation summary
CREATE OR REPLACE FUNCTION get_conversation_summary(session_id UUID)
RETURNS JSONB AS $$
DECLARE
    summary JSONB;
BEGIN
    SELECT jsonb_build_object(
        'session_id', cs.id,
        'user_id', cs.user_id,
        'domain', cd.name,
        'message_count', COUNT(cm.id),
        'started_at', cs.started_at,
        'last_activity', cs.last_activity_at,
        'status', cs.status
    ) INTO summary
    FROM conversation_sessions cs
    LEFT JOIN conversation_domains cd ON cs.domain_id = cd.id
    LEFT JOIN conversation_messages cm ON cs.id = cm.session_id
    WHERE cs.id = session_id
    GROUP BY cs.id, cd.name;
    
    RETURN summary;
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

CREATE TRIGGER update_conversation_context_updated_at BEFORE UPDATE ON conversation_context
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_base_updated_at BEFORE UPDATE ON knowledge_base_articles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
