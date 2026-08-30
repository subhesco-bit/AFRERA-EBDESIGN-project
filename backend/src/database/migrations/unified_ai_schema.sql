-- Unified Claude AI Database Schema
-- Central AI coordination and management tables

-- AI session context table for conversation history
CREATE TABLE IF NOT EXISTS ai_session_context (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    response TEXT NOT NULL,
    agent VARCHAR(50),
    context_used JSONB,
    token_usage JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI usage tracking table for monitoring and cost optimization
CREATE TABLE IF NOT EXISTS ai_usage_tracking (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    request_type VARCHAR(50) NOT NULL,
    agent VARCHAR(50) NOT NULL,
    input_tokens INTEGER,
    output_tokens INTEGER,
    total_tokens INTEGER,
    cost DECIMAL(10, 6),
    response_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI agent performance tracking table
CREATE TABLE IF NOT EXISTS ai_agent_performance (
    id SERIAL PRIMARY KEY,
    agent VARCHAR(50) NOT NULL,
    request_count INTEGER DEFAULT 0,
    average_response_time_ms DECIMAL(10, 2),
    success_rate DECIMAL(5, 2),
    user_satisfaction_score DECIMAL(3, 2),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(agent)
);

-- AI knowledge base integration table
CREATE TABLE IF NOT EXISTS ai_knowledge_base (
    id SERIAL PRIMARY KEY,
    source_type VARCHAR(50) NOT NULL,
    source_id VARCHAR(255),
    knowledge_type VARCHAR(50),
    content TEXT NOT NULL,
    -- 2026-08-30: VECTOR(1536) requires the pgvector extension, which isn't
    -- installed on this repo's CI Postgres (postgres:15-alpine has no
    -- extensions beyond the built-ins) or, per a repo-wide grep, used by any
    -- application code yet ("type vector does not exist" - the first time
    -- this repo's CI actually ran npm run migrate for real). Stored as a
    -- plain float array for now so the column and its data are still real
    -- and usable; switching back to VECTOR + CREATE EXTENSION IF NOT EXISTS
    -- vector is a real option once something actually needs pgvector's
    -- similarity-search indexing and the CI/prod Postgres image supports it.
    embedding_vector DOUBLE PRECISION[],
    metadata JSONB,
    relevance_score DECIMAL(5, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI context enrichment table
CREATE TABLE IF NOT EXISTS ai_context_enrichment (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    enrichment_type VARCHAR(50),
    enrichment_data JSONB,
    relevance_score DECIMAL(5, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI tool execution tracking table
CREATE TABLE IF NOT EXISTS ai_tool_execution (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    tool_name VARCHAR(100) NOT NULL,
    tool_parameters JSONB,
    execution_result JSONB,
    execution_time_ms INTEGER,
    success BOOLEAN,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI safety and guardrails tracking table
CREATE TABLE IF NOT EXISTS ai_safety_events (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20),
    description TEXT,
    blocked_content TEXT,
    action_taken VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI cost optimization tracking table
CREATE TABLE IF NOT EXISTS ai_cost_optimization (
    id SERIAL PRIMARY KEY,
    optimization_type VARCHAR(50),
    baseline_cost DECIMAL(10, 6),
    optimized_cost DECIMAL(10, 6),
    savings_percentage DECIMAL(5, 2),
    optimization_strategy TEXT,
    implemented_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    effectiveness_rating DECIMAL(3, 2)
);

-- Indexes for performance
CREATE INDEX idx_ai_session_context_session_id ON ai_session_context(session_id);
CREATE INDEX idx_ai_session_context_user_id ON ai_session_context(user_id);
CREATE INDEX idx_ai_session_context_created_at ON ai_session_context(created_at);
CREATE INDEX idx_ai_usage_tracking_user_id ON ai_usage_tracking(user_id);
CREATE INDEX idx_ai_usage_tracking_agent ON ai_usage_tracking(agent);
CREATE INDEX idx_ai_usage_tracking_created_at ON ai_usage_tracking(created_at);
CREATE INDEX idx_ai_knowledge_base_source_type ON ai_knowledge_base(source_type);
CREATE INDEX idx_ai_knowledge_base_knowledge_type ON ai_knowledge_base(knowledge_type);
CREATE INDEX idx_ai_context_enrichment_session_id ON ai_context_enrichment(session_id);
CREATE INDEX idx_ai_tool_execution_session_id ON ai_tool_execution(session_id);
CREATE INDEX idx_ai_tool_execution_tool_name ON ai_tool_execution(tool_name);
CREATE INDEX idx_ai_safety_events_user_id ON ai_safety_events(user_id);
CREATE INDEX idx_ai_safety_events_severity ON ai_safety_events(severity);

-- Comment on tables
COMMENT ON TABLE ai_session_context IS 'AI conversation history and context tracking';
COMMENT ON TABLE ai_usage_tracking IS 'AI usage monitoring and cost tracking';
COMMENT ON TABLE ai_agent_performance IS 'AI agent performance metrics and optimization';
COMMENT ON TABLE ai_knowledge_base IS 'AI knowledge base with embeddings for semantic search';
COMMENT ON TABLE ai_context_enrichment IS 'Context enrichment tracking for AI requests';
COMMENT ON TABLE ai_tool_execution IS 'AI tool execution tracking and monitoring';
COMMENT ON TABLE ai_safety_events IS 'AI safety events and guardrail triggers';
COMMENT ON TABLE ai_cost_optimization IS 'AI cost optimization tracking and strategies';
