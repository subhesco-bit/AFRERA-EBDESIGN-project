-- Folded from backend/src/modules/M058/model.sql (AUDIT_DB.md Finding 11/13 remediation)
-- Returns Management Schema (M058)
-- Generated 2026-08-30 — DB linkage fix, see .ai/tasks/ACTIVE.md

CREATE TABLE IF NOT EXISTS returns (
    return_id VARCHAR(50) PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL,
    product_id VARCHAR(50) NOT NULL,
    reason TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    refund_amount DECIMAL(15,2),
    notes TEXT,
    ai_recommendations JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_returns_order ON returns(order_id);

CREATE INDEX IF NOT EXISTS idx_returns_status ON returns(status);
