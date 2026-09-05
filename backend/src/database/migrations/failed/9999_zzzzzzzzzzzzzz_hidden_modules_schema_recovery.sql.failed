-- Schema recovery for 4 modules (M010, M078, M104, M107) whose service.js
-- files were fully real (300-400 lines each, real business logic, real AI
-- backbone calls) but referenced tables that were never created by any
-- migration - every write would have thrown "relation does not exist" the
-- moment the route was actually called. Columns below are taken directly
-- from each service's own INSERT statements, not guessed.

-- ============================================================================
-- M010 - Notification System (backend/src/modules/M010/service.js)
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    title VARCHAR(255),
    message TEXT,
    data JSONB DEFAULT '{}',
    priority VARCHAR(20) DEFAULT 'low',
    channels JSONB DEFAULT '["in_app"]',
    scheduled_for TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending',
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    delivered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);

CREATE TABLE IF NOT EXISTS notification_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
    channel VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    delivered_at TIMESTAMP,
    error_message TEXT,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_notification ON notification_deliveries(notification_id);

CREATE TABLE IF NOT EXISTS notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    channels JSONB DEFAULT '["in_app","email"]',
    types JSONB DEFAULT '["all"]',
    quiet_hours JSONB DEFAULT '{"enabled":false,"start":"22:00","end":"08:00"}',
    digest_frequency VARCHAR(20) DEFAULT 'daily',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    subject VARCHAR(255),
    body_template TEXT,
    variables JSONB DEFAULT '[]',
    language VARCHAR(10) DEFAULT 'en',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_notification_templates_type_lang ON notification_templates(type, language);

-- ============================================================================
-- M078 - Rainwater Harvesting (backend/src/modules/M078/service.js)
-- Only rainwater_harvesting_systems is written without a try/catch fallback
-- (designHarvestingSystem's INSERT is unguarded); rainfall_patterns,
-- rainfall_records, collection_records, storage_tanks are all read through
-- try/catch blocks that already degrade to empty/zero on error, so they are
-- lower priority - included here too since the columns are fully known from
-- the same file's SELECT statements, not fabricated.
-- ============================================================================
CREATE TABLE IF NOT EXISTS rainwater_harvesting_systems (
    system_id VARCHAR(64) PRIMARY KEY,
    location_id VARCHAR(64),
    location_name VARCHAR(255),
    state VARCHAR(100),
    district VARCHAR(100),
    catchment_area NUMERIC(12,2),
    roof_area NUMERIC(12,2),
    land_area NUMERIC(12,2),
    storage_capacity NUMERIC(12,2),
    intended_use VARCHAR(50),
    budget NUMERIC(12,2),
    design_specifications JSONB DEFAULT '{}',
    status VARCHAR(30) DEFAULT 'designed',
    ai_design JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rainfall_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    state VARCHAR(100),
    district VARCHAR(100),
    month INTEGER,
    average_rainfall_mm NUMERIC(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rainfall_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    system_id VARCHAR(64) REFERENCES rainwater_harvesting_systems(system_id) ON DELETE CASCADE,
    record_date DATE NOT NULL,
    rainfall_mm NUMERIC(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_rainfall_records_system ON rainfall_records(system_id);

CREATE TABLE IF NOT EXISTS collection_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    system_id VARCHAR(64) REFERENCES rainwater_harvesting_systems(system_id) ON DELETE CASCADE,
    collection_date DATE NOT NULL,
    collected_liters NUMERIC(12,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_collection_records_system ON collection_records(system_id);

CREATE TABLE IF NOT EXISTS storage_tanks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    system_id VARCHAR(64) REFERENCES rainwater_harvesting_systems(system_id) ON DELETE CASCADE,
    current_level NUMERIC(12,2) DEFAULT 0,
    total_capacity NUMERIC(12,2) DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_storage_tanks_system ON storage_tanks(system_id);

-- ============================================================================
-- M104 - Equipment Rental (backend/src/modules/M104/service.js)
-- ============================================================================
CREATE TABLE IF NOT EXISTS equipment_rental_listings (
    rental_listing_id VARCHAR(64) PRIMARY KEY,
    equipment_id VARCHAR(64),
    owner_id UUID REFERENCES users(id),
    equipment_name VARCHAR(255),
    category VARCHAR(100),
    specifications JSONB DEFAULT '{}',
    daily_rate NUMERIC(10,2),
    availability_start DATE,
    availability_end DATE,
    location VARCHAR(255),
    state VARCHAR(100),
    district VARCHAR(100),
    security_deposit NUMERIC(10,2),
    terms_conditions TEXT,
    status VARCHAR(30) DEFAULT 'available',
    ai_pricing JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_equipment_rental_listings_owner ON equipment_rental_listings(owner_id);

CREATE TABLE IF NOT EXISTS equipment_rental_bookings (
    booking_id VARCHAR(64) PRIMARY KEY,
    rental_listing_id VARCHAR(64) REFERENCES equipment_rental_listings(rental_listing_id) ON DELETE CASCADE,
    renter_id UUID REFERENCES users(id),
    start_date DATE,
    end_date DATE,
    delivery_required BOOLEAN DEFAULT FALSE,
    delivery_location VARCHAR(255),
    operator_required BOOLEAN DEFAULT FALSE,
    special_requirements TEXT,
    status VARCHAR(30) DEFAULT 'pending',
    ai_assessment JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_equipment_rental_bookings_listing ON equipment_rental_bookings(rental_listing_id);

-- ============================================================================
-- M107 - Breakdown Maintenance (backend/src/modules/M107/service.js)
-- ============================================================================
CREATE TABLE IF NOT EXISTS equipment_breakdowns (
    breakdown_id VARCHAR(64) PRIMARY KEY,
    equipment_id VARCHAR(64),
    equipment_type VARCHAR(100),
    farmer_id UUID REFERENCES farmers(id),
    breakdown_date DATE,
    breakdown_time TIME,
    location VARCHAR(255),
    state VARCHAR(100),
    district VARCHAR(100),
    symptoms JSONB DEFAULT '[]',
    severity VARCHAR(20) DEFAULT 'medium',
    reported_by VARCHAR(255),
    operator_notes TEXT,
    status VARCHAR(30) DEFAULT 'reported',
    ai_diagnosis JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_equipment_breakdowns_farmer ON equipment_breakdowns(farmer_id);

CREATE TABLE IF NOT EXISTS emergency_repairs (
    repair_id VARCHAR(64) PRIMARY KEY,
    breakdown_id VARCHAR(64) REFERENCES equipment_breakdowns(breakdown_id) ON DELETE CASCADE,
    technician_id UUID,
    estimated_arrival TIMESTAMP,
    priority VARCHAR(20) DEFAULT 'high',
    required_parts JSONB DEFAULT '[]',
    estimated_cost NUMERIC(10,2),
    repair_notes TEXT,
    status VARCHAR(30) DEFAULT 'scheduled',
    ai_optimization JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_emergency_repairs_breakdown ON emergency_repairs(breakdown_id);
