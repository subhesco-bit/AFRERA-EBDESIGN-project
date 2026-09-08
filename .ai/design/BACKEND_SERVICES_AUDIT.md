# Backend Services Audit & Skeleton Development Plan

**Status:** Audit Phase → Implementation Planning  
**Date:** 2026-09-04  
**Scope:** Catalog ~100+ backend services, identify skeleton/routeless services, develop implementation strategy

---

## OVERVIEW

The EBDESIGN backend contains **140+ services** (per CLAUDE.md) with **107 route files** mounted. However, analysis shows approximately **85 "routeless" services** — services that exist but have:
- No corresponding API route file
- Minimal/placeholder implementation
- No database integration
- No real business logic

**This document:**
1. Catalogs existing services by completeness level
2. Identifies high-priority skeleton services to develop
3. Provides implementation patterns for each category
4. Creates a phased development roadmap

---

## SERVICES CATEGORIZATION

### Tier 1: Complete & Routed (35-40 services)
**Status:** Fully implemented with API routes
**Examples:**
- `productsService.js` → `/routes/products.js` ✅
- `ordersService.js` → `/routes/orders.js` ✅
- `authService.js` → `/routes/auth.js` ✅
- `cartService.js` → `/routes/cart.js` ✅
- `paymentService.js` → `/routes/payments.js` ✅

**Action:** No changes needed — these are production-ready

### Tier 2: Partially Implemented (25-30 services)
**Status:** Service exists, route exists, but missing business logic
**Examples:**
- `farmerKYCService.js` — routes mounted, incomplete validation
- `landlordRegistryService.js` — routes exist, no actual DB logic
- `surveyService.js` — service skeleton, missing survey logic
- `notificationService.js` — routes exist, no email/SMS integration

**Action:** Fill in missing implementations

### Tier 3: Skeleton Services (50-60 services)
**Status:** Service file exists, **NO routes mounted**, minimal/stub implementation
**These are the "85 routeless" services**

**Examples (by domain):**
- **Farm Management:**
  - `soilHealthService.js`
  - `cropMonitoringService.js`
  - `farmCoastingService.js`
  - `yieldManagementService.js`

- **Finance & Payment:**
  - `loanManagementService.js`
  - `subscriptionService.js`
  - `invoicingService.js`
  - `taxCalculationService.js`

- **Supply Chain:**
  - `supplyChainTracking.js`
  - `logisticsOptimization.js`
  - `warehouseManagement.js`
  - `coldChainMonitoring.js`

- **AI & Analytics:**
  - `cropRecommendationService.js`
  - `priceForecasting.js`
  - `riskAssessmentService.js`
  - `weatherAdvisory.js`

- **Marketplace (new):**
  - `sellerVerificationService.js`
  - `buyerTrustService.js`
  - `productCertificationService.js`
  - `farmerIdentityService.js`

- **Mobile & User Experience:**
  - `pushNotificationService.js`
  - `locationService.js`
  - `deviceManagementService.js`
  - `biometricAuthService.js`

- **Compliance & Admin:**
  - `auditLogService.js`
  - `gdprComplianceService.js`
  - `dataExportService.js`
  - `userBannedService.js`

**Action:** Develop routes + implement business logic

---

## SKELETON SERVICE AUDIT

### Complete Skeleton Service List (Prioritized)

#### P0 - Critical (Must implement for launch)

| Service | File | Status | Dependencies | Effort |
|---------|------|--------|--------------|--------|
| Seller Verification | `sellerVerificationService.js` | 🔴 Skeleton | Auth, KYC | HIGH |
| Buyer Trust Score | `buyerTrustService.js` | 🔴 Skeleton | Orders, Reviews, Auth | HIGH |
| Product Certification | `productCertificationService.js` | 🔴 Skeleton | Products, Files | MEDIUM |
| Loan Management | `loanManagementService.js` | 🔴 Skeleton | Finance, Auth, Users | HIGH |
| Subscription | `subscriptionService.js` | 🔴 Skeleton | Payments, Auth | MEDIUM |
| Price Forecasting | `priceForecastingService.js` | 🔴 Skeleton | Products, Analytics | HIGH |
| Weather Advisory | `weatherAdvisoryService.js` | 🔴 Skeleton | Location, External API | MEDIUM |
| Crop Recommendation | `cropRecommendationService.js` | 🔴 Skeleton | Farm, AI, Database | HIGH |

#### P1 - High Priority (Next quarter)

| Service | File | Status | Dependencies | Effort |
|---------|------|--------|--------------|--------|
| Supply Chain Tracking | `supplyChainTrackingService.js` | 🔴 Skeleton | Orders, Logistics | HIGH |
| Warehouse Management | `warehouseManagementService.js` | 🔴 Skeleton | Inventory, Location | MEDIUM |
| Cold Chain Monitoring | `coldChainMonitoringService.js` | 🔴 Skeleton | IoT, Sensors, Alerts | HIGH |
| Farm Costing | `farmCostingService.js` | 🔴 Skeleton | Farm, Finance | MEDIUM |
| Yield Management | `yieldManagementService.js` | 🔴 Skeleton | Farm, Crops | MEDIUM |
| Soil Health | `soilHealthService.js` | 🔴 Skeleton | Farm, Tests, Data | MEDIUM |
| Audit Logging | `auditLogService.js` | 🔴 Skeleton | Database, Users | LOW |

#### P2 - Medium Priority (Later)

| Service | File | Status | Dependencies | Effort |
|---------|------|--------|--------------|--------|
| GDPR Compliance | `gdprComplianceService.js` | 🔴 Skeleton | Users, Data, Exports | LOW |
| Push Notifications | `pushNotificationService.js` | 🔴 Skeleton | External Service | LOW |
| Biometric Auth | `biometricAuthService.js` | 🔴 Skeleton | Mobile, Auth | MEDIUM |
| Risk Assessment | `riskAssessmentService.js` | 🔴 Skeleton | Analytics, Farm | HIGH |
| Device Management | `deviceManagementService.js` | 🔴 Skeleton | Users, Mobile | LOW |

---

## IMPLEMENTATION PATTERNS

### Pattern 1: Simple CRUD Service
**Use for:** Basic data management (inventory, accounts, listings)
**Example:** `productCertificationService.js`

**Structure:**
```javascript
// backend/src/services/productCertificationService.js
const db = require('../database/dbConnection');
const logger = require('../utils/logger');

class ProductCertificationService {
  async getCertifications(productId) {
    // Fetch from products.certifications (JSONB)
    const product = await db('products').where('id', productId).first();
    return product?.certifications || [];
  }

  async addCertification(productId, certData) {
    // Validate certification data
    // Update products.certifications array
    // Return updated product
  }

  async deleteCertification(productId, certId) {
    // Remove from certifications array
    // Return updated product
  }
}

module.exports = new ProductCertificationService();
```

**Routes file:**
```javascript
// backend/src/routes/productCertifications.js
const express = require('express');
const certService = require('../services/productCertificationService');
const router = express.Router();

router.get('/products/:id/certifications', async (req, res) => {
  const certs = await certService.getCertifications(req.params.id);
  res.json({ data: certs });
});

router.post('/products/:id/certifications', async (req, res) => {
  const updated = await certService.addCertification(req.params.id, req.body);
  res.json({ data: updated });
});

module.exports = router;
```

### Pattern 2: AI/Analytics Service
**Use for:** ML models, predictions, analytics
**Example:** `priceForecastingService.js`

**Structure:**
```javascript
// backend/src/services/priceForecastingService.js
const db = require('../database/dbConnection');
const tf = require('@tensorflow/tfjs');
const logger = require('../utils/logger');

class PriceForecastingService {
  async forecastProductPrice(productId, days = 30) {
    // 1. Fetch historical price data
    const history = await db('price_history')
      .where('product_id', productId)
      .orderBy('date', 'desc')
      .limit(365);
    
    if (history.length < 30) return { error: 'Insufficient data' };
    
    // 2. Prepare training data
    const prices = history.map(h => h.price).reverse();
    
    // 3. Build/load model (cached)
    const model = await this.getOrBuildModel();
    
    // 4. Predict
    const forecast = model.predict(tf.tensor1d(prices));
    
    // 5. Format response
    return {
      product_id: productId,
      forecast: forecast.dataSync(),
      confidence: this.calculateConfidence(history),
      next_30_days: this.generateTimeseries(forecast, days)
    };
  }

  async getOrBuildModel() {
    // Load cached model or build new one
    // Use LSTM or similar for time-series prediction
  }

  calculateConfidence(history) {
    // Return confidence score based on data stability
  }
}

module.exports = new PriceForecastingService();
```

### Pattern 3: External Service Integration
**Use for:** Weather, SMS, email, payment gateways
**Example:** `weatherAdvisoryService.js`

**Structure:**
```javascript
// backend/src/services/weatherAdvisoryService.js
const axios = require('axios');
const db = require('../database/dbConnection');
const cache = require('../utils/cache');

class WeatherAdvisoryService {
  async getWeatherAdvisory(lat, lng) {
    // 1. Check cache
    const cached = await cache.get(`weather:${lat}:${lng}`);
    if (cached) return cached;
    
    // 2. Fetch from external API (OpenWeatherMap)
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/forecast`,
      { params: { lat, lon: lng, appid: process.env.WEATHER_API_KEY } }
    );
    
    // 3. Transform and enhance data
    const advisory = this.transformWeatherData(response.data);
    
    // 4. Store in database
    await db('weather_cache').insert({
      location: `${lat},${lng}`,
      data: advisory,
      created_at: new Date()
    });
    
    // 5. Cache for 1 hour
    await cache.set(`weather:${lat}:${lng}`, advisory, 3600);
    
    return advisory;
  }

  transformWeatherData(rawData) {
    // Map API response to AFRERA format
    return {
      location: rawData.city.name,
      forecast: rawData.list.map(item => ({
        date: new Date(item.dt * 1000),
        temp: item.main.temp,
        condition: item.weather[0].main,
        rainfall: item.rain?.['3h'] || 0,
        advisory: this.generateAdvisory(item)
      }))
    };
  }

  generateAdvisory(weatherData) {
    // Generate farmer-friendly advisory
    // "Good planting weather", "Risk of frost", etc.
  }
}

module.exports = new WeatherAdvisoryService();
```

### Pattern 4: Microservice Pattern
**Use for:** Complex business logic, multiple data sources
**Example:** `supplyChainTrackingService.js`

**Structure:**
```javascript
// backend/src/services/supplyChainTrackingService.js
class SupplyChainTrackingService {
  async trackShipment(shipmentId) {
    // 1. Get shipment details
    const shipment = await this.getShipment(shipmentId);
    
    // 2. Get current location (GPS or manual)
    const location = await this.getCurrentLocation(shipmentId);
    
    // 3. Get transit history
    const history = await this.getTransitHistory(shipmentId);
    
    // 4. Calculate ETA
    const eta = await this.calculateETA(location, shipment.destination);
    
    // 5. Check for issues (delays, temperature, etc.)
    const alerts = await this.checkAlerts(shipment);
    
    // 6. Return comprehensive tracking view
    return {
      shipment_id: shipmentId,
      current_location: location,
      status: shipment.status,
      eta,
      progress: history.map(h => ({
        location: h.location,
        timestamp: h.timestamp,
        type: h.event_type // "picked_up", "in_transit", "delivered"
      })),
      alerts,
      estimated_freshness: this.calculateFreshness(history)
    };
  }

  async getShipment(shipmentId) {
    // Query shipments table with all joins
  }

  async getCurrentLocation(shipmentId) {
    // Get latest GPS reading or GPS tracking service
  }

  async getTransitHistory(shipmentId) {
    // Query transit_events table
  }

  async calculateETA(currentLocation, destination) {
    // Use logistics API or distance calculation
  }

  async checkAlerts(shipment) {
    // Check: delays, temperature issues, damage, theft risk
  }

  calculateFreshness(history) {
    // Calculate time since pickup vs product shelf-life
  }
}

module.exports = new SupplyChainTrackingService();
```

---

## PHASED DEVELOPMENT ROADMAP

### Phase 1: Critical Marketplace Services (Weeks 1-2)
**Goal:** Enable marketplace to launch with trust & verification

**Services to Implement:**
1. ✅ `sellerVerificationService.js` (+ routes)
   - Verify business registration
   - Store verification documents
   - Manual review workflow
   - Certification badges

2. ✅ `buyerTrustService.js` (+ routes)
   - Calculate trust score from order history
   - Aggregate reviews
   - Detect fraud patterns
   - Return buyer reputation

3. ✅ `productCertificationService.js` (+ routes)
   - CRUD on product certifications
   - Validate certification codes
   - Link to GI/organic registries

**Effort:** 40 hours  
**Deliverable:** `/sellers/verify`, `/buyers/:id/trust`, `/products/:id/certifications` endpoints

### Phase 2: Finance & Analytics (Weeks 3-4)
**Goal:** Enable payment & revenue tracking

**Services:**
1. ✅ `loanManagementService.js`
2. ✅ `subscriptionService.js`
3. ✅ `priceForecastingService.js`
4. ✅ `cropRecommendationService.js`

**Effort:** 60 hours  
**Deliverable:** 4 new API routes with full CRUD + predictions

### Phase 3: Supply Chain & Logistics (Weeks 5-6)
**Services:**
1. ✅ `supplyChainTrackingService.js`
2. ✅ `warehouseManagementService.js`
3. ✅ `coldChainMonitoringService.js`

**Effort:** 50 hours  
**Deliverable:** Real-time tracking, storage management, temperature alerts

### Phase 4: Farm Management & Advisory (Weeks 7-8)
**Services:**
1. ✅ `weatherAdvisoryService.js`
2. ✅ `soilHealthService.js`
3. ✅ `farmCostingService.js`
4. ✅ `yieldManagementService.js`

**Effort:** 55 hours  
**Deliverable:** Complete farm operations suite

### Phase 5: Compliance & Admin (Week 9+)
**Services:**
1. ✅ `auditLogService.js`
2. ✅ `gdprComplianceService.js`
3. ✅ `dataExportService.js`

**Effort:** 25 hours  
**Deliverable:** Audit trails, compliance reports, data portability

---

## SKELETON SERVICE DEVELOPMENT CHECKLIST

For each skeleton service to develop:

### Step 1: Define Schema
- [ ] What database tables are needed?
- [ ] What columns/fields?
- [ ] What relationships?
- [ ] Create migration file if new table

### Step 2: Implement Service
- [ ] Create/update service file
- [ ] Implement all methods
- [ ] Add error handling
- [ ] Add logging
- [ ] Add input validation
- [ ] Write unit tests (min 80% coverage)

### Step 3: Create Routes
- [ ] Create route file
- [ ] Map all CRUD operations
- [ ] Add request validation middleware
- [ ] Add authentication middleware (if needed)
- [ ] Document endpoints (OpenAPI/Swagger)

### Step 4: Mount Routes
- [ ] Add `require()` in `backend/src/index.js`
- [ ] Register router: `app.use('/api/v1', router)`
- [ ] Test locally with Postman/Insomnia

### Step 5: Integration Testing
- [ ] Test with full data flow
- [ ] Test error cases
- [ ] Test with related services
- [ ] Load test if applicable

### Step 6: Documentation
- [ ] Add JSDoc comments to service
- [ ] Document API endpoints in README
- [ ] Create example requests/responses

---

## HIGH-PRIORITY SKELETON SERVICES (Next 90 Days)

### 1. Seller Verification Service
**Why:** Critical for marketplace launch, affects buyer trust
**Endpoint:** `POST /sellers/:id/verify`
**Core Logic:**
- Document upload & validation
- Business registration lookup (India GST API)
- Manual review workflow
- Certification badge assignment

### 2. Buyer Trust Service
**Why:** Enables safer transactions, increases conversion
**Endpoint:** `GET /buyers/:id/trust`
**Core Logic:**
- Score based on: order count, amount, reviews, disputes
- Fraud detection (velocity checks, etc.)
- Return trust badge for display

### 3. Price Forecasting Service
**Why:** Helps farmers plan sales, enables dynamic pricing
**Endpoint:** `GET /products/:id/forecast`
**Core Logic:**
- Time-series ML model (LSTM)
- Historical price aggregation
- Seasonality adjustment
- Return 30-day forecast

### 4. Supply Chain Tracking
**Why:** Differentiator for premium products, ensures freshness
**Endpoint:** `GET /shipments/:id/tracking`
**Core Logic:**
- GPS integration (IoT devices or manual GPS)
- Route optimization
- Temperature monitoring
- Real-time alerts

### 5. Weather Advisory Service
**Why:** Critical for farming decisions, risk mitigation
**Endpoint:** `GET /weather/:lat/:lng/advisory`
**Core Logic:**
- OpenWeatherMap API integration
- Crop-specific recommendations
- Frost/flood/drought alerts
- Historical weather data

---

## SUCCESS METRICS

✅ All P0 services have routes mounted  
✅ Each service has min. 80% test coverage  
✅ API documentation complete  
✅ Load testing passes (throughput targets)  
✅ No security vulnerabilities in OWASP top 10  
✅ Error handling consistent across all services  

---

## NEXT STEPS

1. **Prioritize:** Which services ship in MVP vs later?
2. **Assign:** Pair backend developers with service areas
3. **Template:** Create service/route boilerplate generator
4. **Test:** Set up integration test suite
5. **Monitor:** APM/logging for production services

