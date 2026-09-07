# TASK ASSIGNMENT: CLAUDE + DEVIN + VS CODE COPILOT
**Objective:** Create SKELETON wiring of all 96 architectural points  
**Timeline:** Build skeleton first, enhance later  
**Team:** Claude (Architecture/Wiring) + Devin (Implementation) + VS Copilot (Coding Assistant)

---

## ROLE DEFINITIONS

### CLAUDE (Cloud Intelligence Agent)
**Role:** Architecture, Wiring, Intelligence, Relationships  
**Responsibility:**
- Design skeleton structure for all components
- Define how components wire together
- Create configuration files
- Document data flows
- Design APIs and interfaces
- Plan integration points
- Create master documents

**Tools:** Documentation, Architecture diagrams, Wiring specifications  
**Output Format:** Markdown, JSON configs, YAML definitions

---

### DEVIN (Code Implementation Agent)
**Role:** Code Implementation, Integration, Testing  
**Responsibility:**
- Implement skeleton services (empty functions, basic logic)
- Wire components together
- Create database migrations
- Implement API endpoints
- Set up integrations
- Test wiring
- Deploy skeleton

**Tools:** Code editor, Git, Terminal, Testing framework  
**Output Format:** JavaScript/SQL/React code

---

### VS COPILOT (Code Assistance)
**Role:** Coding Accelerator, Best Practices  
**Responsibility:**
- Assist Devin with code generation
- Suggest patterns and structure
- Quality review
- Performance optimization
- Security review

**Tools:** VS Code inline intelligence  
**Output Format:** Code snippets, refactoring suggestions

---

## EXECUTION PHASES

### PHASE 1: FOUNDATION SKELETON (Week 1)
**Goal:** Core infrastructure on which everything else stands

#### 1A. Master Data Management Skeleton
**Assigned to:** Claude (design) + Devin (code)

**Claude:**
- Design entity model for all masters (Farmer, Farm, Crop, Product, Buyer, etc.)
- Define primary keys, relationships, unique constraints
- Document deduplication rules
- Create master data governance specification

**Devin:**
- Create database table definitions
- Create services (farmerMasterService, farmMasterService, etc.)
- Create API endpoints (CRUD for each master)
- Implement basic validation

**Output:**
```
backend/src/services/masterData/
├── farmerMasterService.js
├── farmMasterService.js
├── cropMasterService.js
├── productMasterService.js
└── buyerMasterService.js

backend/src/routes/masterDataRoutes.js

frontend/src/services/masterDataService.js
```

---

#### 1B. Identity & Access Management (IAM) Skeleton
**Assigned to:** Claude (design) + Devin (code)

**Claude:**
- Define 15+ roles (farmer, FPO, buyer, field officer, doctor, lab, admin, etc.)
- Document permission matrix
- Design hierarchical access (state → district → village)
- Design data-level access control

**Devin:**
- Create role definitions (database table + seed data)
- Create permission matrix
- Create authentication service (JWT)
- Create authorization middleware
- Create session management

**Output:**
```
backend/src/services/iamService.js
backend/src/middleware/authMiddleware.js
backend/src/middleware/rbacMiddleware.js
database/migrations/001_iam_schema.sql
```

---

#### 1C. Audit Trail Skeleton
**Assigned to:** Claude (design) + Devin (code)

**Claude:**
- Design audit log schema (who, when, what, why, before, after)
- Define immutability requirements
- Document compliance requirements

**Devin:**
- Create audit logging service
- Create middleware for automatic logging
- Create audit query APIs

**Output:**
```
backend/src/services/auditService.js
backend/src/middleware/auditMiddleware.js
database/migrations/002_audit_schema.sql
```

---

### PHASE 2: FARMER JOURNEY SKELETON (Week 2)
**Goal:** Core business flow from farmer perspective

#### 2A. Farmer Onboarding Skeleton
**Assigned to:** Claude (design) + Devin (code)

**Claude:**
- Design registration workflow (registration → KYC → verification → activation)
- Define required fields and validations
- Design document collection process
- Create farmer profile structure

**Devin:**
- Create registration service
- Create KYC workflow service
- Create verification service
- Create farmer profile service
- Create API endpoints

**Output:**
```
backend/src/services/farmerService.js
backend/src/services/kycService.js
backend/src/routes/farmerRoutes.js
frontend/src/pages/FarmerRegistration.jsx
```

---

#### 2B. Farm & Production Planning Skeleton
**Assigned to:** Claude (design) + Devin (code)

**Claude:**
- Design farm profile structure
- Design crop planning workflow
- Design production planning with Claude AI integration points
- Document decision flow

**Devin:**
- Create farm service
- Create crop planning service
- Create production planning service (with Claude AI stub)
- Create API endpoints
- Create farm profile page (frontend)

**Output:**
```
backend/src/services/farmService.js
backend/src/services/cropPlanningService.js
backend/src/services/productionPlanningService.js
frontend/src/pages/FarmProfile.jsx
frontend/src/pages/ProductionPlanning.jsx
```

---

#### 2C. Harvest & Aggregation Skeleton
**Assigned to:** Claude (design) + Devin (code)

**Claude:**
- Design harvest workflow (timing, quality assessment, batch creation)
- Design aggregation workflow (collection, consolidation, storage)
- Document handoff points

**Devin:**
- Create harvest service
- Create aggregation service
- Create batch management service
- Create API endpoints
- Create workflow UI

**Output:**
```
backend/src/services/harvestService.js
backend/src/services/aggregationService.js
frontend/src/pages/HarvestManagement.jsx
```

---

### PHASE 3: PLATFORM SERVICES SKELETON (Week 3)
**Goal:** Supporting services that enable transactions

#### 3A. Marketplace Skeleton
**Assigned to:** Claude (design) + Devin (code)

**Claude:**
- Design product listing schema
- Design order workflow
- Design dynamic pricing structure with Claude AI integration
- Design buyer matching logic

**Devin:**
- Create marketplace service
- Create product service
- Create order service (with Claude AI stub for pricing/matching)
- Create API endpoints
- Create marketplace UI (farmer view, buyer view)

**Output:**
```
backend/src/services/marketplaceService.js
backend/src/services/productService.js
backend/src/services/orderService.js
backend/src/routes/marketplaceRoutes.js
frontend/src/pages/Marketplace/
├── FarmerListProduct.jsx
├── BuyerSearchProducts.jsx
└── OrderManagement.jsx
```

---

#### 3B. Cold Storage Skeleton
**Assigned to:** Claude (design) + Devin (code)

**Claude:**
- Design cold storage node structure (chambers, temperature zones)
- Design booking workflow
- Design inventory tracking
- Design temperature monitoring data structure
- Design energy management integration points

**Devin:**
- Create cold storage service
- Create booking service
- Create inventory service
- Create temperature logging service (IoT stub)
- Create API endpoints
- Create cold storage dashboard

**Output:**
```
backend/src/services/coldStorageService.js
backend/src/services/storageBookingService.js
backend/src/services/inventoryService.js
backend/src/services/temperatureMonitoringService.js
frontend/src/pages/ColdStorage/
├── BookStorage.jsx
├── StorageInventory.jsx
└── TemperatureMonitoring.jsx
```

---

#### 3C. Logistics Skeleton
**Assigned to:** Claude (design) + Devin (code)

**Claude:**
- Design shipment structure
- Design tracking schema
- Design vehicle/driver management
- Design route structure

**Devin:**
- Create logistics service
- Create shipment service
- Create tracking service
- Create vehicle service
- Create API endpoints

**Output:**
```
backend/src/services/logisticsService.js
backend/src/services/shipmentService.js
backend/src/services/trackingService.js
```

---

#### 3D. Payment & Settlement Skeleton
**Assigned to:** Claude (design) + Devin (code)

**Claude:**
- Design payment flow (collection → cost deduction → settlement)
- Design settlement calculation (storage cost, logistics cost, platform fee, farmer net)
- Design invoice structure
- Document reconciliation logic

**Devin:**
- Create payment service
- Create settlement service
- Create invoicing service
- Create reconciliation service
- Create API endpoints
- Create payment dashboard (farmer view)

**Output:**
```
backend/src/services/paymentService.js
backend/src/services/settlementService.js
backend/src/services/invoicingService.js
frontend/src/pages/Payments/
├── PaymentHistory.jsx
└── Settlement.jsx
```

---

### PHASE 4: INTELLIGENT SERVICES SKELETON (Week 3-4)
**Goal:** AI-driven and analytical services

#### 4A. Rules Engine Skeleton
**Assigned to:** Claude (design) + Devin (code)

**Claude:**
- Design rule definition schema (condition, action, priority)
- Design rule categories (subsidy, pricing, logistics, quality, approval)
- Design execution flow
- Design override/exception handling

**Devin:**
- Create rule engine service
- Create rule execution service
- Create rule builder API
- Create rule testing framework

**Output:**
```
backend/src/services/ruleEngineService.js
backend/src/services/ruleExecutionService.js
frontend/src/pages/Administration/RuleBuilder.jsx
```

---

#### 4B. Workflow Engine Skeleton
**Assigned to:** Claude (design) + Devin (code)

**Claude:**
- Design workflow definition schema
- Design state machine model
- Design approval routing
- Design escalation logic
- Design SLA structure

**Devin:**
- Create workflow engine service
- Create state management
- Create approval workflow service
- Create escalation service

**Output:**
```
backend/src/services/workflowEngineService.js
backend/src/services/approvalService.js
backend/src/services/escalationService.js
```

---

#### 4C. Alerts & Notifications Skeleton
**Assigned to:** Claude (design) + Devin (code)

**Claude:**
- Design alert types (market, weather, production, logistics, payment, subsidy, compliance)
- Design trigger schema
- Design delivery channel structure
- Design preference structure

**Devin:**
- Create alert engine service
- Create notification service
- Create WhatsApp/SMS integration (stubs)
- Create preference service
- Create API endpoints

**Output:**
```
backend/src/services/alertEngineService.js
backend/src/services/notificationService.js
backend/src/services/communicationService.js
```

---

#### 4D. Analytics & MRV Skeleton
**Assigned to:** Claude (design) + Devin (code)

**Claude:**
- Design analytics data model
- Design MRV schema (baseline, intervention, output, outcome, impact)
- Design evidence collection
- Design reporting structure

**Devin:**
- Create analytics service
- Create MRV service
- Create reporting service
- Create dashboard endpoints

**Output:**
```
backend/src/services/analyticsService.js
backend/src/services/mrvService.js
backend/src/services/reportingService.js
frontend/src/pages/Analytics/
├── FarmerAnalytics.jsx
└── MRVDashboard.jsx
```

---

#### 4E. GIS & Location Services Skeleton
**Assigned to:** Claude (design) + Devin (code)

**Claude:**
- Design location hierarchy (state → district → block → village → farm)
- Design coordinate storage
- Design boundary mapping structure
- Design proximity search logic

**Devin:**
- Create GIS service
- Create location service
- Create map integration
- Create proximity service

**Output:**
```
backend/src/services/gisService.js
backend/src/services/locationService.js
frontend/src/components/Map/
├── FarmMap.jsx
└── RegionMap.jsx
```

---

### PHASE 5: CONFIGURATION & GOVERNANCE SKELETON (Week 4)
**Goal:** Multi-state operation, governance, security

#### 5A. Configuration/Rules Engine for Multi-State
**Assigned to:** Claude (design) + Devin (code)

**Claude:**
- Design configuration schema (by state, district, cluster)
- Define overrideable settings (language, crops, subsidy schemes, pricing, compliance)
- Design precedence rules

**Devin:**
- Create configuration service
- Create multi-level override logic
- Create configuration admin interface

**Output:**
```
backend/src/services/configurationService.js
frontend/src/pages/Administration/ConfigurationManagement.jsx
```

---

#### 5B. Document Management Skeleton
**Assigned to:** Claude (design) + Devin (code)

**Claude:**
- Design document schema (type, owner, expiry, verification status)
- Design storage/archival
- Design access control
- Design digital signature structure

**Devin:**
- Create document service
- Create upload/storage service (file system stub)
- Create document approval workflow
- Create API endpoints

**Output:**
```
backend/src/services/documentService.js
backend/src/services/fileStorageService.js
```

---

#### 5C. Governance Metrics Overhaul (CRITICAL)
**Assigned to:** Claude (design) + Devin (code)

**Claude:**
- Design coverage-based metrics (not presence-based)
- Define governance audit schema
- Create compliance validation rules
- Document audit trail requirements

**Devin:**
- Create governance metrics service
- Create audit validation service
- Create governance dashboard

**Output:**
```
backend/src/services/governanceMetricsService.js
backend/src/services/auditValidationService.js
```

---

#### 5D. Security & Secrets Management Skeleton
**Assigned to:** Claude (design) + Devin (code)

**Claude:**
- Design secrets storage
- Design encryption at rest
- Design SSL/TLS
- Design vulnerability scanning integration

**Devin:**
- Create secrets service
- Create encryption service
- Create API security headers
- Create SSL configuration

**Output:**
```
backend/src/services/secretsService.js
backend/src/services/encryptionService.js
backend/src/middleware/securityHeadersMiddleware.js
```

---

## DATABASE SCHEMA SKELETON

**Assigned to:** Claude (schema design) + Devin (migrations)

**Claude creates:** Complete entity-relationship diagram with all 96 architecture points mapped to tables

**Devin creates:** SQL migration files for:
- Master data tables
- Transaction tables
- Workflow tables
- Configuration tables
- Analytics tables
- Audit tables

**Output:**
```
database/migrations/
├── 001_master_data.sql
├── 002_iam.sql
├── 003_audit.sql
├── 004_transactions.sql
├── 005_workflows.sql
├── 006_configuration.sql
├── 007_analytics.sql
└── 008_iot_monitoring.sql
```

---

## API ROUTES SKELETON

**Assigned to:** Claude (API design) + Devin (implementation)

**Claude creates:** Complete OpenAPI/Swagger spec with all endpoints for all 96 services

**Devin creates:** Express route files with stub handlers:
```
backend/src/routes/
├── masterDataRoutes.js
├── farmerRoutes.js
├── farmRoutes.js
├── marketplaceRoutes.js
├── coldStorageRoutes.js
├── paymentRoutes.js
├── analyticsRoutes.js
└── [40+ more routes]
```

---

## FRONTEND SKELETON

**Assigned to:** Claude (page design) + Devin (React components)

**Claude creates:**
- Page structure for all missing pages (27 pages)
- Component hierarchy
- State management model
- Navigation flow
- Data flow diagrams

**Devin creates:**
```
frontend/src/pages/
├── Farmer/
│  ├── FarmerDashboard.jsx
│  ├── ProductionPlanning.jsx
│  ├── HarvestManagement.jsx
│  └── [20+ more pages]
├── Marketplace/
│  ├── Listing.jsx
│  ├── Browse.jsx
│  └── Orders.jsx
├── Admin/
│  ├── ControlTower.jsx
│  ├── Configuration.jsx
│  └── Reports.jsx
└── [remaining pages]

frontend/src/services/
├── farmerService.js
├── marketplaceService.js
├── coldStorageService.js
└── [all API services]

frontend/src/stores/
├── farmerStore.js (Zustand)
├── marketplaceStore.js
├── uiStore.js
└── [state management]
```

---

## WIRING DOCUMENTS

**Assigned to:** Claude

**Create:**
1. **Data Flow Diagram** - How data moves through all 96 components
2. **Component Dependency Graph** - What depends on what
3. **API Contract Specification** - How services communicate
4. **Workflow State Machines** - State transitions for all workflows
5. **Configuration Hierarchy** - Override precedence for multi-state
6. **Integration Points** - Where external systems connect

---

## IMPLEMENTATION CHECKLIST

### Week 1: Foundation
- [ ] Master Data skeleton (Farmer, Farm, Crop, Product, Buyer)
- [ ] IAM skeleton (Auth, RBAC, audit)
- [ ] Database migrations created (not executed yet)
- [ ] API gateway structure
- [ ] Audit logging structure

### Week 2: Farmer Journey
- [ ] Farmer onboarding flow
- [ ] Farm profile management
- [ ] Production planning (with Claude AI stubs)
- [ ] Harvest & aggregation workflows
- [ ] Database migrations executed ⚠️ CRITICAL

### Week 3: Platform Services
- [ ] Marketplace (listing, ordering, pricing)
- [ ] Cold storage (booking, inventory, monitoring)
- [ ] Logistics (shipment, tracking)
- [ ] Payment & settlement
- [ ] Rules engine
- [ ] Workflow engine
- [ ] Claude API configured ⚠️ CRITICAL

### Week 4: Intelligence & Governance
- [ ] Alerts & notifications
- [ ] Analytics & MRV
- [ ] GIS & location services
- [ ] Configuration/rules engine for multi-state
- [ ] Document management
- [ ] Governance metrics (coverage-based, not presence)
- [ ] Frontend routes wired ⚠️ CRITICAL

---

## SUCCESS CRITERIA FOR SKELETON

Each component is considered "skeleton complete" when:

1. **Database:** Tables created (structure correct, data seeded with defaults)
2. **Backend:** Service files exist with empty function stubs and documentation
3. **API:** Routes exist with stub handlers that return mock data
4. **Frontend:** Pages and components created with basic UI and no logic
5. **Wiring:** Integration points documented, not yet functional
6. **Tests:** Test stubs exist (can be run, will fail for now)

**Example:** Marketplace skeleton = product listing page exists with empty search bar + data table showing mock products + add product button that doesn't work

---

## ENHANCEMENT PHASES (After Skeleton)

Once skeleton is complete and wired:

**Phase 1 Enhancements:** Make each component functional (implement business logic)  
**Phase 2 Enhancements:** Integrate components (make wiring work)  
**Phase 3 Enhancements:** Add AI coordination, real-time updates, advanced features  
**Phase 4 Enhancements:** Performance, security hardening, optimization  
**Phase 5 Enhancements:** Production deployment readiness

---

## TOOLS & TECHNOLOGIES

**Claude:**
- Markdown for architecture
- JSON for configs
- SQL for database design
- OpenAPI for API specs
- Mermaid for diagrams

**Devin (VS Code):**
- JavaScript/Node.js
- React
- SQL
- Git for version control
- Jest for testing

**VS Copilot:**
- Real-time code suggestions
- Pattern recommendations
- Best practices
- Refactoring assistance

---

## GIT WORKFLOW

```
Main branch: main
Working branch: skeleton-complete

Commits:
1. Foundation skeleton (IAM, audit, master data)
2. Farmer journey skeleton
3. Platform services skeleton
4. Intelligence services skeleton
5. Configuration & governance skeleton
6. Database migrations
7. Frontend wiring complete

Each commit includes:
- Code changes
- Database migration
- API specs
- Documentation updates
- Test stubs
```

---

## FINAL OUTPUT

When skeleton phase is complete:

**Codebase:**
- ✅ All 96 components have skeleton structure
- ✅ All tables designed and migration files created
- ✅ All API endpoints defined with stubs
- ✅ All frontend pages/components created with basic UI
- ✅ All services have empty function stubs with doc comments
- ✅ All wiring documented

**Documentation:**
- ✅ Data flow diagrams
- ✅ Component dependency graph
- ✅ API specifications
- ✅ Database schema
- ✅ Configuration hierarchy
- ✅ Workflow state machines

**Ready for:** Enhancement phase where real logic is implemented

