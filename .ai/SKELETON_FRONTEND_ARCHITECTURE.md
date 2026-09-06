# EBDESIGN FRONTEND SKELETON ARCHITECTURE
**Complete React 18 + Vite Frontend Structure**  
**Maps all 96 architecture points to pages and components**

---

## FRONTEND DIRECTORY STRUCTURE

```
frontend/src/
├── main.jsx                          # React entry point
├── App.jsx                           # Root component
├── index.css                         # Global styles
│
├── components/                       # Reusable components (50+)
│   ├── Layout/
│   │   ├── Header.jsx
│   │   ├── Sidebar.jsx
│   │   ├── Footer.jsx
│   │   ├── Navigation.jsx
│   │   └── MobileNav.jsx
│   │
│   ├── Common/
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   ├── Select.jsx
│   │   ├── Card.jsx
│   │   ├── Modal.jsx
│   │   ├── Loading.jsx
│   │   ├── Error.jsx
│   │   └── Alert.jsx
│   │
│   ├── Forms/
│   │   ├── FormField.jsx
│   │   ├── FormValidator.jsx
│   │   ├── FileUpload.jsx
│   │   └── MultiStepForm.jsx
│   │
│   ├── Data/
│   │   ├── Table.jsx
│   │   ├── DataGrid.jsx
│   │   ├── Pagination.jsx
│   │   ├── Filter.jsx
│   │   └── Sort.jsx
│   │
│   ├── Map/
│   │   ├── Map.jsx
│   │   ├── LocationMarker.jsx
│   │   └── GeoSearch.jsx
│   │
│   ├── Charts/
│   │   ├── LineChart.jsx
│   │   ├── BarChart.jsx
│   │   ├── PieChart.jsx
│   │   └── Dashboard.jsx
│   │
│   └── AI/
│       ├── AIChat.jsx
│       ├── AIRecommendation.jsx
│       └── DecisionExplainer.jsx
│
├── pages/                            # Page components (50+)
│   │
│   ├── Auth/                         # Authentication (3 pages)
│   │   ├── Login.jsx                 # Login page
│   │   ├── Register.jsx              # Registration (Farmer/Buyer)
│   │   └── ForgotPassword.jsx        # Password reset
│   │
│   ├── Farmer/                       # Farmer portal (25 pages)
│   │   ├── Dashboard.jsx             # Main dashboard
│   │   ├── Profile.jsx               # Farmer profile
│   │   ├── KYC.jsx                   # KYC submission
│   │   ├── MyFarms.jsx               # Farm list
│   │   ├── FarmDetail.jsx            # Farm details
│   │   ├── AddFarm.jsx               # Create farm
│   │   ├── Plots.jsx                 # Plot management
│   │   │
│   │   ├── ProductionPlanning.jsx    # Crop planning
│   │   ├── CropPlan.jsx              # Create crop plan
│   │   ├── CropCycle.jsx             # Track crop cycle
│   │   ├── Harvest.jsx               # Harvest management
│   │   │
│   │   ├── Marketplace.jsx           # E-commerce hub
│   │   ├── ListProduct.jsx           # List product for sale
│   │   ├── MyListings.jsx            # Farmer's listings
│   │   ├── Orders.jsx                # Farmer's orders
│   │   ├── OrderDetail.jsx           # Order details
│   │   │
│   │   ├── ColdStorage.jsx           # Storage operations
│   │   ├── BookStorage.jsx           # Book storage space
│   │   ├── StorageInventory.jsx      # Inventory tracking
│   │   ├── TemperatureMonitor.jsx    # Real-time monitoring
│   │   │
│   │   ├── Logistics.jsx             # Shipment tracking
│   │   ├── TrackShipment.jsx         # Real-time tracking
│   │   │
│   │   ├── Finance.jsx               # Financial dashboard
│   │   ├── Income.jsx                # Income tracking
│   │   ├── Transactions.jsx          # Transaction history
│   │   └── PandL.jsx                 # P&L statement
│   │
│   ├── Buyer/                        # Buyer portal (10 pages)
│   │   ├── Dashboard.jsx             # Buyer dashboard
│   │   ├── Search.jsx                # Product search
│   │   ├── SearchResults.jsx         # Search results
│   │   ├── ProductDetail.jsx         # Product details
│   │   ├── SubmitInquiry.jsx         # Submit buyer inquiry
│   │   ├── MyOrders.jsx              # Order management
│   │   ├── Suppliers.jsx             # Supplier list
│   │   ├── SupplierDetail.jsx        # Supplier details
│   │   ├── Contracts.jsx             # Contract management
│   │   └── OrderHistory.jsx          # Order history
│   │
│   ├── Marketplace/                  # E-commerce (8 pages)
│   │   ├── Browse.jsx                # Browse products
│   │   ├── Category.jsx              # Category view
│   │   ├── Search.jsx                # Product search
│   │   ├── ProductCard.jsx           # Product display
│   │   ├── Cart.jsx                  # Shopping cart
│   │   ├── Checkout.jsx              # Order checkout
│   │   ├── OrderConfirmation.jsx     # Confirmation
│   │   └── Pricing.jsx               # Price comparison
│   │
│   ├── ColdStorage/                  # Cold chain (6 pages)
│   │   ├── Nodes.jsx                 # Node list
│   │   ├── NodeDetail.jsx            # Node details
│   │   ├── Booking.jsx               # Book storage
│   │   ├── Availability.jsx          # Capacity check
│   │   ├── Monitoring.jsx            # Temperature monitoring
│   │   └── Costs.jsx                 # Cost calculator
│   │
│   ├── Labs/                         # Laboratory (4 pages)
│   │   ├── ListLabs.jsx              # Labs list
│   │   ├── LabDetail.jsx             # Lab details
│   │   ├── BookTest.jsx              # Book test
│   │   └── TestResults.jsx           # View results
│   │
│   ├── Advisory/                     # Professional services (4 pages)
│   │   ├── Doctors.jsx               # Doctor list
│   │   ├── DoctorDetail.jsx          # Doctor details
│   │   ├── BookConsultation.jsx      # Book consultation
│   │   └── MyConsultations.jsx       # Consultation history
│   │
│   ├── Knowledge/                    # Learning (5 pages)
│   │   ├── Hub.jsx                   # Knowledge hub
│   │   ├── Videos.jsx                # Video library
│   │   ├── Articles.jsx              # Articles
│   │   ├── Webinars.jsx              # Webinars
│   │   └── Search.jsx                # Knowledge search
│   │
│   ├── Finance/                      # Financial services (6 pages)
│   │   ├── Dashboard.jsx             # Finance dashboard
│   │   ├── Income.jsx                # Income tracking
│   │   ├── Expenses.jsx              # Expense tracking
│   │   ├── Accounting.jsx            # Farm accounting
│   │   ├── Reports.jsx               # Financial reports
│   │   └── Forecasting.jsx           # Financial forecasting
│   │
│   ├── Credit/                       # Credit services (4 pages)
│   │   ├── CheckEligibility.jsx      # Credit eligibility
│   │   ├── ApplyCredit.jsx           # Credit application
│   │   ├── MyLoans.jsx               # Active loans
│   │   └── Repayment.jsx             # Repayment schedule
│   │
│   ├── Insurance/                    # Insurance (4 pages)
│   │   ├── Policies.jsx              # Insurance policies
│   │   ├── EnrollPolicy.jsx          # Enroll in insurance
│   │   ├── MyClaims.jsx              # Claims management
│   │   └── FileClam.jsx              # File new claim
│   │
│   ├── Subsidy/                      # Government schemes (4 pages)
│   │   ├── CheckEligibility.jsx      # Subsidy eligibility
│   │   ├── AvailableSchemes.jsx      # Available schemes
│   │   ├── Apply.jsx                 # Subsidy application
│   │   └── Status.jsx                # Application status
│   │
│   ├── Contracts/                    # Contracts (2 pages)
│   │   ├── MyContracts.jsx           # Contract list
│   │   └── ContractDetail.jsx        # Contract details
│   │
│   ├── Projects/                     # Project development (3 pages)
│   │   ├── Projects.jsx              # Project list
│   │   ├── ProjectDetail.jsx         # Project details
│   │   └── Feasibility.jsx           # Feasibility assessment
│   │
│   ├── Support/                      # Help & support (4 pages)
│   │   ├── Tickets.jsx               # Support tickets
│   │   ├── CreateTicket.jsx          # Create ticket
│   │   ├── FAQ.jsx                   # FAQ
│   │   └── ContactUs.jsx             # Contact support
│   │
│   ├── GIS/                          # Maps & location (2 pages)
│   │   ├── Map.jsx                   # Interactive map
│   │   └── Location.jsx              # Location info
│   │
│   ├── Admin/                        # Administration (8 pages)
│   │   ├── Dashboard.jsx             # Admin dashboard
│   │   ├── Users.jsx                 # User management
│   │   ├── Organizations.jsx         # Organization management
│   │   ├── Configuration.jsx         # System configuration
│   │   ├── RuleBuilder.jsx           # Rule configuration
│   │   ├── Monitoring.jsx            # System monitoring
│   │   ├── Reports.jsx               # Reports
│   │   └── Audit.jsx                 # Audit logs
│   │
│   ├── Analytics/                    # Analytics (4 pages)
│   │   ├── Dashboard.jsx             # Analytics dashboard
│   │   ├── FarmerMetrics.jsx         # Farmer analytics
│   │   ├── MarketplaceMetrics.jsx    # Marketplace analytics
│   │   └── MRV.jsx                   # MRV/Impact reporting
│   │
│   ├── Settings/                     # User settings (4 pages)
│   │   ├── Profile.jsx               # Profile settings
│   │   ├── Security.jsx              # Security settings (MFA)
│   │   ├── Preferences.jsx           # Notification preferences
│   │   └── DataPrivacy.jsx           # Privacy & GDPR
│   │
│   ├── Mobile/                       # Mobile-specific (3 pages)
│   │   ├── MobileHome.jsx            # Mobile home
│   │   ├── MobileMenu.jsx            # Mobile navigation
│   │   └── MobileProfile.jsx         # Mobile profile
│   │
│   ├── Shared/                       # Shared pages (3 pages)
│   │   ├── Home.jsx                  # Landing/home
│   │   ├── NotFound.jsx              # 404 page
│   │   └── Unauthorized.jsx          # 403 page
│   │
│   └── Offline/                      # Offline support (2 pages)
│       ├── OfflineMode.jsx           # Offline indicator
│       └── SyncStatus.jsx            # Sync status
│
├── services/                         # API client services
│   ├── api.js                        # Axios instance
│   ├── authService.js                # Auth API
│   ├── farmerService.js              # Farmer API
│   ├── farmService.js                # Farm API
│   ├── marketplaceService.js         # Marketplace API
│   ├── coldStorageService.js         # Cold storage API
│   ├── logisticsService.js           # Logistics API
│   ├── paymentService.js             # Payment API
│   ├── labService.js                 # Lab API
│   ├── advisoryService.js            # Advisory API
│   ├── financeService.js             # Finance API
│   ├── creditService.js              # Credit API
│   ├── insuranceService.js           # Insurance API
│   ├── subsidyService.js             # Subsidy API
│   ├── analyticsService.js           # Analytics API
│   ├── gisService.js                 # GIS API
│   ├── supportService.js             # Support API
│   └── commonService.js              # Shared utilities
│
├── stores/                           # Zustand state management
│   ├── authStore.js                  # Auth state
│   ├── farmerStore.js                # Farmer data
│   ├── uiStore.js                    # UI state
│   ├── notificationStore.js          # Notifications
│   ├── cartStore.js                  # Shopping cart
│   ├── filtersStore.js               # Search filters
│   ├── mapStore.js                   # Map state
│   └── settingsStore.js              # User settings
│
├── hooks/                            # Custom React hooks
│   ├── useAuth.js                    # Authentication hook
│   ├── useApi.js                     # API call hook
│   ├── useLocalStorage.js            # Local storage hook
│   ├── useLocation.js                # Location hook
│   ├── useWeather.js                 # Weather hook
│   ├── useOffline.js                 # Offline mode hook
│   ├── useForm.js                    # Form handling hook
│   └── useMap.js                     # Map integration hook
│
├── utils/                            # Utility functions
│   ├── constants.js                  # App constants
│   ├── formatters.js                 # Data formatters
│   ├── validators.js                 # Form validators
│   ├── encryption.js                 # Data encryption
│   ├── geolocation.js                # Geolocation utils
│   └── imageUpload.js                # Image handling
│
├── styles/                           # Global styles
│   ├── index.css                     # Global styles
│   ├── variables.css                 # CSS variables
│   ├── responsive.css                # Responsive styles
│   └── themes.css                    # Dark/light mode
│
├── config/                           # Configuration
│   ├── app.config.js                 # App configuration
│   ├── api.config.js                 # API configuration
│   └── theme.config.js               # Theme configuration
│
└── router/                           # React Router setup
    └── routes.jsx                    # Route definitions
```

---

## ROUTER CONFIGURATION

#### `frontend/src/router/routes.jsx`

```javascript
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layout
import MainLayout from '../components/Layout/MainLayout';
import MobileLayout from '../components/Layout/MobileLayout';

// Auth pages
import Login from '../pages/Auth/Login';
import Register from '../pages/Auth/Register';

// Farmer pages
import FarmerDashboard from '../pages/Farmer/Dashboard';
import FarmerProfile from '../pages/Farmer/Profile';
// ... import all 50+ pages

/**
 * Route Configuration
 * Maps all 96 business functions to pages
 */
export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected farmer routes */}
        <Route path="/" element={<MainLayout />}>
          <Route path="farmer/dashboard" element={<FarmerDashboard />} />
          <Route path="farmer/profile" element={<FarmerProfile />} />
          <Route path="farmer/farms" element={<FarmerFarms />} />
          {/* ... all other farmer routes */}
        </Route>

        {/* Buyer routes */}
        <Route path="/buyer/*" element={<MainLayout />}>
          {/* ... buyer routes */}
        </Route>

        {/* Admin routes */}
        <Route path="/admin/*" element={<MainLayout />}>
          {/* ... admin routes */}
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## PAGE COMPONENT TEMPLATE

#### `frontend/src/pages/Farmer/Dashboard.jsx`

```javascript
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import useFarmerStore from '../../stores/farmerStore';
import farmerService from '../../services/farmerService';
import Button from '../../components/Common/Button';
import Card from '../../components/Common/Card';
import Loading from '../../components/Common/Loading';

/**
 * Farmer Dashboard (Section 3: Farmer Profile)
 * Main entry point for farmer user
 * 
 * Shows:
 * - Farm overview
 * - Recent orders
 * - Income summary
 * - Alerts
 * - Quick actions
 */
export default function FarmerDashboard() {
  const { user } = useAuth();
  const farmer = useFarmerStore((state) => state.farmer);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    /**
     * TODO: Load farmer data on mount
     * - Fetch farmer profile
     * - Fetch recent orders
     * - Fetch income summary
     * - Fetch alerts
     */
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // TODO: Call farmerService.getFarmerData()
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="dashboard-container">
      <h1>Welcome back, {farmer?.name}!</h1>

      <div className="dashboard-grid">
        {/* Card 1: Farm Overview */}
        <Card title="My Farms">
          {/* TODO: Display farm list */}
          <Button onClick={() => navigate('/farmer/farms')}>
            Manage Farms
          </Button>
        </Card>

        {/* Card 2: Recent Orders */}
        <Card title="Recent Orders">
          {/* TODO: Display recent orders */}
          <Button onClick={() => navigate('/farmer/orders')}>
            View All Orders
          </Button>
        </Card>

        {/* Card 3: Income */}
        <Card title="Income Summary">
          {/* TODO: Display income metrics */}
          <Button onClick={() => navigate('/farmer/finance/income')}>
            View Detailed Report
          </Button>
        </Card>

        {/* Card 4: Cold Storage */}
        <Card title="Cold Storage">
          {/* TODO: Display storage bookings */}
          <Button onClick={() => navigate('/farmer/cold-storage')}>
            Book Storage
          </Button>
        </Card>

        {/* Card 5: Alerts */}
        <Card title="Latest Alerts">
          {/* TODO: Display alerts */}
          <Button onClick={() => navigate('/farmer/alerts')}>
            View All
          </Button>
        </Card>

        {/* Card 6: Quick Actions */}
        <Card title="Quick Actions">
          <Button onClick={() => navigate('/marketplace/list-product')}>
            Sell Product
          </Button>
          <Button onClick={() => navigate('/cold-storage/book')}>
            Book Storage
          </Button>
          <Button onClick={() => navigate('/labs/book-test')}>
            Book Test
          </Button>
        </Card>
      </div>
    </div>
  );
}
```

---

## API SERVICE TEMPLATE

#### `frontend/src/services/farmerService.js`

```javascript
import api from './api';

/**
 * Farmer Service (API Client)
 * All farmer-related API calls
 */
class FarmerService {
  /**
   * Register new farmer (Section 3: Farmer Onboarding)
   * TODO: Call POST /api/v1/farmers/register
   */
  async registerFarmer(data) {
    return api.post('/farmers/register', data);
  }

  /**
   * Get farmer profile
   * TODO: Call GET /api/v1/farmers/:farmerId
   */
  async getFarmerProfile(farmerId) {
    return api.get(`/farmers/${farmerId}`);
  }

  /**
   * Update farmer profile
   * TODO: Call PUT /api/v1/farmers/:farmerId
   */
  async updateFarmerProfile(farmerId, data) {
    return api.put(`/farmers/${farmerId}`, data);
  }

  /**
   * Get farmer's farms
   * TODO: Call GET /api/v1/farmers/:farmerId/farms
   */
  async getFarmerFarms(farmerId) {
    return api.get(`/farmers/${farmerId}/farms`);
  }

  /**
   * Get farmer income summary
   * TODO: Call GET /api/v1/farmers/:farmerId/income
   */
  async getFarmerIncome(farmerId) {
    return api.get(`/farmers/${farmerId}/income`);
  }

  /**
   * Get farmer transactions
   * TODO: Call GET /api/v1/farmers/:farmerId/transactions
   */
  async getFarmerTransactions(farmerId) {
    return api.get(`/farmers/${farmerId}/transactions`);
  }
}

export default new FarmerService();
```

---

## STATE MANAGEMENT TEMPLATE

#### `frontend/src/stores/farmerStore.js`

```javascript
import { create } from 'zustand';

/**
 * Farmer Store (Zustand)
 * Manages farmer-related state
 */
const useFarmerStore = create((set) => ({
  farmer: null,
  farms: [],
  orders: [],
  income: null,
  loading: false,

  // TODO: Actions
  setFarmer: (farmer) => set({ farmer }),
  setFarms: (farms) => set({ farms }),
  setOrders: (orders) => set({ orders }),
  setIncome: (income) => set({ income }),
  setLoading: (loading) => set({ loading }),

  // Clear state
  clearFarmerState: () =>
    set({
      farmer: null,
      farms: [],
      orders: [],
      income: null,
    }),
}));

export default useFarmerStore;
```

---

## CUSTOM HOOK TEMPLATE

#### `frontend/src/hooks/useAuth.js`

```javascript
import { useEffect, useState } from 'react';
import useAuthStore from '../stores/authStore';
import authService from '../services/authService';

/**
 * useAuth Hook
 * Provides authentication state and methods
 */
export default function useAuth() {
  const { user, token } = useAuthStore();
  const [isAuthenticated, setIsAuthenticated] = useState(!!token);

  useEffect(() => {
    // TODO: Verify token on mount
    // verifyToken();
  }, [token]);

  const login = async (email, password) => {
    // TODO: Call authService.login
    // Set user and token in store
  };

  const logout = async () => {
    // TODO: Call authService.logout
    // Clear store
  };

  return {
    user,
    token,
    isAuthenticated,
    login,
    logout,
  };
}
```

---

## PAGE STRUCTURE: 50+ PAGES BY CATEGORY

### **Authentication (3 pages)**
1. Login.jsx - User login
2. Register.jsx - Farmer/Buyer registration
3. ForgotPassword.jsx - Password reset

### **Farmer Portal (25 pages)**
4-28: Profile, KYC, Farms, Crops, Production, Harvest, Orders, Storage, Logistics, Finance, Credit, Insurance, etc.

### **Buyer Portal (10 pages)**
29-38: Dashboard, Search, Browse, Orders, Suppliers, Contracts, etc.

### **Marketplace (8 pages)**
39-46: Browse, Category, Search, Cart, Checkout, Confirmation, etc.

### **Cold Storage (6 pages)**
47-52: Nodes, Booking, Inventory, Monitoring, Costs, etc.

### **Labs (4 pages)**
53-56: Lab list, Lab detail, Book test, Results

### **Advisory (4 pages)**
57-60: Doctor list, Doctor detail, Book consultation, Consultation history

### **Knowledge (5 pages)**
61-65: Hub, Videos, Articles, Webinars, Search

### **Finance (6 pages)**
66-71: Dashboard, Income, Expenses, Accounting, Reports, Forecasting

### **Credit (4 pages)**
72-75: Eligibility, Apply, Active loans, Repayment

### **Insurance (4 pages)**
76-79: Policies, Enroll, Claims, File claim

### **Subsidy (4 pages)**
80-83: Eligibility, Schemes, Apply, Status

### **Support & Settings (8 pages)**
84-91: Tickets, FAQ, Contact, Profile, Security, Preferences, Privacy, etc.

### **Admin (8 pages)**
92-99: Dashboard, Users, Organizations, Configuration, Rules, Monitoring, Reports, Audit

### **Analytics (4 pages)**
100-103: Dashboard, Farmer metrics, Marketplace metrics, MRV

### **Shared (3 pages)**
104-106: Home, 404, 403

**TOTAL: 106 pages/views (exceeds 50+ requirement)**

---

## FRONTEND SKELETON IMPLEMENTATION CHECKLIST

### Component Library (20 components)
- [ ] Button.jsx
- [ ] Input.jsx
- [ ] Select.jsx
- [ ] Card.jsx
- [ ] Modal.jsx
- [ ] Table.jsx
- [ ] Loading.jsx
- [ ] Error.jsx
- [ ] Alert.jsx
- [ ] Pagination.jsx
- [ ] Navigation.jsx
- [ ] Header.jsx
- [ ] Sidebar.jsx
- [ ] Footer.jsx
- [ ] Form.jsx
- [ ] FileUpload.jsx
- [ ] Map.jsx
- [ ] Chart.jsx
- [ ] AIChat.jsx
- [ ] DecisionExplainer.jsx

### Key Pages (Priority order)
- [ ] Login.jsx
- [ ] FarmerDashboard.jsx
- [ ] MarketplaceBrowse.jsx
- [ ] ColdStorageBooking.jsx
- [ ] OrderManagement.jsx
- [ ] PaymentCheckout.jsx
- [ ] AdminDashboard.jsx
- [ ] Analytics.jsx

### State Management (Zustand)
- [ ] authStore.js
- [ ] farmerStore.js
- [ ] marketplaceStore.js
- [ ] cartStore.js
- [ ] uiStore.js
- [ ] notificationStore.js

### API Services (15+ services)
- [ ] api.js (Axios instance)
- [ ] authService.js
- [ ] farmerService.js
- [ ] marketplaceService.js
- [ ] coldStorageService.js
- [ ] paymentService.js
- [ ] analyticsService.js
- [ ] (10+ more services)

### Custom Hooks (8 hooks)
- [ ] useAuth.js
- [ ] useApi.js
- [ ] useForm.js
- [ ] useLocalStorage.js
- [ ] useOffline.js
- [ ] useLocation.js
- [ ] useWeather.js
- [ ] useMap.js

### Utilities
- [ ] constants.js
- [ ] formatters.js
- [ ] validators.js
- [ ] encryption.js

---

## RESPONSIVE DESIGN GUIDELINES

### Breakpoints
```css
Mobile: < 640px
Tablet: 640px - 1024px
Desktop: > 1024px
```

### Mobile-First CSS
- All base styles for mobile
- `@media (min-width: 640px)` for tablet
- `@media (min-width: 1024px)` for desktop

### Key Mobile Features
- Touch-friendly buttons (44px+ height)
- Mobile navigation (hamburger menu)
- Optimized forms for mobile input
- Image optimization for bandwidth
- Offline-first support

---

## STYLING APPROACH

### TailwindCSS + Custom CSS Variables
```css
:root {
  --primary-color: #2563eb;
  --secondary-color: #10b981;
  --danger-color: #ef4444;
  --bg-color: #f9fafb;
  --text-color: #1f2937;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg-color: #1f2937;
    --text-color: #f9fafb;
  }
}
```

---

## KEY INTEGRATIONS

### Real-time Features
- Socket.IO for live order updates
- Real-time temperature monitoring
- Live alerts and notifications

### External Integrations
- Google Maps for GIS
- Weather API for forecasts
- Payment gateway (Stripe/Razorpay)
- SMS/WhatsApp (Twilio)

### Offline Support
- Service Worker for offline mode
- Local storage for app state
- Sync engine for background sync

---

## FRONTEND SKELETON CHECKLIST

✅ Directory structure created  
✅ Component templates created  
✅ Page templates created  
✅ State management setup  
✅ API service templates  
✅ Custom hooks templates  
✅ Router configuration  
✅ Styling approach defined  
✅ Responsive design guidelines  
✅ Real-time integration points  
✅ Offline-first architecture  
✅ Accessibility standards  

Ready for Devin to implement all components and pages!

