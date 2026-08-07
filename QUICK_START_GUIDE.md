# AFRERA Submodules Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### 1. Enable the Routes (in `backend/src/index.js`)

```javascript
const energyRoutes = require('./routes/energyRoutes');
const foodRoutes = require('./routes/foodRoutes');
const erpRoutes = require('./routes/erpRoutes');

app.use('/api/v1/energy', energyRoutes);
app.use('/api/v1/food', foodRoutes);
app.use('/api/v1/erp', erpRoutes);
```

### 2. Run Database Migrations

```bash
# Execute the migration script
psql -U postgres -d afrera < backend/migrations/1000_energy_food_erp_modules.sql

# Or using your migration tool:
npm run migrate -- --version 1000
```

### 3. Test the APIs

```bash
# Energy API
curl -X POST http://localhost:3000/api/v1/energy/calculator/lifetime-cost \
  -H "Content-Type: application/json" \
  -d '{"village_id":"V001","grid_tariff_per_unit":6.5,"grid_hours_per_day":20}'

# Food API
curl -X POST http://localhost:3000/api/v1/food/processing/start-batch \
  -H "Content-Type: application/json" \
  -d '{"product_id":"P001","product_name":"Tomato","quantity_kg":1000}'

# ERP API
curl -X POST http://localhost:3000/api/v1/erp/cost-centres/create \
  -H "Content-Type: application/json" \
  -d '{"code":"CC-001","name":"Marketing","manager_id":"M001","budget_annual":5000000}'
```

---

## 📚 Core Modules

### Platform Detector
```javascript
const PlatformDetector = require('./platforms/platformDetector');

// Detect platform
const platform = PlatformDetector.detectPlatform();
console.log(platform); // { name: 'windows', family: 'desktop', version: '10+' }

// Check capabilities
if (PlatformDetector.hasFeature('windows', 'fileSystem')) {
  // File system is available
}

// Get offline DB type
const dbType = PlatformDetector.getOfflineDbType('ios');
// Returns: 'watermelon-db'
```

### Energy Calculator
```javascript
const EnergyCostCalculator = require('./services/energy/EnergyCostCalculator');

// Calculate lifetime cost
const result = EnergyCostCalculator.calculateLifetimeCost({
  gridTariffPerUnit: 6.5,
  gridHoursPerDay: 20,
  outageHoursPerYear: 200,
  dieselCostPerLiter: 95,
  dieselLitersPerYear: 5000,
  solarIrradiation: 5.2,
  batteryReplacementCostPerYear: 50000,
  projectionYears: 25
});

// Optimize energy stack
const stack = EnergyCostCalculator.optimizeEnergyStack({
  averageDailyDemandKwh: 500,
  peakDemandKw: 150,
  gridAvailability: 0.6,
  solarIrradiation: 5.2,
  agricultureArea: 1200
});
```

### Food Intelligence Engine
```javascript
const FoodIntelligenceEngine = require('./services/food/FoodIntelligenceEngine');

// Initialize batch
const batch = FoodIntelligenceEngine.initializeBatch({
  productId: 'PROD-001',
  productName: 'Tomato',
  quantityKg: 1000,
  processingMethod: 'FRESH'
});

// Analyze nutrition
const nutrition = FoodIntelligenceEngine.analyzeNutrition({
  productName: 'Wheat',
  productType: 'WHEAT',
  rawQuantityG: 100,
  processingLoss: 5,
  cookingMethod: 'BOILING'
});

// Predict shelf life
const shelfLife = FoodIntelligenceEngine.predictShelfLife({
  productType: 'TOMATO',
  storageTemperature: 8,
  storageHumidity: 55,
  packagingType: 'VACUUM_SEALED'
});
```

### Cost Control Module
```javascript
const CostControlModule = require('./services/erp/CostControlModule');

// Create cost centre
const cc = CostControlModule.createCostCentre({
  code: 'CC-MKTG-001',
  name: 'Marketing Department',
  managerId: 'MGR-001',
  budgetAnnual: 5000000
});

// Allocate costs
const allocation = CostControlModule.allocateCosts({
  costCentreId: cc.id,
  period: '2026-08',
  costType: 'INDIRECT',
  amount: 500000
});

// Calculate profitability
const profitability = CostControlModule.calculateProfitability({
  costCentreId: cc.id,
  period: '2026-08',
  revenue: 2000000,
  directCosts: 800000,
  allocatedIndirectCosts: 400000
});
```

---

## 🌐 API Endpoints Reference

### Energy Module `/api/v1/energy`

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/calculator/lifetime-cost` | Calculate 25-year energy cost |
| GET | `/database/grid-tariffs/:region` | Get regional grid tariffs |
| POST | `/optimizer/recommend-stack` | Get energy stack recommendation |
| GET | `/metrics/:village_id` | Get village energy metrics |
| POST | `/productive/demand-forecast` | Forecast productive energy |

### Food Module `/api/v1/food`

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/processing/start-batch` | Initialize processing batch |
| POST | `/nutrition/analyze` | Analyze product nutrition |
| POST | `/traceability/record-movement` | Record supply chain movement |
| POST | `/shelf-life/predict` | Predict shelf life |
| POST | `/safety/compliance-check` | Verify food safety |
| GET | `/batch/:batch_id` | Get batch details |
| POST | `/certification/organic-recommend` | Get organic certification recommendation |

### ERP Module `/api/v1/erp`

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/cost-centres/create` | Create cost centre |
| POST | `/costs/allocate` | Allocate costs |
| POST | `/costs/record-consumption` | Record cost consumption |
| POST | `/costs/allocate-abc` | Activity-based costing |
| GET | `/profitability/:cost_centre_id/:period` | Calculate profitability |
| GET | `/variance/:cost_centre_id/:period` | Analyze variance |

---

## 📊 Platform Capabilities

### Desktop (Windows, Linux, macOS)
- ✅ File system access
- ✅ Native notifications
- ✅ System tray integration
- ✅ Auto-updates
- ✅ SQLite offline DB
- ✅ 10GB storage

### Mobile (iOS, Android)
- ✅ Biometric authentication
- ✅ QR code scanning
- ✅ Camera access
- ✅ Location services
- ✅ Push notifications
- ✅ WatermelonDB offline storage
- ✅ 2-5GB storage

### Web
- ✅ Responsive design
- ✅ IndexedDB for offline cache
- ✅ Push notifications
- ✅ 50MB storage

---

## 🔧 Configuration by Platform

```javascript
const config = PlatformDetector.getPlatformConfig('windows');
// Returns:
// {
//   defaultPort: 3000,
//   certPath: '%APPDATA%\\afrera\\certs',
//   logPath: '%APPDATA%\\afrera\\logs',
//   dataPath: '%APPDATA%\\afrera\\data'
// }
```

---

## 📋 Database Tables Summary

### Energy Tables
- `energy_cost_profiles` - Village energy cost data
- `energy_stack_configurations` - Recommended configurations
- `energy_demand_forecasts` - Demand projections
- `productive_equipment_energy` - Equipment consumption

### Food Tables
- `food_processing_batches` - Processing batches
- `food_processing_stages` - Individual stages
- `nutrition_composition` - Nutrition database
- `food_traceability_chain` - Supply chain tracking
- `shelf_life_predictions` - Shelf life data
- `food_compliance_records` - Compliance status
- `organic_certification_tracking` - Organic tracking

### ERP Tables
- `cost_centres` - Cost centre hierarchy
- `cost_allocations` - Cost allocations
- `cost_consumptions` - Actual costs
- `indirect_cost_pools` - Pooled costs
- `abc_allocations` - ABC allocations
- `cost_centre_profitability` - Profitability data
- `cost_variance_analysis` - Variance tracking
- `fixed_assets` - Asset registry
- `depreciation_schedules` - Depreciation tracking
- `projects` - Project tracking

---

## ⚡ Performance Tips

1. **Energy Calculations**: Cached for up to 24 hours per village
2. **Food Batches**: Index on `batch_id` for fast lookups
3. **Cost Analysis**: Period-indexed for monthly reports
4. **Profitability**: Use drill-down for details, not full loads

---

## 🐛 Common Issues & Solutions

### Issue: "Module not found"
**Solution**: Ensure all route files are created in correct locations:
- `backend/src/routes/energyRoutes.js`
- `backend/src/routes/foodRoutes.js`
- `backend/src/routes/erpRoutes.js`

### Issue: "Database connection error"
**Solution**: Run migrations first:
```bash
psql -U postgres -d afrera < backend/migrations/1000_energy_food_erp_modules.sql
```

### Issue: "Platform detection returns 'web'"
**Solution**: Platform detection uses `navigator` object. For server-side code, manually specify:
```javascript
const platform = 'windows'; // or 'linux', 'macos', 'ios', 'android'
const capabilities = PlatformDetector.getCapabilities(platform);
```

---

## 📞 Support Resources

- **API Documentation**: `/MODULES_IMPLEMENTATION_README.md`
- **Implementation Plan**: `/SUBMODULE_OPERATIONS_IMPROVEMENT_PLAN.md`
- **Architecture Guide**: `/AFRERA_MASTER_ARCHITECTURAL_SPECIFICATION.md`
- **Missing Components Analysis**: `/AFRERA_MISSING_PLATFORMS_ANALYSIS.md`

---

## ✅ Verification Checklist

Before production deployment:

- [ ] All routes integrated in `index.js`
- [ ] Database migrations executed
- [ ] Platform detection working on all target OSes
- [ ] Energy calculations verified with test data
- [ ] Food batch workflows tested end-to-end
- [ ] ERP cost calculations validated
- [ ] API endpoints responding with correct format
- [ ] Database indexes created
- [ ] Error handling implemented
- [ ] Logging configured

---

**Last Updated**: 2026-08-05  
**Version**: 1.0.0
