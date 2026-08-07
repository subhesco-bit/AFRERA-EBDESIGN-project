# Vendor-Facing and Back-Office Implementation

This document summarizes the vendor-facing and back-office interfaces implemented for the AFRERA platform.

## Vendor-Facing Interfaces

### 1. Corporate Buyer Portal

**File:** `frontend/src/pages/CorporateBuyerPage.jsx`

**Features:**
- **Credit Status Display:** Shows NET 0/30/60 eligibility based on turnover and vintage
- **Dashboard Overview:** Quick stats for active orders, total spent, suppliers, bulk savings
- **Bulk Pricing Tiers:** Visual display of discount tiers (Starter, Bronze, Silver, Gold)
- **Credit Terms:** Information about available payment terms
- **Order Management:** Create and track bulk orders
- **Order Modal:** Form for creating new bulk orders with product, quantity, destination, and delivery date

**Key Capabilities:**
- Bulk procurement with quantity-based discounts
- Credit term visualization (NET 0/30/60)
- Order tracking and management
- Integration with decision support service for credit eligibility

**Route:** `/corporate-buyer` (protected, requires `corporate` role)

---

### 2. Logistics Provider Portal

**File:** `frontend/src/pages/LogisticsProviderPage.jsx`

**Features:**
- **Dashboard Overview:** Active shipments, cold-chain nodes, revenue, on-time delivery rate
- **12-Node Cold-Chain Corridor:** Visual representation of the logistics network
- **Equipment Status:** Reefer trucks, cold storage units, pre-cooling centers, mobile cold rooms
- **Active Shipments:** Track shipments with origin, destination, quantity, temperature, and ETA
- **Cold-Chain Network:** View all network nodes with capacity and utilization
- **Return-Truck Optimization:** Available return lanes from NCR to Northeast production nodes
- **Booking Modal:** Create logistics bookings with origin, destination, quantity, temperature, and pickup date

**Key Capabilities:**
- Cold-chain corridor management
- Shipment tracking and monitoring
- Equipment fleet management
- Return-truck lane optimization
- Temperature-controlled logistics

**Route:** `/logistics-provider` (protected, requires `logistics` role)

---

## Back-Office Interface

### 3. Admin Dashboard

**File:** `frontend/src/pages/AdminDashboardPage.jsx`

**Features:**
- **System Health Banner:** Real-time system status and uptime
- **Overview Tab:**
  - Platform statistics (users, orders, GMV, daily active users)
  - User distribution by role
  - Recent activity feed
  - Service health monitoring
- **Users Tab:** User management with role-based statistics
- **Orders Tab:** Order management with status breakdown
- **Finance Tab:** Financial overview with revenue, pending payments, platform margin
- **Logistics Tab:** Logistics operations with active shipments, cold-chain nodes, on-time rate
- **Audit Trail Tab:** Complete audit log of all platform events
- **Schemes Tab:** Government scheme monitoring with verification discipline
- **Data Console Tab:** Data management with record statistics and sync status
- **Settings Tab:** Platform configuration, user roles, integration settings

**Key Capabilities:**
- Comprehensive platform oversight
- Real-time system monitoring
- Multi-dimensional analytics
- Audit trail compliance
- Scheme verification monitoring
- Data console integration

**Route:** `/admin-dashboard` (protected, requires `admin` role)

---

## Backend API Routes

### Vendor Routes

**File:** `backend/src/routes/vendorRoutes.js`

**Endpoints:**

#### Corporate Buyer Endpoints
- `GET /api/v1/vendors/corporate/:buyerId/profile` - Get buyer profile
- `GET /api/v1/vendors/corporate/:buyerId/credit-status` - Get credit eligibility
- `GET /api/v1/vendors/corporate/:buyerId/orders` - Get active orders
- `POST /api/v1/vendors/corporate/orders` - Create corporate order

#### Logistics Provider Endpoints
- `GET /api/v1/vendors/logistics/:providerId/profile` - Get provider profile
- `GET /api/v1/vendors/logistics/:providerId/shipments` - Get active shipments
- `GET /api/v1/vendors/logistics/coldchain-nodes` - Get cold-chain network
- `GET /api/v1/vendors/logistics/return-trucks` - Get return truck opportunities
- `POST /api/v1/vendors/logistics/bookings` - Create logistics booking

#### Food Processor Endpoints
- `GET /api/v1/vendors/processor/:processorId/profile` - Get processor profile

#### Retailer Endpoints
- `GET /api/v1/vendors/retailer/:retailerId/profile` - Get retailer profile

**Integration:**
- Uses decision support service for credit eligibility calculation
- Mock data for demonstration (would connect to database in production)
- Authentication middleware on all endpoints
- Role-based access control

---

## Navigation Updates

### Header Component Updates

**File:** `frontend/src/components/Header.jsx`

**Changes:**
- Added vendor portal dropdown for corporate and logistics roles
- Added admin portal dropdown for admin role
- Added mobile menu entries for vendor and admin portals
- Role-based visibility of navigation items

**Desktop Navigation:**
- Vendor Portal dropdown (visible to corporate/logistics roles)
- Admin dropdown (visible to admin role)

**Mobile Navigation:**
- Vendor Portal section (visible to corporate/logistics roles)
- Admin Portal section (visible to admin role)

---

## Route Configuration

### App.jsx Updates

**File:** `frontend/src/App.jsx`

**New Routes:**
- `/corporate-buyer` - Corporate Buyer Portal (protected, corporate role)
- `/logistics-provider` - Logistics Provider Portal (protected, logistics role)
- `/admin-dashboard` - Admin Dashboard (protected, admin role)

**Integration:**
- All routes use ProtectedRoute component
- Role-based access control enforced
- Consistent with existing route patterns

---

## Backend Integration

### Index.js Updates

**File:** `backend/src/index.js`

**Changes:**
- Imported vendorRoutes
- Mounted vendor routes at `/api/v1/vendors`

**Mount Point:**
- `/api/v1/vendors/*` - All vendor-facing endpoints

---

## Implementation Details

### Credit Eligibility Integration

The Corporate Buyer portal integrates with the decision support service to determine credit eligibility:

```javascript
const creditStatus = decisionSupportService.corpCreditEligible(
  profile.turnover_cr,
  profile.vintage_years
);
```

**Credit Tiers:**
- NET 0: Pay on delivery (new accounts)
- NET 30: 30 days credit (₹1Cr+ turnover, 1+ years)
- NET 60: 60 days credit (₹5Cr+ turnover, 3+ years)

### Cold-Chain Network

The Logistics Provider portal includes a 12-node cold-chain corridor:

**Node Types:**
- Production Nodes (6): Source locations in Northeast
- Transit Hubs (4): Intermediate distribution points
- Distribution Centers (2): Final distribution to markets

**Equipment Types:**
- Reefer Trucks (45 total, 38 active)
- Cold Storage Units (12 total, 11 active)
- Pre-cooling Centers (22 total, 20 active)
- Mobile Cold Rooms (8 total, 6 active)

### Return-Truck Optimization

The platform includes return-truck lane optimization to reduce empty miles:

**Available Lanes:**
- NCR → Guwahati (1,750 km)
- NCR → Imphal (2,350 km)
- NCR → Kohima (2,050 km)
- NCR → Kolkata (1,050 km)

**Benefits:**
- Reduced empty miles
- Improved logistics margins
- Better vehicle utilization
- Lower carbon footprint

---

## Security and Access Control

### Role-Based Access

All interfaces enforce role-based access control:

- **Corporate Buyer:** Only accessible to users with `corporate` role
- **Logistics Provider:** Only accessible to users with `logistics` role
- **Admin Dashboard:** Only accessible to users with `admin` role

### Authentication

All routes require authentication via ProtectedRoute component:
- Checks for valid authentication token
- Validates user role before granting access
- Redirects unauthorized users to login

### API Security

All backend endpoints use authentication middleware:
- JWT token validation
- Role-based permission checks
- Request validation and sanitization

---

## Future Enhancements

### Corporate Buyer
- Integration with real inventory system
- Contract management
- Invoice generation and tracking
- Payment processing integration
- Supplier performance analytics

### Logistics Provider
- Real-time GPS tracking
- Temperature monitoring alerts
- Automated routing optimization
- Fleet management integration
- Predictive maintenance

### Admin Dashboard
- Real-time data visualization
- Advanced analytics and reporting
- User management interface
- System configuration UI
- Audit trail search and filtering

---

## Testing Considerations

### Unit Tests
- Credit eligibility calculation
- Bulk pricing tier logic
- Order creation flow
- Shipment tracking logic

### Integration Tests
- API endpoint connectivity
- Authentication flow
- Role-based access control
- Data persistence

### E2E Tests
- Complete user journeys
- Cross-platform compatibility
- Mobile responsiveness
- Error handling

---

## Documentation Status

- ✅ Vendor-facing interfaces implemented
- ✅ Back-office interface implemented
- ✅ Backend API routes created
- ✅ Navigation updated
- ✅ Route configuration complete
- ✅ Security and access control enforced

---

## Summary

The vendor-facing and back-office interfaces provide comprehensive support for:

1. **Corporate Buyers:** Bulk procurement with credit facilities
2. **Logistics Providers:** Cold-chain management and return-truck optimization
3. **Administrators:** Complete platform oversight and governance

All interfaces follow the established patterns from the farmer-facing routes, ensuring consistency in design, functionality, and user experience across the platform.