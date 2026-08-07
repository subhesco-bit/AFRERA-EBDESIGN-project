-- AFRERA Rural Procurement, Logistics, and Mobility Database Schema
-- This file contains database extensions for RPIP, RLX, and RMN systems

-- ============================================================================
-- RURAL PROCUREMENT INTELLIGENCE PLATFORM (RPIP)
-- ============================================================================

-- Procurement Orders Table
CREATE TABLE IF NOT EXISTS procurement_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reu_id UUID REFERENCES rural_economic_units(id) ON DELETE CASCADE,
  buying_club_id UUID,
  
  -- Order Details
  order_number VARCHAR(50) UNIQUE NOT NULL,
  order_type VARCHAR(50) NOT NULL, -- household, farm, subscription
  
  -- Items
  items JSONB NOT NULL, -- [{product_id, name, quantity, unit, source_price, landed_price}]
  
  -- Pricing
  subtotal DECIMAL NOT NULL,
  village_aggregation_discount DECIMAL,
  fpo_aggregation_discount DECIMAL,
  district_aggregation_discount DECIMAL,
  regional_aggregation_discount DECIMAL,
  total_discount DECIMAL,
  gst DECIMAL,
  logistics_cost DECIMAL,
  total_amount DECIMAL NOT NULL,
  
  -- Source Selection
  selected_source VARCHAR(50), -- manufacturer, oem, distributor, wholesale, online, etc.
  source_id UUID,
  source_location JSONB,
  
  -- Savings
  mrp_total DECIMAL,
  typical_online_price_total DECIMAL,
  local_dealer_price_total DECIMAL,
  total_savings DECIMAL,
  savings_percentage DECIMAL,
  
  -- Delivery
  delivery_hub_id UUID,
  delivery_date DATE,
  delivery_status VARCHAR(50), -- pending, scheduled, in_transit, delivered
  pickup_location JSONB,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, processing, delivered, cancelled
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_procurement_orders_reu ON procurement_orders(reu_id);
CREATE INDEX idx_procurement_orders_club ON procurement_orders(buying_club_id);
CREATE INDEX idx_procurement_orders_number ON procurement_orders(order_number);
CREATE INDEX idx_procurement_orders_type ON procurement_orders(order_type);
CREATE INDEX idx_procurement_orders_status ON procurement_orders(status);
CREATE INDEX idx_procurement_orders_delivery ON procurement_orders(delivery_date, delivery_status);

-- Price Intelligence Table
CREATE TABLE IF NOT EXISTS price_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID,
  product_name VARCHAR(255),
  
  -- Price Data
  source_type VARCHAR(50) NOT NULL, -- manufacturer, oem, distributor, wholesale, online, local
  source_id UUID,
  source_name VARCHAR(255),
  
  -- Pricing
  mrp DECIMAL,
  listed_price DECIMAL,
  effective_price DECIMAL,
  discount_percentage DECIMAL,
  discount_type VARCHAR(50), -- festival, clearance, bulk, seasonal
  
  -- Location
  source_location JSONB,
  
  -- Validity
  valid_from DATE,
  valid_to DATE,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_price_intelligence_product ON price_intelligence(product_id);
CREATE INDEX idx_price_intelligence_source ON price_intelligence(source_type);
CREATE INDEX idx_price_intelligence_validity ON price_intelligence(valid_from, valid_to);

-- Buying Clubs Table
CREATE TABLE IF NOT EXISTS buying_clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_name VARCHAR(255) NOT NULL,
  club_type VARCHAR(50) NOT NULL, -- village, fpo, district, regional
  
  -- Location
  village_id UUID,
  fpo_id UUID,
  district_id VARCHAR(50),
  region_id VARCHAR(50),
  location JSONB NOT NULL,
  
  -- Membership
  member_count INTEGER DEFAULT 0,
  active_members INTEGER DEFAULT 0,
  
  -- Aggregation
  monthly_demand_value DECIMAL DEFAULT 0,
  annual_demand_value DECIMAL DEFAULT 0,
  
  -- Savings
  total_savings DECIMAL DEFAULT 0,
  average_savings_per_member DECIMAL DEFAULT 0,
  
  -- Governance
  committee_members JSONB,
  
  -- Status
  status VARCHAR(50) DEFAULT 'active',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_buying_clubs_type ON buying_clubs(club_type);
CREATE INDEX idx_buying_clubs_location ON buying_clubs USING GIN (location);
CREATE INDEX idx_buying_clubs_status ON buying_clubs(status);

-- Procurement Subscriptions Table
CREATE TABLE IF NOT EXISTS procurement_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reu_id UUID REFERENCES rural_economic_units(id) ON DELETE CASCADE,
  buying_club_id UUID REFERENCES buying_clubs(id) ON DELETE SET NULL,
  
  -- Subscription Details
  subscription_type VARCHAR(50) NOT NULL, -- fertilizer, feed, seeds, grocery, dairy
  product_id UUID,
  product_name VARCHAR(255),
  
  -- Delivery Schedule
  frequency VARCHAR(50) NOT NULL, -- daily, weekly, monthly, quarterly, seasonal
  delivery_day VARCHAR(20),
  delivery_date INTEGER,
  
  -- Quantity
  quantity DECIMAL NOT NULL,
  unit VARCHAR(20) NOT NULL,
  
  -- Pricing
  unit_price DECIMAL NOT NULL,
  total_amount DECIMAL NOT NULL,
  
  -- Forecasting
  forecast_demand DECIMAL,
  forecast_confidence DECIMAL,
  next_procurement_date DATE,
  
  -- Status
  status VARCHAR(50) DEFAULT 'active', -- active, paused, cancelled
  start_date DATE NOT NULL,
  end_date DATE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_procurement_subscriptions_reu ON procurement_subscriptions(reu_id);
CREATE INDEX idx_procurement_subscriptions_club ON procurement_subscriptions(buying_club_id);
CREATE INDEX idx_procurement_subscriptions_type ON procurement_subscriptions(subscription_type);
CREATE INDEX idx_procurement_subscriptions_status ON procurement_subscriptions(status);
CREATE INDEX idx_procurement_subscriptions_next_date ON procurement_subscriptions(next_procurement_date);

-- ============================================================================
-- RURAL LOGISTICS EXCHANGE (RLX)
-- ============================================================================

-- Logistics Orders Table
CREATE TABLE IF NOT EXISTS logistics_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reu_id UUID REFERENCES rural_economic_units(id) ON DELETE CASCADE,
  procurement_order_id UUID REFERENCES procurement_orders(id) ON DELETE SET NULL,
  
  -- Order Details
  order_number VARCHAR(50) UNIQUE NOT NULL,
  order_type VARCHAR(50) NOT NULL, -- forward, reverse, perishable, machinery, livestock
  
  -- Shipment Details
  product_type VARCHAR(100),
  weight DECIMAL,
  volume DECIMAL,
  quantity INTEGER,
  unit VARCHAR(20),
  
  -- Temperature Requirements
  temperature_required BOOLEAN DEFAULT false,
  min_temperature DECIMAL,
  max_temperature DECIMAL,
  shelf_life_hours INTEGER,
  
  -- Origin and Destination
  origin_location JSONB NOT NULL,
  destination_location JSONB NOT NULL,
  distance_km DECIMAL,
  
  -- Deadline
  delivery_deadline TIMESTAMP,
  max_transit_time_hours INTEGER,
  
  -- Logistics Selection
  selected_mode VARCHAR(50) NOT NULL, -- postal, rail, road, air, waterway
  selected_carrier VARCHAR(100),
  carrier_id UUID,
  route JSONB,
  
  -- Cost
  base_cost DECIMAL NOT NULL,
  fuel_surcharge DECIMAL,
  handling_cost DECIMAL,
  temperature_surcharge DECIMAL,
  insurance_cost DECIMAL,
  total_cost DECIMAL NOT NULL,
  
  -- Backhaul
  backhaul_used BOOLEAN DEFAULT false,
  backhaul_savings DECIMAL,
  
  -- Carbon Footprint
  carbon_footprint_kg DECIMAL,
  
  -- Tracking
  tracking_number VARCHAR(100),
  tracking_url TEXT,
  current_location JSONB,
  estimated_delivery TIMESTAMP,
  actual_delivery TIMESTAMP,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, booked, in_transit, delivered, cancelled, delayed
  
  -- Last Mile
  last_mile_partner_id UUID,
  last_mile_partner_name VARCHAR(255),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_logistics_orders_reu ON logistics_orders(reu_id);
CREATE INDEX idx_logistics_orders_procurement ON logistics_orders(procurement_order_id);
CREATE INDEX idx_logistics_orders_number ON logistics_orders(order_number);
CREATE INDEX idx_logistics_orders_type ON logistics_orders(order_type);
CREATE INDEX idx_logistics_orders_mode ON logistics_orders(selected_mode);
CREATE INDEX idx_logistics_orders_status ON logistics_orders(status);
CREATE INDEX idx_logistics_orders_deadline ON logistics_orders(delivery_deadline);

-- Logistics Partners Table
CREATE TABLE IF NOT EXISTS logistics_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Partner Details
  partner_name VARCHAR(255) NOT NULL,
  partner_type VARCHAR(50) NOT NULL, -- postal, courier, road, rail, air, last_mile
  partner_subtype VARCHAR(50), -- india_post, national, regional, local
  
  -- Contact
  contact_person VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(255),
  address JSONB,
  
  -- Capabilities
  modes JSONB, -- [{mode, capacity, temperature_control}]
  coverage JSONB, -- [{state, district, pincode}]
  
  -- Performance
  reliability_score DECIMAL,
  on_time_delivery_rate DECIMAL,
  damage_rate DECIMAL,
  
  -- Pricing
  pricing_model VARCHAR(50), -- per_kg, per_km, flat_rate, dynamic
  base_rate DECIMAL,
  
  -- Integration
  api_available BOOLEAN DEFAULT false,
  api_endpoint TEXT,
  api_key_encrypted TEXT,
  
  -- Status
  status VARCHAR(50) DEFAULT 'active',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_logistics_partners_type ON logistics_partners(partner_type);
CREATE INDEX idx_logistics_partners_subtype ON logistics_partners(partner_subtype);
CREATE INDEX idx_logistics_partners_status ON logistics_partners(status);
CREATE INDEX idx_logistics_partners_coverage ON logistics_partners USING GIN (coverage);

-- Last Mile Partners Table
CREATE TABLE IF NOT EXISTS last_mile_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reu_id UUID REFERENCES rural_economic_units(id) ON DELETE CASCADE,
  
  -- Partner Details
  partner_name VARCHAR(255) NOT NULL,
  partner_type VARCHAR(50) NOT NULL, -- youth_entrepreneur, shg_member, fpo_vehicle, local_retailer, village_transporter
  
  -- Vehicle Details
  vehicle_type VARCHAR(50), -- two_wheeler, three_wheeler, four_wheeler, tractor
  vehicle_registration VARCHAR(50),
  vehicle_capacity DECIMAL,
  
  -- Location
  base_location JSONB NOT NULL,
  coverage_radius_km DECIMAL,
  
  -- Availability
  availability JSONB, -- [{day, start_time, end_time}]
  
  -- Performance
  rating DECIMAL,
  total_deliveries INTEGER DEFAULT 0,
  
  -- Verification
  government_id VARCHAR(100),
  verified BOOLEAN DEFAULT false,
  
  -- Status
  status VARCHAR(50) DEFAULT 'active',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_last_mile_partners_reu ON last_mile_partners(reu_id);
CREATE INDEX idx_last_mile_partners_type ON last_mile_partners(partner_type);
CREATE INDEX idx_last_mile_partners_location ON last_mile_partners USING GIN (base_location);
CREATE INDEX idx_last_mile_partners_status ON last_mile_partners(status);

-- Reverse Logistics Table
CREATE TABLE IF NOT EXISTS reverse_logistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reu_id UUID REFERENCES rural_economic_units(id) ON DELETE CASCADE,
  original_order_id UUID REFERENCES logistics_orders(id) ON DELETE SET NULL,
  
  -- Return Details
  return_type VARCHAR(50) NOT NULL, -- return, repair, warranty, recycling, second_life
  return_reason TEXT,
  
  -- Item Details
  item_id UUID,
  item_name VARCHAR(255),
  item_type VARCHAR(50),
  
  -- Origin and Destination
  pickup_location JSONB NOT NULL,
  destination_location JSONB NOT NULL,
  
  -- Logistics
  logistics_mode VARCHAR(50),
  logistics_partner_id UUID REFERENCES logistics_partners(id) ON DELETE SET NULL,
  cost DECIMAL,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, scheduled, picked_up, received, processed, completed
  
  -- Resolution
  resolution VARCHAR(50), -- refund, replacement, repair, recycle, second_life
  resolution_date DATE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reverse_logistics_reu ON reverse_logistics(reu_id);
CREATE INDEX idx_reverse_logistics_original ON reverse_logistics(original_order_id);
CREATE INDEX idx_reverse_logistics_type ON reverse_logistics(return_type);
CREATE INDEX idx_reverse_logistics_status ON reverse_logistics(status);

-- Backhaul Opportunities Table
CREATE TABLE IF NOT EXISTS backhaul_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  logistics_partner_id UUID REFERENCES logistics_partners(id) ON DELETE SET NULL,
  
  -- Route Details
  origin_location JSONB NOT NULL,
  destination_location JSONB NOT NULL,
  distance_km DECIMAL,
  
  -- Availability
  available_from TIMESTAMP NOT NULL,
  available_until TIMESTAMP NOT NULL,
  
  -- Capacity
  vehicle_type VARCHAR(50),
  available_capacity_kg DECIMAL,
  available_volume_cubic_m DECIMAL,
  
  -- Cost
  base_cost DECIMAL,
  potential_savings DECIMAL,
  
  -- Requirements
  temperature_control BOOLEAN DEFAULT false,
  hazardous_allowed BOOLEAN DEFAULT false,
  
  -- Status
  status VARCHAR(50) DEFAULT 'available', -- available, booked, expired
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_backhaul_opportunities_partner ON backhaul_opportunities(logistics_partner_id);
CREATE INDEX idx_backhaul_opportunities_route ON backhaul_opportunities USING GIN (origin_location);
CREATE INDEX idx_backhaul_opportunities_availability ON backhaul_opportunities(available_from, available_until);
CREATE INDEX idx_backhaul_opportunities_status ON backhaul_opportunities(status);

-- ============================================================================
-- RURAL MOBILITY NETWORK (RMN)
-- ============================================================================

-- Mobility Rides Table
CREATE TABLE IF NOT EXISTS mobility_rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reu_id UUID REFERENCES rural_economic_units(id) ON DELETE CASCADE,
  
  -- Ride Details
  ride_number VARCHAR(50) UNIQUE NOT NULL,
  ride_type VARCHAR(50) NOT NULL, -- shared_community, shared_shuttle, on_demand
  
  -- Origin and Destination
  origin_location JSONB NOT NULL,
  destination_location JSONB NOT NULL,
  distance_km DECIMAL,
  estimated_duration_minutes INTEGER,
  
  -- Schedule
  departure_time TIMESTAMP NOT NULL,
  arrival_time TIMESTAMP,
  return_departure_time TIMESTAMP,
  return_arrival_time TIMESTAMP,
  
  -- Vehicle
  vehicle_type VARCHAR(50) NOT NULL, -- two_wheeler, three_wheeler, car, van, bolero, tractor
  vehicle_registration VARCHAR(50),
  vehicle_capacity INTEGER,
  available_seats INTEGER,
  
  -- Driver
  driver_id UUID REFERENCES users(id) ON DELETE SET NULL,
  driver_name VARCHAR(255),
  driver_phone VARCHAR(20),
  driver_verified BOOLEAN DEFAULT false,
  
  -- Pricing
  base_cost DECIMAL NOT NULL,
  cost_per_seat DECIMAL,
  total_cost DECIMAL NOT NULL,
  
  -- Passengers
  passengers JSONB, -- [{reu_id, name, pickup_location, drop_location, cost}]
  
  -- Goods
  goods_allowed BOOLEAN DEFAULT false,
  goods_details JSONB, -- [{type, weight, volume, cost}]
  
  -- Safety
  women_only BOOLEAN DEFAULT false,
  family_notification BOOLEAN DEFAULT false,
  live_tracking_enabled BOOLEAN DEFAULT true,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, in_progress, completed, cancelled, emergency
  
  -- Tracking
  current_location JSONB,
  last_location_update TIMESTAMP,
  
  -- Rating
  driver_rating INTEGER,
  passenger_ratings JSONB, -- [{passenger_id, rating, feedback}]
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_mobility_rides_reu ON mobility_rides(reu_id);
CREATE INDEX idx_mobility_rides_number ON mobility_rides(ride_number);
CREATE INDEX idx_mobility_rides_type ON mobility_rides(ride_type);
CREATE INDEX idx_mobility_rides_driver ON mobility_rides(driver_id);
CREATE INDEX idx_mobility_rides_departure ON mobility_rides(departure_time);
CREATE INDEX idx_mobility_rides_status ON mobility_rides(status);

-- Vehicle Registration Table
CREATE TABLE IF NOT EXISTS mobility_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reu_id UUID REFERENCES rural_economic_units(id) ON DELETE CASCADE,
  
  -- Vehicle Details
  vehicle_type VARCHAR(50) NOT NULL,
  vehicle_subtype VARCHAR(50),
  registration_number VARCHAR(50) UNIQUE NOT NULL,
  make VARCHAR(100),
  model VARCHAR(100),
  year INTEGER,
  color VARCHAR(50),
  
  -- Capacity
  passenger_capacity INTEGER,
  goods_capacity_kg DECIMAL,
  goods_capacity_volume DECIMAL,
  
  -- Verification
  registration_verified BOOLEAN DEFAULT false,
  insurance_valid BOOLEAN DEFAULT false,
  fitness_certificate_valid BOOLEAN DEFAULT false,
  
  -- Location
  base_location JSONB NOT NULL,
  operating_radius_km DECIMAL,
  
  -- Availability
  availability JSONB, -- [{day, start_time, end_time}]
  
  -- Performance
  total_rides INTEGER DEFAULT 0,
  total_passengers INTEGER DEFAULT 0,
  total_distance_km DECIMAL DEFAULT 0,
  rating DECIMAL,
  
  -- Status
  status VARCHAR(50) DEFAULT 'active',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_mobility_vehicles_reu ON mobility_vehicles(reu_id);
CREATE INDEX idx_mobility_vehicles_type ON mobility_vehicles(vehicle_type);
CREATE INDEX idx_mobility_vehicles_registration ON mobility_vehicles(registration_number);
CREATE INDEX idx_mobility_vehicles_location ON mobility_vehicles USING GIN (base_location);
CREATE INDEX idx_mobility_vehicles_status ON mobility_vehicles(status);

-- Safety Incidents Table
CREATE TABLE IF NOT EXISTS safety_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID REFERENCES mobility_rides(id) ON DELETE SET NULL,
  reu_id UUID REFERENCES rural_economic_units(id) ON DELETE CASCADE,
  
  -- Incident Details
  incident_type VARCHAR(50) NOT NULL, -- sos, route_deviation, prolonged_stop, speed_violation, emergency
  incident_time TIMESTAMP NOT NULL,
  incident_location JSONB,
  
  -- Reporting
  reported_by VARCHAR(50), -- passenger, driver, system, family
  reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Response
  response_triggered BOOLEAN DEFAULT false,
  response_time TIMESTAMP,
  response_type VARCHAR(50), -- emergency_contact, police, ambulance, community
  response_status VARCHAR(50), -- pending, acknowledged, resolved, closed
  
  -- Resolution
  resolution TEXT,
  resolved_at TIMESTAMP,
  
  -- Follow-up
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date DATE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_safety_incidents_ride ON safety_incidents(ride_id);
CREATE INDEX idx_safety_incidents_reu ON safety_incidents(reu_id);
CREATE INDEX idx_safety_incidents_type ON safety_incidents(incident_type);
CREATE INDEX idx_safety_incidents_time ON safety_incidents(incident_time DESC);

-- Trust Scores Table
CREATE TABLE IF NOT EXISTS trust_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reu_id UUID REFERENCES rural_economic_units(id) ON DELETE CASCADE,
  
  -- Trust Score
  overall_score DECIMAL NOT NULL,
  verification_score DECIMAL,
  community_score DECIMAL,
  safety_score DECIMAL,
  reliability_score DECIMAL,
  
  -- Verification Status
  government_id_verified BOOLEAN DEFAULT false,
  face_verified BOOLEAN DEFAULT false,
  address_verified BOOLEAN DEFAULT false,
  background_verified BOOLEAN DEFAULT false,
  
  -- Community Metrics
  positive_ratings INTEGER DEFAULT 0,
  negative_ratings INTEGER DEFAULT 0,
  total_rides INTEGER DEFAULT 0,
  completed_rides INTEGER DEFAULT 0,
  cancelled_rides INTEGER DEFAULT 0,
  
  -- References
  references_count INTEGER DEFAULT 0,
  
  -- Last Updated
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_trust_scores_reu ON trust_scores(reu_id);
CREATE INDEX idx_trust_scores_overall ON trust_scores(overall_score);

-- ============================================================================
-- CROSS-SYSTEM INTEGRATION TABLES
-- ============================================================================

-- Cross-System Savings Table
CREATE TABLE IF NOT EXISTS cross_system_savings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reu_id UUID REFERENCES rural_economic_units(id) ON DELETE CASCADE,
  
  -- Savings Breakdown
  household_savings DECIMAL DEFAULT 0,
  farm_input_savings DECIMAL DEFAULT 0,
  machinery_savings DECIMAL DEFAULT 0,
  infrastructure_savings DECIMAL DEFAULT 0,
  logistics_savings DECIMAL DEFAULT 0,
  mobility_savings DECIMAL DEFAULT 0,
  
  -- Total Savings
  total_savings DECIMAL DEFAULT 0,
  
  -- Period
  period_type VARCHAR(50) NOT NULL, -- daily, weekly, monthly, quarterly, annual
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cross_system_savings_reu ON cross_system_savings(reu_id);
CREATE INDEX idx_cross_system_savings_period ON cross_system_savings(period_type, period_start, period_end);

-- Cross-System Orders Table (Links procurement, logistics, and mobility)
CREATE TABLE IF NOT EXISTS cross_system_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reu_id UUID REFERENCES rural_economic_units(id) ON DELETE CASCADE,
  
  -- Order References
  procurement_order_id UUID REFERENCES procurement_orders(id) ON DELETE SET NULL,
  logistics_order_id UUID REFERENCES logistics_orders(id) ON DELETE SET NULL,
  mobility_ride_id UUID REFERENCES mobility_rides(id) ON DELETE SET NULL,
  
  -- Order Type
  order_type VARCHAR(50) NOT NULL, -- household, farm_input, machinery, infrastructure
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed, cancelled
  
  -- Timeline
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cross_system_orders_reu ON cross_system_orders(reu_id);
CREATE INDEX idx_cross_system_orders_procurement ON cross_system_orders(procurement_order_id);
CREATE INDEX idx_cross_system_orders_logistics ON cross_system_orders(logistics_order_id);
CREATE INDEX idx_cross_system_orders_mobility ON cross_system_orders(mobility_ride_id);
CREATE INDEX idx_cross_system_orders_status ON cross_system_orders(status);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_procurement_orders_updated_at BEFORE UPDATE ON procurement_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_price_intelligence_updated_at BEFORE UPDATE ON price_intelligence
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_buying_clubs_updated_at BEFORE UPDATE ON buying_clubs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_procurement_subscriptions_updated_at BEFORE UPDATE ON procurement_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_logistics_orders_updated_at BEFORE UPDATE ON logistics_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_logistics_partners_updated_at BEFORE UPDATE ON logistics_partners
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_last_mile_partners_updated_at BEFORE UPDATE ON last_mile_partners
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reverse_logistics_updated_at BEFORE UPDATE ON reverse_logistics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_backhaul_opportunities_updated_at BEFORE UPDATE ON backhaul_opportunities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mobility_rides_updated_at BEFORE UPDATE ON mobility_rides
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mobility_vehicles_updated_at BEFORE UPDATE ON mobility_vehicles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cross_system_savings_updated_at BEFORE UPDATE ON cross_system_savings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cross_system_orders_updated_at BEFORE UPDATE ON cross_system_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate procurement order number
CREATE OR REPLACE FUNCTION generate_procurement_order_number()
RETURNS TRIGGER AS $$
DECLARE
    year_part VARCHAR(4);
    sequence_part INTEGER;
    order_number VARCHAR(50);
BEGIN
    year_part := TO_CHAR(CURRENT_DATE, 'YYYY');
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 13 FOR 4) AS INTEGER)), 0) + 1
    INTO sequence_part
    FROM procurement_orders
    WHERE order_number LIKE 'PROC-' || year_part || '-%';
    
    order_number := 'PROC-' || year_part || '-' || LPAD(sequence_part::TEXT, 4, '0');
    NEW.order_number := order_number;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_procurement_order_number_trigger BEFORE INSERT ON procurement_orders
    FOR EACH ROW
    WHEN (NEW.order_number IS NULL)
    EXECUTE FUNCTION generate_procurement_order_number();

-- Function to generate logistics order number
CREATE OR REPLACE FUNCTION generate_logistics_order_number()
RETURNS TRIGGER AS $$
DECLARE
    year_part VARCHAR(4);
    sequence_part INTEGER;
    order_number VARCHAR(50);
BEGIN
    year_part := TO_CHAR(CURRENT_DATE, 'YYYY');
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 13 FOR 4) AS INTEGER)), 0) + 1
    INTO sequence_part
    FROM logistics_orders
    WHERE order_number LIKE 'LOG-' || year_part || '-%';
    
    order_number := 'LOG-' || year_part || '-' || LPAD(sequence_part::TEXT, 4, '0');
    NEW.order_number := order_number;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_logistics_order_number_trigger BEFORE INSERT ON logistics_orders
    FOR EACH ROW
    WHEN (NEW.order_number IS NULL)
    EXECUTE FUNCTION generate_logistics_order_number();

-- Function to generate mobility ride number
CREATE OR REPLACE FUNCTION generate_mobility_ride_number()
RETURNS TRIGGER AS $$
DECLARE
    year_part VARCHAR(4);
    sequence_part INTEGER;
    ride_number VARCHAR(50);
BEGIN
    year_part := TO_CHAR(CURRENT_DATE, 'YYYY');
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(ride_number FROM 11 FOR 4) AS INTEGER)), 0) + 1
    INTO sequence_part
    FROM mobility_rides
    WHERE ride_number LIKE 'RIDE-' || year_part || '-%';
    
    ride_number := 'RIDE-' || year_part || '-' || LPAD(sequence_part::TEXT, 4, '0');
    NEW.ride_number := ride_number;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_mobility_ride_number_trigger BEFORE INSERT ON mobility_rides
    FOR EACH ROW
    WHEN (NEW.ride_number IS NULL)
    EXECUTE FUNCTION generate_mobility_ride_number();

-- Function to calculate total savings for REU
CREATE OR REPLACE FUNCTION calculate_total_savings(reu_id_param UUID, period_start_param DATE, period_end_param DATE)
RETURNS DECIMAL AS $$
DECLARE
    total_savings DECIMAL;
BEGIN
    SELECT COALESCE(SUM(total_savings), 0)
    INTO total_savings
    FROM cross_system_savings
    WHERE reu_id = reu_id_param
    AND period_start >= period_start_param
    AND period_end <= period_end_param;
    
    RETURN total_savings;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Procurement Summary View
CREATE OR REPLACE VIEW procurement_summary AS
SELECT 
    reu_id,
    COUNT(*) as total_orders,
    SUM(total_amount) as total_spend,
    SUM(total_savings) as total_savings,
    AVG(savings_percentage) as average_savings_percentage,
    COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders
FROM procurement_orders
GROUP BY reu_id;

-- Logistics Summary View
CREATE OR REPLACE VIEW logistics_summary AS
SELECT 
    reu_id,
    COUNT(*) as total_shipments,
    SUM(total_cost) as total_logistics_cost,
    AVG(distance_km) as average_distance,
    COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_shipments,
    COUNT(CASE WHEN status = 'in_transit' THEN 1 END) as in_transit_shipments,
    SUM(CASE WHEN backhaul_used THEN backhaul_savings ELSE 0 END) as total_backhaul_savings
FROM logistics_orders
GROUP BY reu_id;

-- Mobility Summary View
CREATE OR REPLACE VIEW mobility_summary AS
SELECT 
    reu_id,
    COUNT(*) as total_rides,
    SUM(total_cost) as total_mobility_cost,
    AVG(distance_km) as average_distance,
    COUNT(CASE WHEN ride_type = 'shared_community' THEN 1 END) as shared_community_rides,
    COUNT(CASE WHEN ride_type = 'shared_shuttle' THEN 1 END) as shared_shuttle_rides,
    COUNT(CASE WHEN ride_type = 'on_demand' THEN 1 END) as on_demand_rides,
    AVG(driver_rating) as average_driver_rating
FROM mobility_rides
GROUP BY reu_id;

-- Cross-System Summary View
CREATE OR REPLACE VIEW cross_system_summary AS
SELECT 
    cs.reu_id,
    cs.total_savings,
    ps.total_spend as procurement_spend,
    ls.total_logistics_cost,
    ms.total_mobility_cost,
    ps.total_orders as procurement_count,
    ls.total_shipments as logistics_count,
    ms.total_rides as mobility_count,
    (ps.total_spend + ls.total_logistics_cost + ms.total_mobility_cost) as total_spend
FROM cross_system_savings cs
LEFT JOIN procurement_summary ps ON ps.reu_id = cs.reu_id
LEFT JOIN logistics_summary ls ON ls.reu_id = cs.reu_id
LEFT JOIN mobility_summary ms ON ms.reu_id = cs.reu_id
WHERE cs.period_type = 'monthly'
AND cs.period_end = (SELECT MAX(period_end) FROM cross_system_savings WHERE period_type = 'monthly');

-- ============================================================================
-- COMMENTS
-- ============================================================================

-- This schema provides a comprehensive database structure for the AFRERA Rural Procurement Intelligence Platform (RPIP),
-- Rural Logistics Exchange (RLX), and Rural Mobility Network (RMN).
-- It supports:
-- - Multi-source procurement with lowest landed cost optimization
-- - Multi-modal logistics with AI decision engine
-- - Community-based mobility with women safety features
-- - Cross-system integration and savings calculation
-- - Event-driven architecture for system coordination
