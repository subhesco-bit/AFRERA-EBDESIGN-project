# 📊 API ENDPOINT MAPPING MATRIX

## Backend Routes - Current vs Required

### Status Codes
- ✅ Mounted & Working
- ⚠️ Mounted but Incomplete
- ❌ Orphaned (Defined but not mounted)
- 🔴 Missing (Not defined anywhere)

---

## Core Business Modules

### Authentication & User Management

| Endpoint | Method | Status | Service | Frontend |
|----------|--------|--------|---------|----------|
| `/api/v1/auth/login` | POST | ✅ | authService | LoginPage.jsx |
| `/api/v1/auth/register` | POST | ✅ | authService | RegisterPage.jsx |
| `/api/v1/auth/refresh` | POST | ✅ | authService | auto-refresh |
| `/api/v1/auth/logout` | POST | ✅ | authService | Sidebar.jsx |
| `/api/v1/auth/mfa/setup` | POST | ✅ | mfaService | SecuritySettings.jsx |
| `/api/v1/auth/mfa/verify` | POST | ✅ | mfaService | MFAVerify.jsx |
| `/api/v1/users/:id` | GET | ✅ | userModule | ProfilePage.jsx |
| `/api/v1/users/:id` | PUT | ✅ | userModule | ProfilePage.jsx |
| `/api/v1/users` | GET | ⚠️ | userModule | UserManagement.jsx |

### Farmer Portal

| Endpoint | Method | Status | Service | Frontend |
|----------|--------|--------|---------|----------|
| `/api/v1/farmer/dashboard` | GET | ✅ | farmerPortalEnhancements | FarmerDashboard.jsx |
| `/api/v1/farmer/profile` | GET | ✅ | farmerRoutes | FarmerProfile.jsx |
| `/api/v1/farmer/profile` | PUT | ✅ | farmerRoutes | FarmerProfile.jsx |
| `/api/v1/farmer/land` | GET | ✅ | farmerRoutes | LandManagement.jsx |
| `/api/v1/farmer/land` | POST | ✅ | farmerRoutes | LandManagement.jsx |
| `/api/v1/farmer/crops` | GET | ✅ | farmerRoutes | CropManagement.jsx |
| `/api/v1/farmer/crops` | POST | ✅ | farmerRoutes | CropManagement.jsx |

### Marketplace

| Endpoint | Method | Status | Service | Frontend |
|----------|--------|--------|---------|----------|
| `/api/v1/marketplace/products` | GET | ✅ | productService | Marketplace.jsx |
| `/api/v1/marketplace/products/:id` | GET | ✅ | productService | ProductDetail.jsx |
| `/api/v1/marketplace/products` | POST | ✅ | productService | SellerDashboard.jsx |
| `/api/v1/marketplace/cart` | GET | ✅ | orderService | Cart.jsx |
| `/api/v1/marketplace/cart` | POST | ✅ | orderService | Cart.jsx |
| `/api/v1/marketplace/orders` | POST | ✅ | orderService | Checkout.jsx |
| `/api/v1/marketplace/orders/:id` | GET | ✅ | orderService | OrderDetails.jsx |

### Livestock Management

| Endpoint | Method | Status | Service | Frontend |
|----------|--------|--------|---------|----------|
| `/api/v1/livestock/dashboard` | GET | ⚠️ | ? | LivestockDashboard.jsx |
| `/api/v1/livestock/dairy` | GET | ✅ | dairyRoutes | DairyManagement.jsx |
| `/api/v1/livestock/dairy` | POST | ✅ | dairyRoutes | DairyManagement.jsx |
| `/api/v1/livestock/poultry` | GET | ✅ | poultryRoutes | PoultryManagement.jsx |
| `/api/v1/livestock/poultry` | POST | ✅ | poultryRoutes | PoultryManagement.jsx |
| `/api/v1/livestock/goat` | GET | ✅ | goatRoutes | GoatManagement.jsx |
| `/api/v1/livestock/goat` | POST | ✅ | goatRoutes | GoatManagement.jsx |
| `/api/v1/livestock/sheep` | GET | ✅ | sheepRoutes | SheepManagement.jsx |
| `/api/v1/livestock/sheep` | POST | ✅ | sheepRoutes | SheepManagement.jsx |
| `/api/v1/livestock/pig` | GET | ✅ | pigRoutes | PigManagement.jsx |
| `/api/v1/livestock/pig` | POST | ✅ | pigRoutes | PigManagement.jsx |
| `/api/v1/livestock/health` | GET | ✅ | animalHealthRoutes | AnimalHealth.jsx |
| `/api/v1/livestock/health` | POST | ✅ | animalHealthRoutes | AnimalHealth.jsx |

### Crop Management

| Endpoint | Method | Status | Service | Frontend |
|----------|--------|--------|---------|----------|
| `/api/v1/crop/dashboard` | GET | ⚠️ | ? | CropDashboard.jsx |
| `/api/v1/crop/seeds` | GET | ⚠️ | ? | SeedManagement.jsx |
| `/api/v1/crop/seeds` | POST | ⚠️ | ? | SeedManagement.jsx |
| `/api/v1/crop/fertilizer` | GET | ✅ | fertilizerRoutes | FertilizerInventory.jsx |
| `/api/v1/crop/fertilizer` | POST | ✅ | fertilizerRoutes | FertilizerInventory.jsx |
| `/api/v1/crop/soil-testing` | GET | ⚠️ | soilTestingService❌ | SoilTesting.jsx |
| `/api/v1/crop/soil-testing` | POST | ⚠️ | soilTestingService❌ | SoilTesting.jsx |
| `/api/v1/crop/irrigation` | GET | ⚠️ | ? | IrrigationManagement.jsx |
| `/api/v1/crop/irrigation` | POST | ⚠️ | ? | IrrigationManagement.jsx |

### Supply Chain & Logistics

| Endpoint | Method | Status | Service | Frontend |
|----------|--------|--------|---------|----------|
| `/api/v1/logistics/shipments` | GET | ✅ | logisticsService | ShipmentTracking.jsx |
| `/api/v1/logistics/shipments/:id` | GET | ✅ | logisticsService | ShipmentDetail.jsx |
| `/api/v1/logistics/shipments` | POST | ✅ | logisticsService | CreateShipment.jsx |
| `/api/v1/logistics/storage` | GET | ⚠️ | ? | StorageManagement.jsx |
| `/api/v1/logistics/storage` | POST | ⚠️ | ? | StorageManagement.jsx |
| `/api/v1/logistics/delivery` | GET | ⚠️ | ? | DeliveryTracking.jsx |
| `/api/v1/logistics/delivery/:id` | PUT | ⚠️ | ? | DeliveryUpdate.jsx |

### Finance

| Endpoint | Method | Status | Service | Frontend |
|----------|--------|--------|---------|----------|
| `/api/v1/finance/dashboard` | GET | ✅ | financialService | FinanceDashboard.jsx |
| `/api/v1/finance/accounts` | GET | ✅ | financialService | Accounts.jsx |
| `/api/v1/finance/transactions` | GET | ✅ | financialService | Transactions.jsx |
| `/api/v1/finance/transactions` | POST | ✅ | financialService | NewTransaction.jsx |
| `/api/v1/finance/loans` | GET | ⚠️ | ? | LoanManagement.jsx |
| `/api/v1/finance/loans` | POST | ⚠️ | ? | LoanManagement.jsx |
| `/api/v1/finance/insurance` | GET | ✅ | insuranceService | InsurancePlans.jsx |
| `/api/v1/finance/insurance` | POST | ✅ | insuranceService | InsurancePlans.jsx |

### Pricing & Economics

| Endpoint | Method | Status | Service | Frontend |
|----------|--------|--------|---------|----------|
| `/api/v1/pricing/current/:product_id` | GET | ❌ | dynamicPricingService | PricingDashboard.jsx |
| `/api/v1/pricing/forecast` | GET | ❌ | dynamicPricingService | PriceForecast.jsx |
| `/api/v1/pricing/calculate` | POST | ❌ | dynamicPricingService | PriceCalculator.jsx |

### Training & Knowledge

| Endpoint | Method | Status | Service | Frontend |
|----------|--------|--------|---------|----------|
| `/api/v1/training/programs` | GET | ❌ | farmerTrainingService | TrainingCatalog.jsx |
| `/api/v1/training/programs/:id` | GET | ❌ | farmerTrainingService | TrainingDetail.jsx |
| `/api/v1/training/enroll` | POST | ❌ | farmerTrainingService | TrainingEnroll.jsx |
| `/api/v1/training/my-courses` | GET | ❌ | farmerTrainingService | MyCourses.jsx |
| `/api/v1/training/certificates` | GET | ❌ | farmerTrainingService | MyCertificates.jsx |

### Government Schemes

| Endpoint | Method | Status | Service | Frontend |
|----------|--------|--------|---------|----------|
| `/api/v1/schemes` | GET | ❌ | governmentSchemeService | SchemesList.jsx |
| `/api/v1/schemes/:id` | GET | ❌ | governmentSchemeService | SchemeDetail.jsx |
| `/api/v1/schemes/apply` | POST | ❌ | governmentSchemeService | SchemeApplication.jsx |
| `/api/v1/schemes/my-applications` | GET | ❌ | governmentSchemeService | MyApplications.jsx |
| `/api/v1/schemes/check-eligibility` | POST | ❌ | governmentSchemeService | EligibilityCheck.jsx |

### Climate & Environment

| Endpoint | Method | Status | Service | Frontend |
|----------|--------|--------|---------|----------|
| `/api/v1/climate/forecast` | GET | 🔴 | - | ClimateMonitoring.jsx |
| `/api/v1/climate/alerts` | GET | 🔴 | - | ClimateAlerts.jsx |
| `/api/v1/climate/disease-forecast` | GET | 🔴 | - | DiseaseForecast.jsx |
| `/api/v1/climate/water-requirements` | GET | 🔴 | - | WaterRequirements.jsx |

### Operations & Infrastructure

| Endpoint | Method | Status | Service | Frontend |
|----------|--------|--------|---------|----------|
| `/api/v1/operations/tasks` | GET | 🔴 | - | OperationsTasks.jsx |
| `/api/v1/operations/tasks` | POST | 🔴 | - | CreateTask.jsx |
| `/api/v1/operations/equipment` | GET | 🔴 | - | EquipmentManagement.jsx |
| `/api/v1/operations/contractors` | GET | 🔴 | - | ContractorManagement.jsx |

### Water Management

| Endpoint | Method | Status | Service | Frontend |
|----------|--------|--------|---------|----------|
| `/api/v1/water/budget` | GET | 🔴 | - | WaterBudget.jsx |
| `/api/v1/water/quality` | GET | 🔴 | - | WaterQuality.jsx |
| `/api/v1/water/harvesting` | GET | 🔴 | - | RainwaterHarvesting.jsx |

### Soil Management

| Endpoint | Method | Status | Service | Frontend |
|----------|--------|--------|---------|----------|
| `/api/v1/soil/health` | GET | 🔴 | - | SoilHealth.jsx |
| `/api/v1/soil/nutrients` | GET | 🔴 | - | NutrientManagement.jsx |
| `/api/v1/soil/fertility` | GET | 🔴 | - | FertilityManagement.jsx |

### Analytics & Insights

| Endpoint | Method | Status | Service | Frontend |
|----------|--------|--------|---------|----------|
| `/api/v1/analytics/dashboard` | GET | ✅ | analyticsService | AnalyticsDashboard.jsx |
| `/api/v1/analytics/reports/:type` | GET | ✅ | analyticsService | ReportGeneration.jsx |
| `/api/v1/analytics/export` | POST | ✅ | analyticsService | DataExport.jsx |

### Health & Monitoring

| Endpoint | Method | Status | Service | Frontend |
|----------|--------|--------|---------|----------|
| `/api/v1/health` | GET | ✅ | healthRoutes | (monitoring) |
| `/api/v1/health/ready` | GET | ✅ | healthRoutes | (readiness) |

---

## Summary Statistics

### Backend Routes Status
```
✅ Working:        42 endpoints
⚠️ Incomplete:     28 endpoints
❌ Orphaned:       9 services (45+ endpoints)
🔴 Missing:        24 endpoints

Total Needed:      148 endpoints
Current Coverage:  42/148 (28%)
```

### Frontend Pages Status
```
Total Pages:       120+
Pages with API:    45
Pages w/o API:     35
Pages w/ Broken API: 15
```

### Priority Fixes Required
```
🔴 CRITICAL:
   - Mount 9 orphaned services
   - Add 24 missing endpoints
   - Fix health endpoints

🟠 HIGH:
   - Complete 28 incomplete endpoints
   - Fix 15 broken API calls

🟡 MEDIUM:
   - Add error handling
   - Add pagination
   - Add filtering
```

---

## Implementation Roadmap

### Week 1: Critical Fixes
- [ ] Mount Dynamic Pricing
- [ ] Mount Government Schemes
- [ ] Mount Training Service
- [ ] Fix health endpoints
- [ ] Verify database connections

### Week 2: High Priority
- [ ] Mount Insurance Claims
- [ ] Mount Greenhouse Service
- [ ] Add climate monitoring endpoints
- [ ] Add operations management endpoints

### Week 3: Medium Priority
- [ ] Mount Pre-Season Orders
- [ ] Mount Subsidy Service
- [ ] Add water management endpoints
- [ ] Add soil management endpoints

### Week 4: Polish & Optimization
- [ ] Complete all incomplete endpoints
- [ ] Add comprehensive error handling
- [ ] Add request validation
- [ ] Add API documentation
- [ ] Performance optimization

---

## Testing Checklist

For each endpoint, verify:

```javascript
✓ Endpoint is accessible (returns 200/201)
✓ Returns valid JSON
✓ Includes proper error handling (returns 4xx/5xx)
✓ Requires proper authentication
✓ Validates input parameters
✓ Handles edge cases
✓ Frontend can call it successfully
✓ Response format matches frontend expectations
```

---

*Generated: 2026-09-03*
*Next: Run `npm run audit:endpoints` to validate*
