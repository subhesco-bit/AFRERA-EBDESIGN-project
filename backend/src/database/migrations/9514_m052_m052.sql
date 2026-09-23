-- ---------------------------------------------------------------------------
-- RECONCILIATION NOTE (added 2026-09-23)
--
-- One or more table names in this file are also defined by another migration
-- with a different column set. `CREATE TABLE IF NOT EXISTS` then does NOTHING
-- on a clean run, and this file's later INSERT / CREATE INDEX statements failed
-- on columns that were never added. Verified on a clean PostgreSQL 16 run of
-- the full migration set.
--
-- Per the project rule, a collision is reconciled and not resolved by dropping
-- one side. Each CREATE TABLE below is followed by ADD COLUMN IF NOT EXISTS for
-- its own columns: a no-op where this file really created the table, and the
-- missing columns where it did not.
--
-- NOT NULL, PRIMARY KEY, UNIQUE and REFERENCES are deliberately not carried
-- over -- the table may already hold rows from the other definition that cannot
-- satisfy them, and a referenced column's type often differs from what this
-- file declares. Where that hides a real type mismatch, it is a reconciliation
-- still owed, not a fix.
-- ---------------------------------------------------------------------------

-- Folded from backend/src/modules/M052/model.sql (AUDIT_DB.md Finding 11/13 remediation)
-- Product Catalog Schema (M052) / -- Product catalog management with AI-powered recommendations
-- Generated 2026-08-30 — DB linkage fix, see .ai/tasks/ACTIVE.md

CREATE TABLE IF NOT EXISTS product_categories (
    category_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    parent_category_id VARCHAR(50),
    description TEXT,
    attributes_schema JSONB,
    image_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE product_categories ADD COLUMN IF NOT EXISTS category_id VARCHAR(50);
ALTER TABLE product_categories ADD COLUMN IF NOT EXISTS name VARCHAR(100);
ALTER TABLE product_categories ADD COLUMN IF NOT EXISTS parent_category_id VARCHAR(50);
ALTER TABLE product_categories ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE product_categories ADD COLUMN IF NOT EXISTS attributes_schema JSONB;
ALTER TABLE product_categories ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);
ALTER TABLE product_categories ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE product_categories ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE product_categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


CREATE TABLE IF NOT EXISTS product_recommendations (
    recommendation_id VARCHAR(50) PRIMARY KEY,
    product_id VARCHAR(50),
    user_id VARCHAR(50),
    recommendation_type VARCHAR(50) NOT NULL,
    recommended_products JSONB NOT NULL,
    confidence_score DECIMAL(3,2),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE product_recommendations ADD COLUMN IF NOT EXISTS recommendation_id VARCHAR(50);
ALTER TABLE product_recommendations ADD COLUMN IF NOT EXISTS product_id VARCHAR(50);
ALTER TABLE product_recommendations ADD COLUMN IF NOT EXISTS user_id VARCHAR(50);
ALTER TABLE product_recommendations ADD COLUMN IF NOT EXISTS recommendation_type VARCHAR(50);
ALTER TABLE product_recommendations ADD COLUMN IF NOT EXISTS recommended_products JSONB;
ALTER TABLE product_recommendations ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(3,2);
ALTER TABLE product_recommendations ADD COLUMN IF NOT EXISTS generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


CREATE TABLE IF NOT EXISTS inventory_logs (
    log_id VARCHAR(50) PRIMARY KEY,
    product_id VARCHAR(50),
    quantity_change INTEGER NOT NULL,
    previous_quantity INTEGER NOT NULL,
    new_quantity INTEGER NOT NULL,
    operation VARCHAR(20) NOT NULL,
    reference_id VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE inventory_logs ADD COLUMN IF NOT EXISTS log_id VARCHAR(50);
ALTER TABLE inventory_logs ADD COLUMN IF NOT EXISTS product_id VARCHAR(50);
ALTER TABLE inventory_logs ADD COLUMN IF NOT EXISTS quantity_change INTEGER;
ALTER TABLE inventory_logs ADD COLUMN IF NOT EXISTS previous_quantity INTEGER;
ALTER TABLE inventory_logs ADD COLUMN IF NOT EXISTS new_quantity INTEGER;
ALTER TABLE inventory_logs ADD COLUMN IF NOT EXISTS operation VARCHAR(20);
ALTER TABLE inventory_logs ADD COLUMN IF NOT EXISTS reference_id VARCHAR(50);
ALTER TABLE inventory_logs ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE inventory_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


CREATE INDEX IF NOT EXISTS idx_product_categories_parent ON product_categories(parent_category_id);

CREATE INDEX IF NOT EXISTS idx_product_recommendations_product ON product_recommendations(product_id);

CREATE INDEX IF NOT EXISTS idx_product_recommendations_user ON product_recommendations(user_id);

CREATE INDEX IF NOT EXISTS idx_inventory_logs_product ON inventory_logs(product_id);

CREATE INDEX IF NOT EXISTS idx_inventory_logs_date ON inventory_logs(created_at);
