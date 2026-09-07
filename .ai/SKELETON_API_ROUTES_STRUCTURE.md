# EBDESIGN API ROUTES SKELETON STRUCTURE
**Maps all 96 architecture points to API endpoints**  
**Ready for Devin to implement with stub handlers**

---

## API ROUTE ORGANIZATION

### Core Routes (Base Path: `/api/v1`)

---

## SECTION 1: IDENTITY & AUTHENTICATION

### Auth Routes (`/api/v1/auth`)
```
POST   /auth/register                 - Farmer/Buyer registration
POST   /auth/login                    - User login
POST   /auth/logout                   - User logout
POST   /auth/refresh-token            - Refresh JWT
POST   /auth/password-reset           - Password reset request
POST   /auth/password-reset/confirm   - Confirm password reset
POST   /auth/mfa/setup                - Setup MFA
POST   /auth/mfa/verify               - Verify MFA token
POST   /auth/mfa/backup-codes         - Generate backup codes
```

### User Management Routes (`/api/v1/users`)
```
GET    /users/profile                 - Get current user profile
PUT    /users/profile                 - Update user profile
GET    /users/:userId                 - Get specific user
PUT    /users/:userId                 - Update user (admin)
DELETE /users/:userId                 - Deactivate user (admin)
GET    /users                         - List users (admin)
POST   /users/roles/assign            - Assign role to user
POST   /users/roles/revoke            - Revoke role from user
GET    /users/:userId/roles           - Get user roles
GET    /users/:userId/permissions     - Get user permissions
```

### Role Management Routes (`/api/v1/roles`)
```
GET    /roles                         - List all roles
GET    /roles/:roleId                 - Get role details
POST   /roles                         - Create new role (admin)
PUT    /roles/:roleId                 - Update role (admin)
POST   /roles/:roleId/permissions     - Add permission to role
DELETE /roles/:roleId/permissions/:permissionId - Remove permission
```

### Audit & Compliance Routes (`/api/v1/audit`)
```
GET    /audit/logs                    - Get audit logs (filtered by date range)
GET    /audit/logs/:entityType/:entityId - Get audit history for entity
GET    /audit/user-activity/:userId   - Get user activity history
```

---

## SECTION 2: MASTER DATA MANAGEMENT

### Farmer Management Routes (`/api/v1/farmers`)
```
POST   /farmers/register              - Register new farmer (Section 3)
GET    /farmers/:farmerId             - Get farmer profile
PUT    /farmers/:farmerId             - Update farmer profile
GET    /farmers/search                - Search farmers
GET    /farmers/:farmerId/farms       - Get farmer's farms
GET    /farmers/:farmerId/income      - Get farmer income summary
GET    /farmers/:farmerId/transactions - Get farmer transactions
POST   /farmers/:farmerId/kyc         - Submit/update KYC
GET    /farmers/:farmerId/kyc-status  - Get KYC status
GET    /farmers/:farmerId/fdi-score   - Get FDI score
```

### Farm Management Routes (`/api/v1/farms`)
```
POST   /farms                         - Create farm (Section 7)
GET    /farms/:farmId                 - Get farm details
PUT    /farms/:farmId                 - Update farm profile
GET    /farms/:farmId/plots           - Get plots in farm
POST   /farms/:farmId/plots           - Create plot
GET    /farms/:farmId/gis-boundary    - Get GIS boundary
```

### Crop Management Routes (`/api/v1/crops`)
```
GET    /crops                         - List all crops (master data)
GET    /crops/:cropId                 - Get crop details
GET    /crops/:cropId/varieties       - Get crop varieties
POST   /crops/:cropId/varieties       - Add new variety (admin)
```

### Production Planning Routes (`/api/v1/production`)
```
POST   /production/plans              - Create crop plan (Section 12)
GET    /production/plans/:planId      - Get plan details
PUT    /production/plans/:planId      - Update plan
GET    /production/plans/:farmerId    - Get farmer's crop plans
POST   /production/plans/:planId/cycle-start - Start crop cycle
PUT    /production/cycles/:cycleId    - Update harvest results
GET    /production/cycles/:cycleId    - Get cycle details
```

### Product Management Routes (`/api/v1/products`)
```
POST   /products                      - Create product (from harvest)
GET    /products/:productId           - Get product details
PUT    /products/:productId           - Update product
GET    /products/farmer/:farmerId     - Get farmer's products
GET    /products/search               - Search products
```

### Buyer Management Routes (`/api/v1/buyers`)
```
POST   /buyers/register               - Register buyer
GET    /buyers/:buyerId               - Get buyer profile
PUT    /buyers/:buyerId               - Update buyer profile
GET    /buyers                        - List buyers (admin)
GET    /buyers/:buyerId/orders        - Get buyer's orders
GET    /buyers/:buyerId/suppliers     - Get buyer's suppliers
```

---

## SECTION 3: MARKETPLACE & COMMERCE

### Marketplace Routes (`/api/v1/marketplace`)
```
POST   /marketplace/listings          - List product for sale (Section 9)
GET    /marketplace/listings/:listingId - Get listing details
PUT    /marketplace/listings/:listingId - Update listing
DELETE /marketplace/listings/:listingId - Remove listing
GET    /marketplace/search            - Search products with filters
GET    /marketplace/categories        - Get product categories
```

### Pricing Routes (`/api/v1/pricing`)
```
GET    /pricing/market-data           - Get current market prices
POST   /pricing/dynamic               - Get dynamic price for product (Claude AI)
GET    /pricing/history/:productId    - Get price history
```

### Orders Routes (`/api/v1/orders`)
```
POST   /orders                        - Create order (Section 9)
GET    /orders/:orderId               - Get order details
PUT    /orders/:orderId               - Update order status
GET    /orders/buyer/:buyerId         - Get buyer's orders
GET    /orders/farmer/:farmerId       - Get farmer's orders
POST   /orders/:orderId/accept        - Farmer accepts order
POST   /orders/:orderId/reject        - Farmer rejects order
POST   /orders/:orderId/quality-feedback - Submit quality feedback
```

### Buyer Matching Routes (`/api/v1/buyer-matching`)
```
POST   /buyer-matching/inquiries      - Buyer submits inquiry
GET    /buyer-matching/inquiries/:inquiryId - Get inquiry details
POST   /buyer-matching/match          - Get matching farmers (Claude AI)
POST   /buyer-matching/confirm        - Confirm match
```

---

## SECTION 4: COLD STORAGE (CORE)

### Cold Storage Nodes Routes (`/api/v1/cold-storage/nodes`)
```
GET    /cold-storage/nodes            - List all cold storage nodes (Section 6)
GET    /cold-storage/nodes/:nodeId    - Get node details
GET    /cold-storage/nodes/:nodeId/capacity - Get available capacity
GET    /cold-storage/nodes/:nodeId/chambers - Get chambers in node
```

### Storage Booking Routes (`/api/v1/cold-storage/bookings`)
```
POST   /cold-storage/bookings         - Create storage booking (Section 6)
GET    /cold-storage/bookings/:bookingId - Get booking details
PUT    /cold-storage/bookings/:bookingId - Update booking
GET    /cold-storage/bookings/farmer/:farmerId - Get farmer's bookings
GET    /cold-storage/bookings/available-dates - Get available dates
POST   /cold-storage/bookings/:bookingId/confirm - Confirm booking
```

### Cold Storage Inventory Routes (`/api/v1/cold-storage/inventory`)
```
GET    /cold-storage/inventory/:chamberId - Get chamber inventory
POST   /cold-storage/inventory/receive - Receive product into storage
GET    /cold-storage/inventory/:bookingId/status - Get inventory status
POST   /cold-storage/inventory/:bookingId/dispatch - Mark for dispatch
```

### Temperature Monitoring Routes (`/api/v1/cold-storage/monitoring`)
```
GET    /cold-storage/monitoring/:chamberId/temperature - Current temperature
GET    /cold-storage/monitoring/:chamberId/history - Temperature history
GET    /cold-storage/monitoring/:chamberId/alerts - Temperature alerts
POST   /cold-storage/monitoring/alert-threshold - Set alert threshold
```

### Energy Routes (`/api/v1/cold-storage/energy`)
```
GET    /cold-storage/energy/:nodeId/consumption - Get energy consumption
GET    /cold-storage/energy/:nodeId/efficiency - Get efficiency metrics
GET    /cold-storage/energy/:nodeId/renewable-percent - Get renewable percentage
```

### Storage Costs Routes (`/api/v1/cold-storage/costs`)
```
GET    /cold-storage/costs/calculator - Calculate storage cost
GET    /cold-storage/costs/summary    - Cost breakdown for booking
```

---

## SECTION 5: LOGISTICS

### Shipment Routes (`/api/v1/logistics/shipments`)
```
POST   /logistics/shipments           - Create shipment (Section 15)
GET    /logistics/shipments/:shipmentId - Get shipment details
PUT    /logistics/shipments/:shipmentId/status - Update shipment status
GET    /logistics/shipments/farmer/:farmerId - Get farmer's shipments
GET    /logistics/shipments/buyer/:buyerId - Get buyer's shipments
```

### Tracking Routes (`/api/v1/logistics/tracking`)
```
GET    /logistics/tracking/:shipmentId - Real-time tracking (Section 15)
GET    /logistics/tracking/:shipmentId/history - Tracking history
GET    /logistics/tracking/:shipmentId/temperature - Temperature during transit
```

### Vehicle Routes (`/api/v1/logistics/vehicles`)
```
GET    /logistics/vehicles            - List reefer vehicles (Section 6)
GET    /logistics/vehicles/:vehicleId - Get vehicle details
GET    /logistics/vehicles/:vehicleId/location - Get vehicle current location
GET    /logistics/vehicles/:vehicleId/shipments - Get vehicle's shipments
```

---

## SECTION 6: QUALITY & LABS

### Laboratory Routes (`/api/v1/labs`)
```
GET    /labs                          - List labs (Section 4)
GET    /labs/:labId                   - Get lab details
POST   /labs/:labId/tests             - Book lab test
GET    /labs/test-types               - Get available test types
```

### Lab Tests Routes (`/api/v1/labs/tests`)
```
POST   /labs/tests/soil               - Book soil test (Section 4)
POST   /labs/tests/water              - Book water test
POST   /labs/tests/food-quality       - Book food quality test
POST   /labs/tests/animal             - Book animal health test
GET    /labs/tests/:testId            - Get test results
GET    /labs/tests/:testId/report     - Get test report
GET    /labs/tests/farmer/:farmerId   - Get farmer's test history
```

---

## SECTION 7: PROFESSIONAL ADVISORY

### Advisory Routes (`/api/v1/advisory`)
```
GET    /advisory/doctors              - List available doctors (Section 5)
POST   /advisory/consultation         - Book consultation
GET    /advisory/consultation/:consultationId - Get consultation details
GET    /advisory/consultation/farmer/:farmerId - Get farmer's consultations
```

### Crop Doctor Routes (`/api/v1/advisory/crop-doctor`)
```
POST   /advisory/crop-doctor/diagnose - Submit crop issue (Section 5)
GET    /advisory/crop-doctor/recommendations - Get recommendations
```

### Veterinarian Routes (`/api/v1/advisory/veterinarian`)
```
POST   /advisory/veterinarian/health-check - Book vet consultation
GET    /advisory/veterinarian/records - Get livestock records
```

---

## SECTION 8: KNOWLEDGE & LEARNING

### Knowledge Routes (`/api/v1/knowledge`)
```
GET    /knowledge/articles            - Get knowledge articles (Section 5)
GET    /knowledge/articles/:articleId - Get article details
GET    /knowledge/videos              - Get video library
GET    /knowledge/search              - Search knowledge base
GET    /knowledge/recommendations     - Get personalized recommendations (Claude AI)
```

### Webinar Routes (`/api/v1/knowledge/webinars`)
```
GET    /knowledge/webinars            - List webinars (Section 5)
POST   /knowledge/webinars/:webinarId/register - Register for webinar
GET    /knowledge/webinars/:webinarId/recording - Get webinar recording
```

---

## SECTION 9: FINANCIAL MANAGEMENT

### Payment Routes (`/api/v1/payments`)
```
POST   /payments/process              - Process payment (Section 11)
GET    /payments/:paymentId           - Get payment details
GET    /payments/farmer/:farmerId     - Get farmer's payments
GET    /payments/order/:orderId       - Get payment for order
```

### Settlement Routes (`/api/v1/payments/settlement`)
```
GET    /payments/settlement/:settlementId - Get settlement details (Section 11)
GET    /payments/settlement/farmer/:farmerId - Get farmer's settlements
POST   /payments/settlement/calculate - Calculate settlement for order
```

### Invoice Routes (`/api/v1/payments/invoices`)
```
GET    /payments/invoices/:invoiceId  - Get invoice (Section 11)
GET    /payments/invoices/farmer/:farmerId - Get farmer's invoices
POST   /payments/invoices/:invoiceId/download - Download invoice PDF
```

### Financial Summary Routes (`/api/v1/finance`)
```
GET    /finance/farmer/:farmerId/income-summary - Get income summary (Section 11)
GET    /finance/farmer/:farmerId/expenses - Get expense tracking
GET    /finance/farmer/:farmerId/p-l - Get P&L statement
```

---

## SECTION 10: CREDIT & BANKING

### Credit Routes (`/api/v1/credit`)
```
POST   /credit/application            - Apply for credit (Section 12)
GET    /credit/application/:appId     - Get application status
GET    /credit/calculator/eligibility - Check credit eligibility
GET    /credit/limit/:farmerId        - Get approved credit limit
```

### Loan Routes (`/api/v1/credit/loans`)
```
POST   /credit/loans/crop             - Apply for crop credit (Section 12)
POST   /credit/loans/equipment        - Apply for equipment loan
GET    /credit/loans/:loanId          - Get loan details
GET    /credit/loans/:loanId/repayment-schedule - Get EMI schedule
```

### Wallet Routes (`/api/v1/wallet`)
```
GET    /wallet/:farmerId              - Get wallet balance (Section 11)
POST   /wallet/:farmerId/credit       - Credit wallet
POST   /wallet/:farmerId/debit        - Debit wallet
GET    /wallet/:farmerId/transactions - Get wallet transactions
```

---

## SECTION 11: INSURANCE

### Insurance Routes (`/api/v1/insurance`)
```
GET    /insurance/policies            - Get farmer's policies (Section 13)
POST   /insurance/policies            - Enroll in insurance
GET    /insurance/policies/:policyId  - Get policy details
```

### Claims Routes (`/api/v1/insurance/claims`)
```
POST   /insurance/claims              - File insurance claim (Section 13)
GET    /insurance/claims/:claimId     - Get claim status
PUT    /insurance/claims/:claimId     - Update claim with evidence
GET    /insurance/claims/farmer/:farmerId - Get farmer's claims
```

---

## SECTION 12: SUBSIDY & GOVERNMENT SCHEMES

### Subsidy Routes (`/api/v1/subsidy`)
```
GET    /subsidy/check-eligibility     - Check subsidy eligibility (Section 10)
GET    /subsidy/available-schemes     - Get available schemes
GET    /subsidy/schemes/:schemeId     - Get scheme details
```

### Subsidy Application Routes (`/api/v1/subsidy/applications`)
```
POST   /subsidy/applications          - Apply for subsidy (Section 10)
GET    /subsidy/applications/:appId   - Get application status
PUT    /subsidy/applications/:appId   - Update application with documents
GET    /subsidy/applications/farmer/:farmerId - Get farmer's subsidy applications
```

---

## SECTION 13: CONTRACTS & PROJECTS

### Contract Routes (`/api/v1/contracts`)
```
POST   /contracts                     - Create pre-season contract (Section 16)
GET    /contracts/:contractId         - Get contract details
PUT    /contracts/:contractId         - Update contract status
GET    /contracts/farmer/:farmerId    - Get farmer's contracts
GET    /contracts/buyer/:buyerId      - Get buyer's contracts
POST   /contracts/:contractId/fulfill - Track contract fulfillment
```

### FPO Routes (`/api/v1/fpo`)
```
POST   /fpo/register                  - Register FPO (Section 22)
GET    /fpo/:fpoId                    - Get FPO details
POST   /fpo/:fpoId/members            - Add member to FPO
GET    /fpo/:fpoId/members            - List FPO members
GET    /fpo/:fpoId/aggregation        - Get aggregated inventory
```

### Project Routes (`/api/v1/projects`)
```
POST   /projects                      - Create project (Section 22)
GET    /projects/:projectId           - Get project details
GET    /projects/:projectId/status    - Get project progress
GET    /projects/fpo/:fpoId           - Get FPO's projects
```

---

## SECTION 14: CONFIGURATION & RULES

### Configuration Routes (`/api/v1/configuration`)
```
GET    /configuration/:configKey      - Get configuration value (Section 23)
PUT    /configuration/:configKey      - Update configuration (admin)
GET    /configuration/state/:stateCode - Get state-specific configuration
```

### Rules Routes (`/api/v1/rules`)
```
GET    /rules/:ruleCode               - Get rule details (Section 23)
POST   /rules/evaluate                - Evaluate rule (internal)
```

### Workflow Routes (`/api/v1/workflows`)
```
GET    /workflows/:workflowId         - Get workflow definition (Section 23)
POST   /workflows/:workflowId/start   - Start workflow instance
PUT    /workflows/instances/:instanceId - Update workflow instance
GET    /workflows/instances/:instanceId - Get workflow status
```

---

## SECTION 15: ALERTS & NOTIFICATIONS

### Alert Routes (`/api/v1/alerts`)
```
GET    /alerts/farmer/:farmerId       - Get farmer's alerts (Section 13)
POST   /alerts/acknowledge            - Mark alert as acknowledged
GET    /alerts/history                - Get alert history
```

### Notification Routes (`/api/v1/notifications`)
```
GET    /notifications/preferences/:userId - Get notification preferences (Section 13)
PUT    /notifications/preferences/:userId - Update preferences
```

---

## SECTION 16: DOCUMENTS & COMPLIANCE

### Document Routes (`/api/v1/documents`)
```
POST   /documents/upload              - Upload document (Section 24)
GET    /documents/:documentId         - Get document
DELETE /documents/:documentId         - Delete document
GET    /documents/farmer/:farmerId    - Get farmer's documents
```

### Certification Routes (`/api/v1/certifications`)
```
POST   /certifications                - Upload certification (Section 10)
GET    /certifications/:certId        - Get certification
GET    /certifications/farmer/:farmerId - Get farmer's certifications
```

---

## SECTION 17: ANALYTICS & MRV

### Analytics Routes (`/api/v1/analytics`)
```
GET    /analytics/farmer/:farmerId/income - Get farmer income analytics (Section 22)
GET    /analytics/farmer/:farmerId/production - Get production analytics
GET    /analytics/marketplace         - Get marketplace analytics
GET    /analytics/cold-storage        - Get cold storage utilization
GET    /analytics/dashboard           - Get admin dashboard metrics
```

### MRV Routes (`/api/v1/mrv`)
```
GET    /mrv/baseline/:farmerId        - Get baseline metrics (Section 22)
POST   /mrv/measurement               - Record measurement
GET    /mrv/impact/:farmerId          - Get impact measurements
GET    /mrv/report                    - Get MRV report (FOLU aligned)
```

---

## SECTION 18: GIS & LOCATION

### Location Routes (`/api/v1/location`)
```
GET    /location/villages/:villageId  - Get village details (Section 19)
GET    /location/map/:stateCode       - Get state map
GET    /location/farmers/near         - Get nearby farmers
GET    /location/markets/near         - Get nearby markets
```

---

## SECTION 19: SUPPORT & GRIEVANCE

### Support Routes (`/api/v1/support`)
```
POST   /support/tickets               - Create support ticket (Section 16)
GET    /support/tickets/:ticketId     - Get ticket status
PUT    /support/tickets/:ticketId     - Update ticket
GET    /support/tickets/farmer/:farmerId - Get farmer's tickets
```

### Grievance Routes (`/api/v1/grievance`)
```
POST   /grievance                     - File grievance (Section 16)
GET    /grievance/:grievanceId        - Get grievance status
GET    /grievance/farmer/:farmerId    - Get farmer's grievances
```

### FAQ Routes (`/api/v1/faq`)
```
GET    /faq                           - Get FAQ list (Section 16)
GET    /faq/:faqId                    - Get FAQ details
```

---

## SECTION 20: FIELD OPERATIONS

### Field Visit Routes (`/api/v1/field-operations`)
```
POST   /field-operations/visit        - Log field visit (Section 16)
GET    /field-operations/visit/:visitId - Get visit details
GET    /field-operations/farmer/:farmerId - Get farmer's visits
POST   /field-operations/survey       - Submit survey (offline support)
```

---

## SECTION 21: ADMIN & GOVERNANCE

### Admin Routes (`/api/v1/admin`)
```
GET    /admin/dashboard               - Admin dashboard
GET    /admin/users                   - List all users
POST   /admin/users                   - Create user
GET    /admin/organizations           - List organizations
POST   /admin/organizations           - Create organization
```

### Governance Routes (`/api/v1/governance`)
```
GET    /governance/metrics            - Get governance metrics (Section 23)
GET    /governance/audit              - Get audit logs
GET    /governance/compliance         - Get compliance status
```

---

## ROUTE IMPLEMENTATION NOTES

**Stub Handler Pattern:**
```javascript
router.post('/endpoint', async (req, res) => {
  try {
    /**
     * TODO: Implement endpoint logic
     * Section: [Reference Section from audit]
     * Service: [Service class name]
     * Database: [Table names involved]
     * 
     * Request validation
     * Service call
     * Response
     */
    res.status(200).json({
      success: true,
      message: 'Endpoint stub - not yet implemented',
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
```

---

## TOTAL API ENDPOINTS

- **Auth:** 8 endpoints
- **Master Data:** 25 endpoints
- **Marketplace:** 15 endpoints
- **Cold Storage:** 20 endpoints
- **Logistics:** 9 endpoints
- **Labs:** 8 endpoints
- **Advisory:** 8 endpoints
- **Knowledge:** 7 endpoints
- **Finance:** 12 endpoints
- **Credit:** 8 endpoints
- **Insurance:** 6 endpoints
- **Subsidy:** 7 endpoints
- **Contracts/Projects:** 11 endpoints
- **Configuration:** 6 endpoints
- **Alerts:** 6 endpoints
- **Documents:** 6 endpoints
- **Analytics:** 6 endpoints
- **GIS:** 4 endpoints
- **Support:** 8 endpoints
- **Field Ops:** 4 endpoints
- **Admin:** 6 endpoints

**TOTAL: ~200+ API endpoints**

All endpoints ready for Devin to implement with stub handlers and business logic.

