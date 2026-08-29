<!-- Claude AI Ready Module - Systematic Reorganization -->
<!-- Category: documentation -->
<!-- Processed: 2026-08-28 14:27:18 -->
<!-- Status: AI Integration Ready -->
<!-- File: DATABASE_SETUP_GUIDE.md -->

# AFRERA Database Setup & Migration Guide
**E-Commerce Marketplace & Integration Deployment**
**Date**: August 11, 2026
**Status**: Ready for Deployment

---

## 🎯 OVERVIEW

This guide provides step-by-step instructions for setting up the database and running migrations for the enhanced AFRERA E-commerce marketplace with nutrition, recipe, health, and dietitian integration.

---

## 📋 PREREQUISITES

### Required Software
- **PostgreSQL**: Version 13 or higher
- **Node.js**: Version 18 or higher
- **npm**: Version 9 or higher

### System Requirements
- **RAM**: Minimum 4GB (8GB recommended)
- **Disk Space**: Minimum 10GB free space
- **Processor**: Modern multi-core processor

---

## 🔧 DATABASE SETUP

### Step 1: Install PostgreSQL

#### Windows
```powershell
# Download PostgreSQL installer from https://www.postgresql.org/download/windows/
# Run installer and follow setup wizard
# Default installation: C:\Program Files\PostgreSQL\13
# Default port: 5432
# Default user: postgres
# Set a strong password during installation
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### macOS
```bash
brew install postgresql
brew services start postgresql
```

### Step 2: Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE afrera_db;

# Create user (if needed)
CREATE USER afrera_user WITH PASSWORD 'your_secure_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE afrera_db TO afrera_user;

# Exit
\q
```

### Step 3: Configure Environment Variables

Create `.env` file in `backend/` directory:

```bash
# Copy example file
cp .env.example .env

# Edit .env file with your database credentials
# Update these values:
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=afrera_db
PG_USER=postgres
PG_PASSWORD=your_postgres_password
DATABASE_URL=postgresql://postgres:your_postgres_password@localhost:5432/afrera_db
```

---

## 🚀 MIGRATION EXECUTION

### Step 4: Run E-Commerce Migration

```bash
# Navigate to backend directory
cd backend

# Run migration
node src/database/migrate.js

# Expected output:
# - Starting database migrations...
# - Migration 3100_ecommerce_tables.sql completed successfully
# - All tables created successfully
```

### Step 5: Run Integration Migration

```bash
# Run integration migration
node src/database/migrate.js

# Expected output:
# - Starting database migrations...
# - Migration 3101_ecommerce_integration_tables.sql completed successfully
# - All integration tables created successfully
```

### Step 6: Verify Table Creation

```bash
# Connect to database
psql -U postgres -d afrera_db

# List all tables
\dt

# Expected tables from e-commerce migration:
# - product_listings
# - gi_marketplace_listings
# - product_reviews
# - review_helpful_votes
# - review_reports
# - bulk_orders
# - quotations
# - seller_analytics_summary
# - market_price_history
# - marketplace_events

# Expected tables from integration migration:
# - dietitian_collections
# - dietitian_collection_products
# - recipe_product_recommendations
# - user_health_product_interactions
# - cart_nutrition_history
# - nutrition_pricing_history
# - product_recipe_compatibility
# - allergen_alert_config
# - dietary_preference_config

# Check specific table structure
\d product_listings
\d dietitian_collections

# Exit
\q
```

---

## 🧪 TEST DATA SEEDING

### Step 7: Create Seed Data

Create `backend/src/database/seeds/ecommerce_seed.sql`:

```sql
-- Seed Categories
INSERT INTO categories (id, name, description) VALUES
(1, 'Grains & Millets', 'Rice, wheat, millets, and other grains'),
(2, 'Spices', 'Cardamom, pepper, turmeric, and other spices'),
(3, 'Fruits', 'Fresh fruits and produce'),
(4, 'Vegetables', 'Fresh vegetables and greens'),
(5, 'Tea & Beverages', 'Tea, coffee, and other beverages'),
(6, 'Honey', 'Natural honey and bee products');

-- Seed States
INSERT INTO states (id, name, code) VALUES
(1, 'Assam', 'AS'),
(2, 'Nagaland', 'NL'),
(3, 'Manipur', 'MN'),
(4, 'Meghalaya', 'ML'),
(5, 'Arunachal Pradesh', 'AR'),
(6, 'Mizoram', 'MZ'),
(7, 'Tripura', 'TR'),
(8, 'Sikkim', 'SK');

-- Seed Sample Product Listings
INSERT INTO product_listings (
    id, seller_id, product_name, category_id, description, 
    quantity, unit, base_price, quality_score, demand_prediction,
    harvest_date, state_id, gi_tagged, organic, listing_status
) VALUES
(
    'pl-001', 'user-001', 'Assam Organic Rice', 1, 
    'Premium organic rice from Assam, high quality', 
    1000, 'kg', 45.00, 0.85, 'high',
    '2026-08-01', 1, true, true, 'active'
),
(
    'pl-002', 'user-002', 'Sikkim Cardamom', 2,
    'Premium cardamom from Sikkim mountains',
    500, 'kg', 850.00, 0.92, 'high',
    '2026-08-05', 8, true, true, 'active'
),
(
    'pl-003', 'user-003', 'Nagaland Kiwi', 3,
    'Fresh organic kiwi from Nagaland',
    200, 'kg', 120.00, 0.78, 'medium',
    '2026-08-10', 2, false, true, 'active'
);

-- Seed Sample Dietitian Collection
INSERT INTO dietitian_collections (
    id, collection_name, description, dietitian_id, 
    dietary_focus, health_goals, is_active
) VALUES
(
    'dc-001', 'Heart-Healthy Products',
    'Products selected for cardiovascular health',
    'dietitian-001',
    ARRAY['low-sodium', 'low-cholesterol'],
    ARRAY['heart_health', 'blood_pressure_control'],
    true
);

-- Link products to collection
INSERT INTO dietitian_collection_products (
    id, collection_id, product_id, position
) VALUES
('dcp-001', 'dc-001', 'pl-001', 1);
```

### Step 8: Run Seed Data

```bash
# Execute seed file
psql -U postgres -d afrera_db -f backend/src/database/seeds/ecommerce_seed.sql

# Verify data
psql -U postgres -d afrera_db -c "SELECT * FROM product_listings;"
psql -U postgres -d afrera_db -c "SELECT * FROM dietitian_collections;"
```

---

## ✅ VERIFICATION STEPS

### Step 9: Verify Backend Startup

```bash
# Start backend server
cd backend
npm start

# Expected output:
# - Server running on port 3001
# - Database connection successful
# - All routes mounted successfully
# - E-commerce routes available at /api/v1/ecommerce
# - Integration routes available at /api/v1/ecommerce-integration
```

### Step 10: Test Health Endpoint

```bash
# Test health check
curl http://localhost:3001/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2026-08-11T...",
  "uptime": ...,
  "services": {
    "database": { "status": "ok" },
    "ecommerce": { "status": "ok" }
  }
}
```

### Step 11: Test E-commerce Endpoints

```bash
# Test marketplace listings
curl http://localhost:3001/api/v1/ecommerce/listings

# Test GI listings
curl http://localhost:3001/api/v1/ecommerce/gi-listings

# Test integration endpoints
curl http://localhost:3003001/api/v1/ecommerce-integration/dietitian-collections
```

---

## 🔧 TROUBLESHOOTING

### Issue: Database Connection Failed

**Error**: `ECONNREFUSED`

**Solution**:
```bash
# Check PostgreSQL is running
# Windows:
sc query postgresql-x64-13

# Linux:
sudo systemctl status postgresql

# macOS:
brew services list

# Start PostgreSQL if not running
# Windows:
net start postgresql-x64-13

# Linux:
sudo systemctl start postgresql

# macOS:
brew services start postgresql
```

### Issue: Migration Failed

**Error**: `relation already exists`

**Solution**:
```bash
# Check if tables already exist
psql -U postgres -d afrera_db -c "\dt"

# Drop tables if needed (CAUTION: This deletes data)
psql -U postgres -d afrera_db -c "DROP TABLE IF EXISTS product_listings CASCADE;"

# Re-run migration
node src/database/migrate.js
```

### Issue: Permission Denied

**Error**: `permission denied for database`

**Solution**:
```bash
# Grant privileges to user
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE afrera_db TO afrera_user;"

# Grant schema privileges
psql -U postgres -d afrera_db -c "GRANT ALL ON SCHEMA public TO afrera_user;"
```

---

## 📊 POST-MIGRATION CHECKLIST

- [ ] PostgreSQL installed and running
- [ ] Database `afrera_db` created
- [ ] Environment variables configured in `.env`
- [ ] Migration 3100_ecommerce_tables.sql executed successfully
- [ ] Migration 3101_ecommerce_integration_tables.sql executed successfully
- [ ] All 10 e-commerce tables created
- [ ] All 9 integration tables created
- [ ] All indexes created successfully
- [ ] Seed data inserted successfully
- [ ] Backend server starts without errors
- [ ] Health endpoint returns healthy status
- [ ] E-commerce routes accessible
- [ ] Integration routes accessible

---

## 🚀 PRODUCTION DEPLOYMENT NOTES

### Security Considerations

1. **Strong Database Password**
   - Use strong password for PostgreSQL user
   - Never commit `.env` file to version control
   - Use environment variables in production

2. **SSL/TLS Connection**
   - Enable SSL for database connections in production
   - Update `DATABASE_URL` to use `postgresql://` with `?sslmode=require`

3. **Database Backups**
   - Set up automated database backups
   - Test restore procedures
   - Document backup/restore process

### Performance Optimization

1. **Connection Pooling**
   - Configure appropriate pool size in `.env`
   - Monitor connection usage
   - Adjust based on traffic

2. **Index Optimization**
   - Monitor query performance
   - Add additional indexes if needed
   - Remove unused indexes

3. **Query Optimization**
   - Monitor slow queries
   - Optimize frequently used queries
   - Use EXPLAIN ANALYZE for query tuning

---

## 📚 ADDITIONAL RESOURCES

- PostgreSQL Documentation: https://www.postgresql.org/docs/
- Node.js PostgreSQL Driver: https://node-postgres.com/
- Database Migration Best Practices: https://github.com/golang-migrate/migrate

---

## 🎯 NEXT STEPS

After successful database setup:

1. **Day 2**: Test E-commerce API endpoints
2. **Day 3**: Test Integration API endpoints
3. **Day 4-7**: Implement frontend enhancements
4. **Day 8**: Test signal bus integration
5. **Day 9**: Complete documentation
6. **Day 10**: Final testing and launch

---

**Setup Guide Created**: August 11, 2026
**Status**: ✅ Ready for Execution
**Next Action**: Follow steps 1-11 to complete database setup
