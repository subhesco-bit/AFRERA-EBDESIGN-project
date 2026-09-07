-- Folded from backend/src/modules/M104/model.sql (AUDIT_DB.md Finding 11/13 remediation)
-- ﻿-- Equipment Rental Schema (M104) / -- Equipment rental marketplace, booking management, and revenue tracking
-- Generated 2026-08-30 — DB linkage fix, see .ai/tasks/ACTIVE.md

CREATE TABLE IF NOT EXISTS rental_transactions (
    transaction_id VARCHAR(50) PRIMARY KEY,
    booking_id VARCHAR(50),
    amount DECIMAL(10,2) NOT NULL,
    transaction_type VARCHAR(20) NOT NULL,
    payment_method VARCHAR(50),
    payment_status VARCHAR(20) DEFAULT 'pending',
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rental_reviews (
    review_id VARCHAR(50) PRIMARY KEY,
    booking_id VARCHAR(50),
    reviewer_id VARCHAR(50) NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    review_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rental_transactions_booking ON rental_transactions(booking_id);

CREATE INDEX IF NOT EXISTS idx_rental_reviews_booking ON rental_reviews(booking_id);
