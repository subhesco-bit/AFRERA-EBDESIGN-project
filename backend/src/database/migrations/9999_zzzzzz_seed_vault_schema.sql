-- Seed Vault — personal on-farm seed inventory tracker.
--
-- Confirmed genuinely absent (2026-08-15 concept-document gap analysis):
-- frontend/src/pages/SeedVaultPage.jsx is a complete, real UI calling
-- farmersAPI.getSeedVault/getSeedCategories/deleteSeed — none of which
-- exist anywhere in api.js or the backend. The page has been a dead,
-- non-functional UI since it was built.

CREATE TABLE IF NOT EXISTS seed_vault_items (
  id SERIAL PRIMARY KEY,
  farmer_id UUID NOT NULL REFERENCES farmers(id),
  name VARCHAR(255) NOT NULL,
  variety VARCHAR(255),
  category VARCHAR(100) NOT NULL,
  quantity NUMERIC(12,2) NOT NULL CHECK (quantity >= 0),
  unit VARCHAR(20) NOT NULL DEFAULT 'kg' CHECK (unit IN ('kg', 'g', 'quintal')),
  purchase_date DATE,
  min_stock NUMERIC(12,2) DEFAULT 0,
  supplier VARCHAR(255),
  storage_conditions JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_seed_vault_farmer ON seed_vault_items(farmer_id);
CREATE INDEX IF NOT EXISTS idx_seed_vault_category ON seed_vault_items(category);
