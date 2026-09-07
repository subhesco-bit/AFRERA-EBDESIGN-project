-- Equipment Rental Schema (M104)
-- Equipment rental marketplace, booking management, and revenue tracking

CREATE TABLE IF NOT EXISTS equipment_rental_listings (
    rental_listing_id VARCHAR(50) PRIMARY KEY,
    equipment_id VARCHAR(50) NOT NULL,
    owner_id VARCHAR(50) NOT NULL,
    equipment_name VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL,
    specifications JSONB,
    daily_rate DECIMAL(10,2) NOT NULL,
    availability_start DATE NOT NULL,
    availability_end DATE NOT NULL,
    location VARCHAR(200),
    state VARCHAR(50),
    district VARCHAR(50),
    security_deposit DECIMAL(10,2),
    terms_conditions TEXT,
    status VARCHAR(20) DEFAULT 'available',
    ai_pricing JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS equipment_rental_bookings (
    booking_id VARCHAR(50) PRIMARY KEY,
    rental_listing_id VARCHAR(50) REFERENCES equipment_rental_listings(rental_listing_id),
    renter_id VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    delivery_required BOOLEAN DEFAULT false,
    delivery_location VARCHAR(200),
    operator_required BOOLEAN DEFAULT false,
    special_requirements TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    ai_assessment JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rental_transactions (
    transaction_id VARCHAR(50) PRIMARY KEY,
    booking_id VARCHAR(50) REFERENCES equipment_rental_bookings(booking_id),
    amount DECIMAL(10,2) NOT NULL,
    transaction_type VARCHAR(20) NOT NULL,
    payment_method VARCHAR(50),
    payment_status VARCHAR(20) DEFAULT 'pending',
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rental_reviews (
    review_id VARCHAR(50) PRIMARY KEY,
    booking_id VARCHAR(50) REFERENCES equipment_rental_bookings(booking_id),
    reviewer_id VARCHAR(50) NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    review_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rental_listings_owner ON equipment_rental_listings(owner_id);
CREATE INDEX idx_rental_listings_category ON equipment_rental_listings(category);
CREATE INDEX idx_rental_listings_status ON equipment_rental_listings(status);
CREATE INDEX idx_rental_listings_availability ON equipment_rental_listings(availability_start, availability_end);
CREATE INDEX idx_rental_bookings_listing ON equipment_rental_bookings(rental_listing_id);
CREATE INDEX idx_rental_bookings_renter ON equipment_rental_bookings(renter_id);
CREATE INDEX idx_rental_bookings_dates ON equipment_rental_bookings(start_date, end_date);
CREATE INDEX idx_rental_bookings_status ON equipment_rental_bookings(status);
CREATE INDEX idx_rental_transactions_booking ON rental_transactions(booking_id);
CREATE INDEX idx_rental_reviews_booking ON rental_reviews(booking_id);
