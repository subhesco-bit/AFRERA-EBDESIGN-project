-- Knowledge Graph Platform Database Schema
-- Manages knowledge graph nodes, relationships, and semantic queries

-- Enable required extensions
-- CREATE EXTENSION "uuid-ossp" removed 2026-08-04: gen_random_uuid()
-- is built into PostgreSQL core (13+), so no extension is required. Many
-- managed Postgres services do not enable uuid-ossp by default, which made
-- this a hard deployment dependency for no benefit.
-- Extension declaration removed 2026-08-04: nothing in this file calls a
-- pgcrypto function. It was declared reflexively and made the file fail on any
-- Postgres where the extension is not installed, for no benefit.

-- ============================================================================
-- KNOWLEDGE NODES
-- ============================================================================

CREATE TABLE IF NOT EXISTS knowledge_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    node_type VARCHAR(50) NOT NULL, -- 'product', 'farmer', 'location', 'nutrient', 'disease', 'practice'
    external_id VARCHAR(100),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    properties JSONB DEFAULT '{}',
    source_system VARCHAR(100), -- 'products', 'farmers', 'nutrition', 'external'
    confidence_score DECIMAL(5, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_type ON knowledge_nodes(node_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_external ON knowledge_nodes(external_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_name ON knowledge_nodes USING gin(to_tsvector('english', name));

-- ============================================================================
-- KNOWLEDGE RELATIONSHIPS
-- ============================================================================

CREATE TABLE IF NOT EXISTS knowledge_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_node_id UUID REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
    target_node_id UUID REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) NOT NULL, -- 'produces', 'contains', 'located_in', 'treats', 'related_to', 'similar_to'
    relationship_properties JSONB DEFAULT '{}',
    confidence_score DECIMAL(5, 2),
    source VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_knowledge_relationships_source ON knowledge_relationships(source_node_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_relationships_target ON knowledge_relationships(target_node_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_relationships_type ON knowledge_relationships(relationship_type);

-- ============================================================================
-- KNOWLEDGE GRAPHS
-- ============================================================================

CREATE TABLE IF NOT EXISTS knowledge_graphs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    graph_name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    domain VARCHAR(100), -- 'agriculture', 'nutrition', 'health', 'commerce'
    version VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- GRAPH QUERIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS graph_queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_name VARCHAR(255) NOT NULL,
    query_type VARCHAR(50) NOT NULL, -- 'path', 'neighbor', 'shortest_path', 'subgraph'
    query_definition JSONB NOT NULL,
    parameters JSONB DEFAULT '{}',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- QUERY RESULTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS query_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_id UUID REFERENCES graph_queries(id),
    executed_by UUID REFERENCES users(id),
    execution_time_ms INTEGER,
    result_data JSONB NOT NULL,
    result_count INTEGER,
    cached BOOLEAN DEFAULT FALSE,
    cache_expiry TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_query_results_query ON query_results(query_id);

-- ============================================================================
-- SEMANTIC SEARCH
-- ============================================================================

CREATE TABLE IF NOT EXISTS semantic_search_index (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    node_id UUID REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
    embedding_vector DECIMAL[], -- Vector embedding for semantic search
    embedding_model VARCHAR(100),
    indexed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- KNOWLEDGE ANALYTICS
-- ============================================================================

CREATE TABLE IF NOT EXISTS knowledge_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    total_nodes INTEGER DEFAULT 0,
    total_relationships INTEGER DEFAULT 0,
    total_queries_executed INTEGER DEFAULT 0,
    avg_query_time_ms DECIMAL(10, 2),
    unique_users_querying INTEGER DEFAULT 0,
    most_queried_node_types JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_knowledge_analytics_date ON knowledge_analytics(date);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to find related nodes
CREATE OR REPLACE FUNCTION find_related_nodes(node_id UUID, relationship_type VARCHAR, max_depth INTEGER)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    -- Simplified related nodes query (in production, use graph algorithms)
    SELECT jsonb_agg(jsonb_build_object(
        'id', kn.id,
        'name', kn.name,
        'type', kn.node_type,
        'properties', kn.properties,
        'relationship', kr.relationship_type,
        'confidence', kr.confidence_score
    )) INTO result
    FROM knowledge_relationships kr
    JOIN knowledge_nodes kn ON kr.target_node_id = kn.id
    WHERE kr.source_node_id = node_id
    AND (relationship_type IS NULL OR kr.relationship_type = relationship_type)
    LIMIT 50;
    
    RETURN COALESCE(result, '[]'::jsonb);
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

DROP TRIGGER IF EXISTS update_knowledge_nodes_updated_at ON knowledge_nodes;
CREATE TRIGGER update_knowledge_nodes_updated_at BEFORE UPDATE ON knowledge_nodes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_knowledge_graphs_updated_at ON knowledge_graphs;
CREATE TRIGGER update_knowledge_graphs_updated_at BEFORE UPDATE ON knowledge_graphs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
