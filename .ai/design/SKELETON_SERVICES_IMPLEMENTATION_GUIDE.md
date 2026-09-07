# Skeleton Services Implementation Guide

**Status:** Implementation Started  
**Date:** September 4, 2026  
**Progress:** 1/20 P0-P1 services implemented

---

## COMPLETED IMPLEMENTATIONS

### ✅ 1. Seller Verification Service (DONE)
**Files Created:**
- `backend/src/services/sellerVerificationService.js` (280 lines)
- `backend/src/routes/sellerVerifications.js` (140 lines)

**Methods Implemented:**
- `createVerificationRequest()` - Submit seller KYC documents
- `getVerificationStatus()` - Check verification state
- `verifySellerAccount()` - Admin approval with badge issuance
- `rejectVerification()` - Admin rejection with reason
- `getSellerCertifications()` - Fetch seller badges
- `calculateTrustScore()` - Composite trust scoring

**Routes Mounted:**
- `POST /sellers/:id/verify` - Submit verification
- `GET /sellers/:id/verification` - Get status
- `GET /sellers/:id/certifications` - Get badges + trust score
- `POST /admin/sellers/:id/verify` - Admin approve
- `POST /admin/sellers/:id/verify/reject` - Admin reject

**Database Tables Required:**
- `seller_verifications` (id, seller_id, status, documents, verified_date, etc.)
- `seller_profiles` (seller_id, verified, verification_id, etc.)
- `user_certifications` (user_id, certification_type, issued_date, etc.)

---

## IMPLEMENTATION TEMPLATE

Use this template for all other P0-P1 services:

```javascript
/**
 * [ServiceName] Service
 * [Brief description of what it does]
 *
 * Priority: [P0/P1]
 * Routes Needed: [list]
 */

const db = require('../database/dbConnection');
const logger = require('../utils/logger');
const { ValidationError, NotFoundError } = require('../utils/errors');

class [ServiceName]Service {
  // PRIMARY METHOD
  async [primaryAction](params) {
    try {
      // 1. Validate input
      if (!params.required_field) {
        throw new ValidationError('Missing required fields');
      }

      // 2. Query/validate existing data
      const existing = await db('[table]').where('id', params.id).first();
      if (!existing) throw new NotFoundError('Record not found');

      // 3. Execute business logic
      const result = await db('[table]').insert({
        // fields...
      }).returning('*');

      // 4. Log success
      logger.info(`[ServiceName] action succeeded: ${result.id}`);

      // 5. Return formatted response
      return {
        id: result.id,
        status: 'success',
        // ... other fields
      };
    } catch (error) {
      logger.error(`[ServiceName] failed: ${error.message}`);
      throw error;
    }
  }

  // SECONDARY METHOD
  async [secondaryAction](params) {
    // Similar structure...
  }
}

module.exports = new [ServiceName]Service();
```

---

## QUEUE: P0 SERVICES (7 Remaining)

### 2. Buyer Trust Service
**Priority:** P0  
**Purpose:** Calculate buyer trust score from order history & behavior  
**Key Methods:**
- `calculateBuyerTrustScore(buyerId)` - Aggregate trust from orders, reviews, disputes
- `getBuyerReputation(buyerId)` - Return trust badge for display
- `reportFraudSuspicion(buyerId, reason)` - Flag for review
- `getBuyerPaymentHistory(buyerId)` - Payment reliability metrics

**Routes:**
- `GET /buyers/:id/trust` - Get trust score
- `GET /buyers/:id/reputation` - Get badge for product cards
- `GET /buyers/:id/payment-history` - Payment metrics

**Database:**
- `buyer_profiles` table
- `buyer_trust_history` table

---

### 3. Product Certification Service
**Priority:** P0  
**Purpose:** Manage product certifications (GI, organic, fair-trade)  
**Key Methods:**
- `addCertification(productId, certData)` - Add cert to product
- `verifyCertification(certCode)` - Validate against GI registry
- `getProductCertifications(productId)` - List all certs
- `revokeCertification(certId, reason)` - Remove cert

**Routes:**
- `POST /products/:id/certifications` - Add cert
- `POST /certifications/:id/verify` - Validate cert code
- `GET /products/:id/certifications` - List certs
- `DELETE /certifications/:id` - Revoke cert

**Database:**
- `product_certifications` table
- `certification_registry` table (link to external GI/organic databases)

---

### 4. Loan Management Service
**Priority:** P0  
**Purpose:** Enable loans for farmers (short-term, seasonal)  
**Key Methods:**
- `createLoanApplication(farmerId, loanData)` - Submit application
- `getLoanStatus(loanId)` - Check approval status
- `approveLoan(loanId)` - Admin approval
- `disburseLoan(loanId)` - Release funds
- `trackRepayment(loanId)` - Payment tracking

**Routes:**
- `POST /loans/apply` - Submit application
- `GET /loans/:id` - Get loan status
- `POST /admin/loans/:id/approve` - Admin approve
- `POST /loans/:id/disburse` - Release funds
- `GET /loans/:id/payments` - Payment history

**Database:**
- `loans` table
- `loan_applications` table
- `loan_payments` table

---

### 5. Subscription Service
**Priority:** P0  
**Purpose:** Recurring payments for premium features  
**Key Methods:**
- `createSubscription(userId, planId)` - Start subscription
- `getActiveSubscription(userId)` - Get current plan
- `upgradeSubscription(userId, newPlanId)` - Change tier
- `cancelSubscription(subscriptionId)` - Unsubscribe
- `processRecurringPayment(subscriptionId)` - Auto-charge

**Routes:**
- `POST /subscriptions` - Create subscription
- `GET /users/:id/subscription` - Get active plan
- `PUT /subscriptions/:id/upgrade` - Upgrade plan
- `DELETE /subscriptions/:id` - Cancel

**Database:**
- `subscriptions` table
- `subscription_plans` table
- `subscription_payments` table

---

### 6. Price Forecasting Service
**Priority:** P0  
**Purpose:** ML-based price predictions for products  
**Key Methods:**
- `forecastProductPrice(productId, days)` - LSTM prediction
- `getHistoricalPrices(productId)` - Fetch price history
- `trainModel(productCategory)` - Retrain ML model
- `calculateConfidence(forecast)` - Return confidence score
- `generateTimeseries(forecast, days)` - Format forecast

**Routes:**
- `GET /products/:id/price-forecast` - Get 30-day forecast
- `GET /products/:id/price-history` - Historical prices
- `GET /categories/:cat/price-trends` - Category trends
- `POST /admin/models/retrain` - Admin retrain model

**Database:**
- `price_history` table
- `ml_models` table (cached models)
- `price_forecasts` table (cache results)

**ML Setup:**
- TensorFlow.js for LSTM model
- Historical data points: min 365 days
- Retraining: weekly or on manual trigger
- Model file storage: S3 or local cache

---

### 7. Weather Advisory Service
**Priority:** P0  
**Purpose:** Weather forecasts + crop-specific advisory  
**Key Methods:**
- `getWeatherAdvisory(lat, lng)` - Fetch forecast + advisory
- `generateCropAdvisory(weather, cropType)` - Crop-specific tips
- `checkAlerts(forecast)` - Detect frost/flood/drought risk
- `getHistoricalWeather(location, days)` - Past weather data
- `cacheWeather(location, data)` - Cache 1-hour

**Routes:**
- `GET /weather/:lat/:lng/advisory` - Forecast + advisory
- `GET /weather/:lat/:lng/crop-advisory` - Crop-specific tips
- `GET /weather/:lat/:lng/alerts` - Risk alerts
- `GET /weather/history` - Historical data

**Database:**
- `weather_cache` table
- `weather_alerts` table
- `crop_advisory_rules` table (if/then rules)

**External Integration:**
- OpenWeatherMap API
- Cache: Redis (1 hour)
- Rate limit: 100 calls/min

---

### 8. Crop Recommendation Service
**Priority:** P0  
**Purpose:** ML-based crop recommendations for farmers  
**Key Methods:**
- `recommendCrops(farmerId, location, season)` - Top 5 crops
- `getCropGuidance(cropType, phase)` - Step-by-step guide
- `getMarketOutlook(cropType)` - Price forecast + demand
- `calculateROI(crop, inputs)` - Profit potential
- `getSimilarFarms(farmerId)` - Peer comparison

**Routes:**
- `POST /recommendations/crops` - Get recommendations
- `GET /crops/:type/guidance` - Crop guide
- `GET /crops/:type/market-outlook` - Market data
- `POST /crops/:type/calculate-roi` - Profit calculator
- `GET /farms/:id/similar` - Peer farms

**Database:**
- `crop_recommendations` table
- `crop_guidance` table (rich content)
- `farm_profiles` table (location, size, soil, etc.)
- `crop_market_data` table (prices, demand)

**ML Setup:**
- Algorithm: decision tree or random forest
- Input features: location, soil, water, season, farm size
- Training data: 5+ years historical crop yields
- Update quarterly

---

## IMPLEMENTATION CHECKLIST (Each Service)

### Step 1: Schema Definition
- [ ] Identify required database tables
- [ ] Define columns/data types
- [ ] Create migration file
- [ ] Add foreign keys/relationships
- [ ] Add indexes on frequently queried fields

### Step 2: Service Implementation
- [ ] Create service class with methods
- [ ] Add input validation
- [ ] Implement error handling
- [ ] Add logging at key points
- [ ] Cover all business logic
- [ ] Add caching where applicable

### Step 3: Routes
- [ ] Create route file
- [ ] Map CRUD operations to endpoints
- [ ] Add authentication middleware
- [ ] Add authorization checks (admin vs user)
- [ ] Add request validation
- [ ] Document each route with JSDoc

### Step 4: Database Tables
Create migration file with:
```sql
CREATE TABLE [table_name] (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  [fields],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_[table]_[field] ON [table]([field]);
```

### Step 5: Integration
- [ ] Mount routes in `backend/src/index.js`
- [ ] Add to service registry
- [ ] Test locally with Postman
- [ ] Test error cases
- [ ] Verify logs working

### Step 6: Testing
- [ ] Unit tests (70%+ coverage)
- [ ] Integration tests
- [ ] Load testing if applicable
- [ ] Error case testing

### Step 7: Documentation
- [ ] JSDoc comments on all methods
- [ ] OpenAPI/Swagger documentation
- [ ] Example requests/responses
- [ ] Database schema diagram

---

## PARALLEL DEVELOPMENT STRATEGY

**To implement all 8 P0 services in parallel:**

**Team Setup (assume 3 backend devs):**
- Dev 1: Services 2-3 (Buyer Trust, Product Certification)
- Dev 2: Services 4-5 (Loan Management, Subscription)
- Dev 3: Services 6-8 (Price Forecasting, Weather, Crop Recommendation)

**Each dev:**
1. Creates service file + routes file (follow template)
2. Creates database migration
3. Tests locally
4. Submits PR for review
5. Integrates into main backend

**Timeline:** 2 weeks (parallel work)

**Week 1:**
- Day 1-2: Setup + schema + service scaffolds
- Day 3-4: Implement methods + routes
- Day 5: Local testing + bug fixes

**Week 2:**
- Day 1-2: Integration testing
- Day 3-4: PR reviews + fixes
- Day 5: Merge + final validation

---

## MOUNT ROUTES IN BACKEND INDEX

Add to `backend/src/index.js`:

```javascript
// Marketplace Services
const sellerVerificationsRouter = require('./routes/sellerVerifications');
const buyerTrustRouter = require('./routes/buyerTrust');
const productCertificationsRouter = require('./routes/productCertifications');
const loanManagementRouter = require('./routes/loanManagement');
const subscriptionRouter = require('./routes/subscriptions');
const priceForecastingRouter = require('./routes/priceForecasting');
const weatherAdvisoryRouter = require('./routes/weatherAdvisory');
const cropRecommendationRouter = require('./routes/cropRecommendations');

// Mount routes
app.use('/api/v1', sellerVerificationsRouter);
app.use('/api/v1', buyerTrustRouter);
app.use('/api/v1', productCertificationsRouter);
app.use('/api/v1', loanManagementRouter);
app.use('/api/v1', subscriptionRouter);
app.use('/api/v1', priceForecastingRouter);
app.use('/api/v1', weatherAdvisoryRouter);
app.use('/api/v1', cropRecommendationRouter);
```

---

## DATABASE MIGRATION TEMPLATE

Create file: `backend/src/database/migrations/[NNNN]_[service_name].sql`

```sql
-- Create [Service Name] tables

CREATE TABLE [primary_table] (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  [field1] [TYPE] NOT NULL,
  [field2] [TYPE],
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id),
  CONSTRAINT unique_constraint UNIQUE([fields])
);

CREATE INDEX idx_[table]_status ON [primary_table](status);
CREATE INDEX idx_[table]_created ON [primary_table](created_at);

-- Add foreign keys if needed
ALTER TABLE [table] ADD CONSTRAINT fk_[table]_[ref]
  FOREIGN KEY ([field]) REFERENCES [ref_table]([id]);
```

---

## TESTING CHECKLIST (Per Service)

```bash
# Run migrations
npm run migrate

# Unit tests
npm test -- src/services/[serviceName].test.js

# Integration test
curl -X POST http://localhost:3000/api/v1/[endpoint] \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"required":"fields"}'

# Expected response:
# {
#   "success": true,
#   "data": {...},
#   "message": "..."
# }
```

---

## SUCCESS CRITERIA

All 8 P0 services deployed when:
- ✅ All services have working routes
- ✅ All routes return valid JSON responses
- ✅ All services use consistent error handling
- ✅ All services have logging
- ✅ All services have 70%+ test coverage
- ✅ Frontend can call all endpoints successfully
- ✅ No OWASP vulnerabilities found
- ✅ Load test: 100 requests/sec per service without errors

---

## NEXT PHASE (After P0 Complete)

Once P0 services deployed, move to **P1 services (Week 3-4):**
1. Supply Chain Tracking
2. Warehouse Management
3. Cold Chain Monitoring
4. Farm Costing
5. Yield Management
6. Soil Health Testing
7. Audit Logging

Use same template, same parallel approach.

---

**Status:** 1/8 P0 services completed  
**Next Action:** Implement services 2-8 using template above  
**Estimated Completion:** 2 weeks (parallel development)

