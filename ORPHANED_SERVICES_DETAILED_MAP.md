# 🔴 ORPHANED SERVICES - DETAILED MAPPING & RESOLUTION

## Summary of Orphaned Services

These services have `setupRoutes()` methods defined but are **NEVER CALLED** in the main application:

| Service | File | Route Method | Status | Fix |
|---------|------|--------------|--------|-----|
| dynamicPricingService | services/legacy/dynamicPricingService.js | setupRoutes() | ❌ Orphaned | Mount |
| farmerTrainingService | services/legacy/farmerTrainingService.js | setupRoutes() | ❌ Orphaned | Mount |
| governmentSchemeService | services/legacy/governmentSchemeService.js | setupRoutes() | ❌ Orphaned | Mount |
| greenhouseService | services/legacy/greenhouseService.js | setupRoutes() | ❌ Orphaned | Mount |
| insuranceClaimsService | services/legacy/insuranceClaimsService.js | setupRoutes() | ❌ Orphaned | Mount |
| preSeasonOrderService | services/legacy/preSeasonOrderService.js | setupRoutes() | ❌ Orphaned | Mount |
| sharedInfraService | services/legacy/sharedInfraService.js | setupRoutes() | ❌ Orphaned | Mount |
| soilTestingService | services/legacy/soilTestingService.js | setupRoutes() | ❌ Orphaned | Mount |
| subsidyService | services/legacy/subsidyService.js | setupRoutes() | ❌ Orphaned | Mount |

---

## Detailed Service Profiles

### 1. Dynamic Pricing Service

**File**: `backend/src/services/legacy/dynamicPricingService.js`

**Purpose**: Calculate dynamic prices based on supply/demand, seasonality, location

**Database Tables**:
- `dynamic_prices`
- `price_elasticity`
- `market_factors`

**Exported Routes**:
```javascript
GET  /api/v1/pricing/current/:product_id
GET  /api/v1/pricing/forecast/:product_id
POST /api/v1/pricing/calculate
PUT  /api/v1/pricing/:id
```

**Current Status**: Service loaded but routes never mounted to Express app

**Required Fix**:
```javascript
// Add to backend/src/index.js around line 500:
if (dynamicPricingService && typeof dynamicPricingService.setupRoutes === 'function') {
  dynamicPricingService.setupRoutes(app);
  logger.info('Dynamic Pricing Service initialized');
}
```

**Frontend Integration**:
- File: `frontend/src/pages/PricingManagement.jsx`
- Needs API calls to: `/api/v1/pricing/*`
- Current status: Page exists but no backend

---

### 2. Farmer Training Service

**File**: `backend/src/services/legacy/farmerTrainingService.js`

**Purpose**: Manage farmer training programs, courses, certifications

**Database Tables**:
- `training_programs`
- `training_modules`
- `farmer_training_records`
- `training_certifications`

**Exported Routes**:
```javascript
GET  /api/v1/training/programs
GET  /api/v1/training/programs/:id
POST /api/v1/training/programs
GET  /api/v1/training/my-courses
POST /api/v1/training/enroll
GET  /api/v1/training/certificates
```

**Current Status**: Service exists, setupRoutes() defined, but never called

**Required Fix**:
```javascript
// Add to backend/src/index.js:
if (farmerTrainingService && typeof farmerTrainingService.setupRoutes === 'function') {
  farmerTrainingService.setupRoutes(app);
  logger.info('Farmer Training Service initialized');
}
```

**Frontend Integration**:
- File: `frontend/src/pages/TrainingCatalog.jsx`
- File: `frontend/src/pages/MyCourses.jsx`
- These pages exist but make no API calls

---

### 3. Government Scheme Service

**File**: `backend/src/services/legacy/governmentSchemeService.js`

**Purpose**: Manage government subsidies, loans, insurance schemes

**Database Tables**:
- `government_schemes`
- `scheme_eligibility`
- `scheme_applications`
- `scheme_documents`

**Exported Routes**:
```javascript
GET  /api/v1/schemes
GET  /api/v1/schemes/:id
GET  /api/v1/schemes/check-eligibility
POST /api/v1/schemes/apply
GET  /api/v1/schemes/my-applications
PUT  /api/v1/schemes/applications/:id
```

**Current Status**: Orphaned

**Frontend Pages Waiting**:
- `frontend/src/pages/GovernmentSchemes.jsx`
- `frontend/src/pages/SchemeApplications.jsx`

---

### 4. Greenhouse Service

**File**: `backend/src/services/legacy/greenhouseService.js`

**Purpose**: Manage greenhouse operations, monitoring, automation

**Database Tables**:
- `greenhouses`
- `greenhouse_sensors`
- `greenhouse_climate_logs`
- `greenhouse_alerts`

**Exported Routes**:
```javascript
GET  /api/v1/greenhouse
GET  /api/v1/greenhouse/:id
POST /api/v1/greenhouse
GET  /api/v1/greenhouse/:id/sensors
GET  /api/v1/greenhouse/:id/climate
POST /api/v1/greenhouse/:id/alert
```

**Current Status**: Orphaned

---

### 5. Insurance Claims Service

**File**: `backend/src/services/legacy/insuranceClaimsService.js`

**Purpose**: Process insurance claims, track status, manage payouts

**Database Tables**:
- `insurance_claims`
- `claim_documents`
- `claim_status_history`
- `claim_payouts`

**Exported Routes**:
```javascript
GET  /api/v1/claims
POST /api/v1/claims
GET  /api/v1/claims/:id
PUT  /api/v1/claims/:id/status
GET  /api/v1/claims/:id/documents
POST /api/v1/claims/:id/document
```

**Current Status**: Orphaned

---

### 6. Pre-Season Order Service

**File**: `backend/src/services/legacy/preSeasonOrderService.js`

**Purpose**: Pre-season ordering system for crops, inputs, equipment

**Database Tables**:
- `pre_season_orders`
- `pre_season_order_items`
- `pre_season_pricing`

**Exported Routes**:
```javascript
GET  /api/v1/preseason/catalog
GET  /api/v1/preseason/orders
POST /api/v1/preseason/orders
GET  /api/v1/preseason/orders/:id
PUT  /api/v1/preseason/orders/:id
```

**Current Status**: Orphaned

---

### 7. Shared Infrastructure Service

**File**: `backend/src/services/legacy/sharedInfraService.js`

**Purpose**: Manage shared farm infrastructure (storage, processing, equipment)

**Note**: There's ALSO a `sharedInfrastructureService` which IS mounted. This appears to be a duplicate or legacy version.

**Current Status**: Duplicate/Orphaned

**Fix**: Either merge or remove this orphaned version

---

### 8. Soil Testing Service

**File**: `backend/src/services/legacy/soilTestingService.js`

**Purpose**: Soil test reports, recommendations, tracking

**Database Tables**:
- `soil_tests`
- `soil_test_reports`
- `soil_recommendations`

**Note**: There ARE soil management routes mounted, but this specific service appears orphaned

**Current Status**: Orphaned (but similar functionality may exist elsewhere)

---

### 9. Subsidy Service

**File**: `backend/src/services/legacy/subsidyService.js`

**Purpose**: Manage agricultural subsidies, allocations, distributions

**Database Tables**:
- `subsidies`
- `subsidy_allocations`
- `subsidy_claims`
- `subsidy_distributions`

**Exported Routes**:
```javascript
GET  /api/v1/subsidy
GET  /api/v1/subsidy/my-eligibility
POST /api/v1/subsidy/claim
GET  /api/v1/subsidy/claims/:id
```

**Current Status**: Orphaned

---

## Additional Orphaned/Malformed Services

### Digital Twin Service

**File**: `backend/src/services/legacy/digitalTwinService.js`

**Status**: ⚠️ BROKEN - References non-existent tables

**Issue**:
```javascript
// In digitalTwinService.js - references wrong schema:
const farms = await db.query('SELECT * FROM farms WHERE id = $1');
// ERROR: Table "farms" doesn't exist!
// Should reference different schema
```

**Note**: A CORRECT digital twin service exists elsewhere that works properly.

**Fix**: Delete this orphaned version, keep the working one

---

## Automatic Fix Script

Create `backend/scripts/mountOrphanedServices.js`:

```javascript
/**
 * Script to identify and mount orphaned services
 * Run: node scripts/mountOrphanedServices.js
 */

const fs = require('fs');
const path = require('path');

const orphanedServices = [
  'dynamicPricingService',
  'farmerTrainingService',
  'governmentSchemeService',
  'greenhouseService',
  'insuranceClaimsService',
  'preSeasonOrderService',
  'sharedInfraService',
  'soilTestingService',
  'subsidyService',
];

const serviceToPath = (name) => {
  return `./services/legacy/${name}.js`;
};

const serviceToRoute = (name) => {
  // Convert camelCase to kebab-case and remove 'Service'
  return '/' + name
    .replace(/Service$/, '')
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/^-/, '');
};

console.log('🔍 Orphaned Services Audit\n');
console.log('Services to mount:\n');

orphanedServices.forEach(service => {
  const path = serviceToPath(service);
  const route = serviceToRoute(service);
  
  console.log(`// ${service}`);
  console.log(`if (${service} && typeof ${service}.setupRoutes === 'function') {`);
  console.log(`  ${service}.setupRoutes(app);`);
  console.log(`  logger.info('${service} initialized at /api/v1${route}');`);
  console.log(`}\n`);
});

console.log('\nAdd this to backend/src/index.js around line 500');
```

---

## Implementation Priority

### Phase 1: CRITICAL (Do First)
1. Mount Dynamic Pricing Service (used by marketplace)
2. Mount Government Scheme Service (compliance)
3. Fix health endpoints

### Phase 2: HIGH (Do Second)
4. Mount Training Service
5. Mount Insurance Claims Service
6. Mount Greenhouse Service

### Phase 3: MEDIUM (Do Third)
7. Mount Pre-Season Order Service
8. Mount Subsidy Service
9. Audit/Fix Shared Infra & Soil Testing

### Phase 4: CLEANUP (Do Last)
10. Delete broken/duplicate services
11. Generate API documentation
12. Update frontend integrations

---

## Validation Checklist

After mounting each service:

- [ ] Service requires all dependencies
- [ ] Service database tables exist
- [ ] Service routes are accessible
- [ ] Service returns valid JSON
- [ ] Service error handling works
- [ ] Frontend can call service
- [ ] Service passes tests

---

## Files to Modify

```
backend/src/index.js                    (Add service mounts)
backend/scripts/mountOrphanedServices.js (NEW - Mount script)
docs/ORPHANED_SERVICES.md               (NEW - This file)
backend/src/routes/orphanedServiceMounts.js (NEW - Consolidated mounts)
```

---

## Testing After Implementation

```bash
# Test each mounted service
curl http://localhost:3001/api/v1/pricing/current/1
curl http://localhost:3001/api/v1/training/programs
curl http://localhost:3001/api/v1/schemes
curl http://localhost:3001/api/v1/greenhouse
curl http://localhost:3001/api/v1/claims
curl http://localhost:3001/api/v1/preseason/catalog
curl http://localhost:3001/api/v1/subsidy

# Run tests
npm test -- --grep "orphaned"
```

---

**Status**: Ready for implementation
**Estimated Time**: 4-6 hours for full resolution
**Risk Level**: Low (just mounting existing code)
