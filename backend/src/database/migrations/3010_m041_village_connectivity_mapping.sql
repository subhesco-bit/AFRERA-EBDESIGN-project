-- M041 Village Connectivity & Access Mapping
-- Post offices, roads, railway, airports and logistics nodes.
-- Reusable for Village -> District -> State -> Country aggregation.

CREATE TABLE IF NOT EXISTS village_connectivity_nodes (
    node_id VARCHAR(80) PRIMARY KEY,
    node_type VARCHAR(40) NOT NULL CHECK (node_type IN (
        'post_office', 'railway_station', 'airport', 'logistics_hub',
        'market', 'warehouse', 'hospital', 'bank', 'bus_terminal', 'government_office'
    )),
    name VARCHAR(255) NOT NULL,
    official_code VARCHAR(100),
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),
    address TEXT,
    district VARCHAR(200),
    state VARCHAR(200),
    country VARCHAR(100) DEFAULT 'India',
    service_area_km DECIMAL(10,2),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    status VARCHAR(30) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vcn_type ON village_connectivity_nodes(node_type);
CREATE INDEX IF NOT EXISTS idx_vcn_location ON village_connectivity_nodes(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_vcn_state_district ON village_connectivity_nodes(state, district);

CREATE TABLE IF NOT EXISTS village_connectivity_links (
    link_id VARCHAR(80) PRIMARY KEY,
    village_id VARCHAR(50) NOT NULL REFERENCES villages(village_id) ON DELETE CASCADE,
    node_id VARCHAR(80) NOT NULL REFERENCES village_connectivity_nodes(node_id) ON DELETE CASCADE,
    access_type VARCHAR(40) NOT NULL CHECK (access_type IN (
        'road', 'rail', 'postal', 'air', 'logistics', 'market', 'public_transport'
    )),
    distance_km DECIMAL(12,3),
    estimated_travel_minutes INTEGER,
    route_quality VARCHAR(40),
    seasonal_access VARCHAR(40),
    route_geometry JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(village_id, node_id, access_type)
);

CREATE INDEX IF NOT EXISTS idx_vcl_village ON village_connectivity_links(village_id);
CREATE INDEX IF NOT EXISTS idx_vcl_node ON village_connectivity_links(node_id);
CREATE INDEX IF NOT EXISTS idx_vcl_access_type ON village_connectivity_links(access_type);
CREATE INDEX IF NOT EXISTS idx_vcl_primary ON village_connectivity_links(village_id, access_type, is_primary);

CREATE TABLE IF NOT EXISTS village_road_links (
    road_link_id VARCHAR(80) PRIMARY KEY,
    village_id VARCHAR(50) NOT NULL REFERENCES villages(village_id) ON DELETE CASCADE,
    road_name VARCHAR(255),
    road_class VARCHAR(60),
    surface_type VARCHAR(60),
    condition VARCHAR(40),
    distance_km DECIMAL(12,3),
    all_weather BOOLEAN,
    connectivity_status VARCHAR(40),
    route_geometry JSONB NOT NULL DEFAULT '{}'::jsonb,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vrl_village ON village_road_links(village_id);
CREATE INDEX IF NOT EXISTS idx_vrl_class ON village_road_links(road_class);
CREATE INDEX IF NOT EXISTS idx_vrl_condition ON village_road_links(condition);

CREATE TABLE IF NOT EXISTS village_connectivity_assessments (
    assessment_id VARCHAR(80) PRIMARY KEY,
    village_id VARCHAR(50) NOT NULL REFERENCES villages(village_id) ON DELETE CASCADE,
    nearest_post_office_node_id VARCHAR(80) REFERENCES village_connectivity_nodes(node_id),
    nearest_railway_station_node_id VARCHAR(80) REFERENCES village_connectivity_nodes(node_id),
    nearest_airport_node_id VARCHAR(80) REFERENCES village_connectivity_nodes(node_id),
    nearest_logistics_node_id VARCHAR(80) REFERENCES village_connectivity_nodes(node_id),
    nearest_market_node_id VARCHAR(80) REFERENCES village_connectivity_nodes(node_id),
    primary_road_link_id VARCHAR(80) REFERENCES village_road_links(road_link_id),
    road_access_score DECIMAL(5,2),
    postal_access_score DECIMAL(5,2),
    rail_access_score DECIMAL(5,2),
    airport_access_score DECIMAL(5,2),
    logistics_access_score DECIMAL(5,2),
    overall_connectivity_score DECIMAL(5,2),
    bottlenecks JSONB NOT NULL DEFAULT '[]'::jsonb,
    recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
    assessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_vca_village ON village_connectivity_assessments(village_id);
CREATE INDEX IF NOT EXISTS idx_vca_score ON village_connectivity_assessments(overall_connectivity_score);
