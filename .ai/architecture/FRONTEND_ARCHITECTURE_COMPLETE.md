# EBDESIGN Frontend Architecture
## React Components for 24+ Backend Layers

**Technology Stack:**
- React 18 + Vite
- Zustand (state management)
- React Router v6
- Radix UI (components)
- TailwindCSS (styling)
- TypeScript (type safety)
- Axios (API client)
- Socket.IO (real-time)

---

## COMPONENT HIERARCHY (Directory Structure)

```
frontend/src/
├── components/
│  ├── CORE/
│  │  ├── Navbar.jsx
│  │  ├── Sidebar.jsx
│  │  ├── Footer.jsx
│  │  └── Layout.jsx
│  │
│  ├── MARKETPLACE/ (Layer 1)
│  │  ├── ProductList.jsx
│  │  ├── ProductCard.jsx
│  │  ├── ProductDetails.jsx
│  │  ├── CreateListing.jsx
│  │  ├── PriceIntelligence.jsx
│  │  ├── BuyerMatching.jsx
│  │  ├── OrderManagement.jsx
│  │  ├── FarmersReputation.jsx
│  │  └── DynamicPricingEngine.jsx
│  │
│  ├── FARMER_PROFILE/ (Layer 2)
│  │  ├── FarmerRegistration.jsx
│  │  ├── FarmProfileForm.jsx
│  │  ├── ProductionCapacity.jsx
│  │  ├── CertificationTracker.jsx
│  │  ├── FPOManagement.jsx
│  │  └── FarmerDashboard.jsx
│  │
│  ├── COLD_STORAGE/ (Layer 3)
│  │  ├── StorageNodeMap.jsx
│  │  ├── BookingForm.jsx
│  │  ├── RealTimeMonitoring.jsx
│  │  ├── TemperatureChart.jsx
│  │  ├── DispatchTracking.jsx
│  │  ├── CostCalculator.jsx
│  │  └── LogisticsOptimizer.jsx
│  │
│  ├── SHARED_INFRA/ (Layer 4)
│  │  ├── AggregationNodeScheduler.jsx
│  │  ├── EquipmentPooling.jsx
│  │  ├── SharedFacilities.jsx
│  │  ├── CostSplitCalculator.jsx
│  │  └── CollectiveOrders.jsx
│  │
│  ├── KNOWLEDGE/ (Layer 5)
│  │  ├── VideoLibrary.jsx
│  │  ├── ArticleSearch.jsx
│  │  ├── ExpertWebinars.jsx
│  │  ├── CommunityForum.jsx
│  │  ├── CropAdvisor.jsx
│  │  ├── MarketIntelligence.jsx
│  │  └── KnowledgeSearch.jsx
│  │
│  ├── FOOD_STORAGE/ (Layer 6)
│  │  ├── StorageDurationTracker.jsx
│  │  ├── InventoryManager.jsx
│  │  ├── QualityMonitor.jsx
│  │  ├── ProcessingScheduler.jsx
│  │  └── ShelfLifeCalculator.jsx
│  │
│  ├── LABS/ (Layer 7)
│  │  ├── SoilTestBooking.jsx
│  │  ├── WaterQualityTest.jsx
│  │  ├── FoodQualityTest.jsx
│  │  ├── AnimalHealthTest.jsx
│  │  ├── TestResultsViewer.jsx
│  │  ├── RecommendationEngine.jsx
│  │  └── LabLocations.jsx
│  │
│  ├── DOCTORS/ (Layer 8)
│  │  ├── DoctorDirectory.jsx
│  │  ├── ConsultationBooking.jsx
│  │  ├── VideoChatInterface.jsx
│  │  ├── PrescriptionViewer.jsx
│  │  ├── ConsultationHistory.jsx
│  │  └── EmergencyResponse.jsx
│  │
│  ├── EQUIPMENT_SUBSIDY/ (Layer 9)
│  │  ├── SubsidyEligibility.jsx
│  │  ├── SchemeDirectory.jsx
│  │  ├── ApplicationForm.jsx
│  │  ├── DocumentUpload.jsx
│  │  ├── StatusTracker.jsx
│  │  ├── EquipmentCatalog.jsx
│  │  └── LeasingOptions.jsx
│  │
│  ├── COMPLIANCE/ (Layer 10)
│  │  ├── GSTHelper.jsx
│  │  ├── GSTFilingForm.jsx
│  │  ├── FSAIRegistration.jsx
│  │  ├── CertificationTracker.jsx
│  │  ├─Document Manager.jsx
│  │  └── ComplianceChecklist.jsx
│  │
│  ├── FINANCE/ (Layer 11)
│  │  ├── FarmAccounting.jsx
│  │  ├── IncomeStatement.jsx
│  │  ├── ExpenseTracker.jsx
│  │  ├── CostAnalysis.jsx
│  │  ├── MarginCalculator.jsx
│  │  ├── TaxOptimizer.jsx
│  │  ├── FinancialDashboard.jsx
│  │  └── ReportGenerator.jsx
│  │
│  ├── WEATHER/ (Layer 12)
│  │  ├── WeatherForecast.jsx
│  │  ├── AlertNotifications.jsx
│  │  ├── CropAdvisory.jsx
│  │  ├── HistoricalData.jsx
│  │  ├── ActionRecommendations.jsx
│  │  └── WeatherMap.jsx
│  │
│  ├── ALERTS/ (Layer 13)
│  │  ├── AlertCenter.jsx
│  │  ├── AlertSettings.jsx
│  │  ├── AlertHistory.jsx
│  │  ├── MarketAlerts.jsx
│  │  ├── WeatherAlerts.jsx
│  │  ├── ProductionAlerts.jsx
│  │  ├── PaymentAlerts.jsx
│  │  └── NotificationPreferences.jsx
│  │
│  ├── INTEGRATIONS/ (Layer 14)
│  │  ├── GSTSoftwareSync.jsx
│  │  ├── BankIntegration.jsx
│  │  ├── InsuranceSync.jsx
│  │  ├── GovernmentPortals.jsx
│  │  ├── MarketDataFeeds.jsx
│  │  └── IntegrationStatus.jsx
│  │
│  ├── SALES/ (Layer 15)
│  │  ├── OrderTracker.jsx
│  │  ├── SalesHistory.jsx
│  │  ├── RevenueAnalytics.jsx
│  │  ├── RepeatOrderAutomation.jsx
│  │  ├── BuyerRelationship.jsx
│  │  ├── SeasonalPlanning.jsx
│  │  └── GrowthProjection.jsx
│  │
│  ├── SUPPORT/ (Layer 16)
│  │  ├── HelpDesk.jsx
│  │  ├── TicketForm.jsx
│  │  ├── FAQViewer.jsx
│  │  ├── ChatSupport.jsx
│  │  ├── KnowledgeBase.jsx
│  │  ├── GrievanceForm.jsx
│  │  └── SupportTicketList.jsx
│  │
│  ├── PAYMENTS/ (Layer 17)
│  │  ├── PaymentDashboard.jsx
│  │  ├── TransactionHistory.jsx
│  │  ├── SettlementTracker.jsx
│  │  ├── InvoiceViewer.jsx
│  │  ├── BankAccountLinking.jsx
│  │  ├── WalletManager.jsx
│  │  └── PaymentReconciliation.jsx
│  │
│  ├── INSURANCE/ (Layer 18)
│  │  ├── InsuranceProducts.jsx
│  │  ├── PolicyEnrollment.jsx
│  │  ├── PolicyViewer.jsx
│  │  ├── ClaimForm.jsx
│  │  ├── ClaimTracker.jsx
│  │  └── CoverageCalculator.jsx
│  │
│  ├── CREDIT/ (Layer 19)
│  │  ├── CreditEligibility.jsx
│  │  ├── LoanApplication.jsx
│  │  ├── CreditLimit.jsx
│  │  ├── RepaymentSchedule.jsx
│  │  ├── DocumentSubmission.jsx
│  │  └── CreditHistory.jsx
│  │
│  ├── SUBSIDY/ (Layer 20)
│  │  ├── SubsidyPrograms.jsx
│  │  ├── EligibilityChecker.jsx
│  │  ├── ApplicationProcess.jsx
│  │  ├── StatusTracker.jsx
│  │  └── ReimbursementDetails.jsx
│  │
│  ├── CONTRACTS/ (Layer 21)
│  │  ├── ContractBrowser.jsx
│  │  ├── ContractForm.jsx
│  │  ├── ContractSigner.jsx
│  │  ├── ActiveContracts.jsx
│  │  ├── DisputeResolution.jsx
│  │  └── ContractHistory.jsx
│  │
│  ├── PROJECT_DEVELOPMENT/ (Layer 22)
│  │  ├── FPOFormation.jsx
│  │  ├── FeasibilityAssessment.jsx
│  │  ├── BusinessPlanBuilder.jsx
│  │  ├── ProjectTracking.jsx
│  │  ├── ImpactMeasurement.jsx
│  │  └── ScalingStrategy.jsx
│  │
│  └── ADMIN/
│     ├── AdminDashboard.jsx
│     ├── UserManagement.jsx
│     ├── DataAnalytics.jsx
│     ├── SystemHealth.jsx
│     ├── ReportGeneration.jsx
│     └── AuditLogs.jsx
│
├── pages/
│  ├── HomePage.jsx
│  ├── AboutPage.jsx
│  ├── FarmersPortal.jsx
│  ├── BuyersPortal.jsx
│  ├── BenefitsPage.jsx
│  ├── FeaturesPage.jsx
│  ├── PricingPage.jsx
│  ├── KnowledgeHub.jsx
│  ├── ImpactPage.jsx
│  ├── ContactPage.jsx
│  ├── DashboardPage.jsx
│  └── NotFoundPage.jsx
│
├── stores/ (Zustand state management)
│  ├── authStore.js
│  ├── farmerStore.js
│  ├── marketplaceStore.js
│  ├── orderStore.js
│  ├── storageStore.js
│  ├── paymentStore.js
│  ├── notificationStore.js
│  ├── uiStore.js
│  └── analyticsStore.js
│
├── services/ (API client)
│  ├── api.js (Axios base config)
│  ├── authService.js
│  ├── farmerService.js
│  ├── marketplaceService.js
│  ├── storageService.js
│  ├── labService.js
│  ├── doctorService.js
│  ├── paymentService.js
│  ├── insuranceService.js
│  ├── creditService.js
│  ├── weatherService.js
│  ├── analyticsService.js
│  └── supportService.js
│
├── hooks/ (Custom React hooks)
│  ├── useAuth.js
│  ├── useLocation.js
│  ├── useWeather.js
│  ├── usePrices.js
│  ├── useOrders.js
│  ├── usePayments.js
│  ├── useNotifications.js
│  └── useForm.js
│
├── utils/
│  ├── formatters.js (currency, date, numbers)
│  ├── validators.js (form validation)
│  ├── constants.js (static data)
│  ├── localStorage.js (persistence)
│  └── helpers.js (utility functions)
│
├── styles/
│  ├── globals.css (Tailwind)
│  ├── variables.css (CSS variables)
│  └── theme.css (theme colors)
│
└── main.jsx (App entry point)
```

---

## PAGE ROUTING (React Router v6)

```javascript
const routes = [
  // PUBLIC ROUTES
  { path: '/', component: HomePage },
  { path: '/about', component: AboutPage },
  { path: '/benefits', component: BenefitsPage },
  { path: '/features', component: FeaturesPage },
  { path: '/pricing', component: PricingPage },
  { path: '/knowledge', component: KnowledgeHub },
  { path: '/contact', component: ContactPage },
  { path: '/login', component: LoginPage },
  { path: '/register', component: RegisterPage },

  // PROTECTED ROUTES (Farmer)
  {
    path: '/dashboard',
    component: DashboardPage,
    requiredRole: 'farmer'
  },
  { path: '/farmer/*', component: FarmerLayout, requiredRole: 'farmer',
    children: [
      { path: 'marketplace', component: MarketplacePage },
      { path: 'storage', component: StoragePage },
      { path: 'orders', component: OrdersPage },
      { path: 'labs', component: LabsPage },
      { path: 'doctors', component: DoctorsPage },
      { path: 'knowledge', component: KnowledgePage },
      { path: 'finance', component: FinancePage },
      { path: 'payments', component: PaymentsPage },
      { path: 'insurance', component: InsurancePage },
      { path: 'credit', component: CreditPage },
      { path: 'subsidy', component: SubsidyPage },
      { path: 'compliance', component: CompliancePage },
      { path: 'support', component: SupportPage },
      { path: 'profile', component: ProfilePage }
    ]
  },

  // PROTECTED ROUTES (Buyer)
  {
    path: '/buyer/*',
    component: BuyerLayout,
    requiredRole: 'buyer',
    children: [
      { path: 'search', component: SearchPage },
      { path: 'orders', component: BuyerOrdersPage },
      { path: 'suppliers', component: SuppliersPage },
      { path: 'contracts', component: ContractsPage },
      { path: 'logistics', component: BuyerLogisticsPage }
    ]
  },

  // ADMIN ROUTES
  {
    path: '/admin/*',
    component: AdminLayout,
    requiredRole: 'admin',
    children: [
      { path: 'dashboard', component: AdminDashboard },
      { path: 'users', component: UserManagement },
      { path: 'analytics', component: Analytics },
      { path: 'reports', component: Reports }
    ]
  }
];
```

---

## STATE MANAGEMENT (Zustand Stores)

### Farmer Store
```javascript
// stores/farmerStore.js
const useFarmerStore = create((set) => ({
  // FARMER PROFILE
  profile: null,
  setProfile: (profile) => set({ profile }),
  
  // PRODUCTION
  crops: [],
  setCrops: (crops) => set({ crops }),
  productionCapacity: 0,
  setProductionCapacity: (capacity) => set({ productionCapacity: capacity }),
  
  // CERTIFICATIONS
  certifications: [],
  addCertification: (cert) => set((state) => ({
    certifications: [...state.certifications, cert]
  })),
  
  // FINANCIAL DATA
  income: 0,
  expenses: 0,
  updateIncome: (amount) => set({ income: amount }),
  updateExpenses: (amount) => set({ expenses: amount }),
  
  // ACTIVE ORDERS
  activeOrders: [],
  setActiveOrders: (orders) => set({ activeOrders: orders }),
  
  // STORAGE BOOKINGS
  storageBookings: [],
  addStorageBooking: (booking) => set((state) => ({
    storageBookings: [...state.storageBookings, booking]
  })),
  
  // ALERTS & NOTIFICATIONS
  alerts: [],
  addAlert: (alert) => set((state) => ({
    alerts: [...state.alerts, alert]
  })),
  clearAlert: (alertId) => set((state) => ({
    alerts: state.alerts.filter(a => a.id !== alertId)
  }))
}));
```

### Marketplace Store
```javascript
// stores/marketplaceStore.js
const useMarketplaceStore = create((set) => ({
  // PRODUCTS
  listedProducts: [],
  addProduct: (product) => set((state) => ({
    listedProducts: [...state.listedProducts, product]
  })),
  updateProduct: (id, updates) => set((state) => ({
    listedProducts: state.listedProducts.map(p =>
      p.id === id ? { ...p, ...updates } : p
    )
  })),
  
  // PRICING
  priceHistory: [],
  updatePrice: (productId, newPrice) => set((state) => ({
    listedProducts: state.listedProducts.map(p =>
      p.id === productId ? { ...p, price: newPrice } : p
    )
  })),
  
  // BUYERS
  matchedBuyers: [],
  setMatchedBuyers: (buyers) => set({ matchedBuyers: buyers }),
  
  // ORDERS RECEIVED
  incomingOrders: [],
  addIncomingOrder: (order) => set((state) => ({
    incomingOrders: [...state.incomingOrders, order]
  }))
}));
```

### Payment Store
```javascript
// stores/paymentStore.js
const usePaymentStore = create((set) => ({
  // TRANSACTIONS
  transactions: [],
  addTransaction: (tx) => set((state) => ({
    transactions: [...state.transactions, tx]
  })),
  
  // BALANCE
  walletBalance: 0,
  setWalletBalance: (balance) => set({ walletBalance: balance }),
  
  // PENDING SETTLEMENTS
  pendingSettlements: [],
  setPendingSettlements: (settlements) => set({ pendingSettlements: settlements }),
  
  // INVOICES
  invoices: [],
  addInvoice: (invoice) => set((state) => ({
    invoices: [...state.invoices, invoice]
  }))
}));
```

---

## COMPONENT EXAMPLES

### MarketplaceProductCard.jsx
```javascript
import React from 'react';
import { useMarketplaceStore } from '@/stores/marketplaceStore';
import { useFarmerStore } from '@/stores/farmerStore';

export function ProductCard({ product }) {
  const profile = useFarmerStore(state => state.profile);
  const matchedBuyers = useMarketplaceStore(state => state.matchedBuyers);
  
  const buyerCount = matchedBuyers.length;
  const margin = product.price > 0 ? 
    ((product.price - 80) / 80 * 100) : 0;
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3>{product.name}</h3>
      <p>Quality: {product.quality}</p>
      <p>₹{product.price}/kg</p>
      <p>Improvement: +{margin.toFixed(0)}%</p>
      <p>Interested buyers: {buyerCount}</p>
      <button onClick={() => handleEditProduct(product.id)}>
        Edit
      </button>
    </div>
  );
}
```

### ColdStorageBooking.jsx
```javascript
import React, { useState } from 'react';
import { useStorageStore } from '@/stores/storageStore';
import { useFarmerStore } from '@/stores/farmerStore';
import storageService from '@/services/storageService';

export function ColdStorageBooking() {
  const [duration, setDuration] = useState(7);
  const [temperature, setTemperature] = useState(8);
  
  const addStorageBooking = useFarmerStore(state => state.addStorageBooking);
  const profile = useFarmerStore(state => state.profile);
  
  const handleBook = async () => {
    const cost = calculateCost(duration, temperature);
    
    const booking = {
      farmerId: profile.id,
      duration,
      temperature,
      cost,
      createdAt: new Date()
    };
    
    await storageService.bookStorage(booking);
    addStorageBooking(booking);
  };
  
  return (
    <div className="bg-white rounded-lg p-6">
      <h2>Book Cold Storage</h2>
      <input
        type="number"
        value={duration}
        onChange={(e) => setDuration(parseInt(e.target.value))}
        placeholder="Duration (days)"
      />
      <select value={temperature} onChange={(e) => setTemperature(parseInt(e.target.value))}>
        <option value={8}>2-10°C (Produce)</option>
        <option value={0}>-2 to 2°C (Fish)</option>
        <option value={-18}>-18°C (Frozen)</option>
      </select>
      <p>Estimated cost: ₹{calculateCost(duration, temperature)}</p>
      <button onClick={handleBook}>Book Now</button>
    </div>
  );
}

function calculateCost(duration, temp) {
  const baseRate = 5; // ₹/kg/day
  return duration * baseRate;
}
```

### FarmerDashboard.jsx
```javascript
import React, { useEffect } from 'react';
import { useFarmerStore } from '@/stores/farmerStore';
import { usePaymentStore } from '@/stores/paymentStore';
import { useMarketplaceStore } from '@/stores/marketplaceStore';

export function FarmerDashboard() {
  const profile = useFarmerStore(state => state.profile);
  const income = useFarmerStore(state => state.income);
  const activeOrders = useMarketplaceStore(state => state.incomingOrders);
  const walletBalance = usePaymentStore(state => state.walletBalance);
  const alerts = useFarmerStore(state => state.alerts);
  
  return (
    <div className="grid grid-cols-4 gap-4 p-6">
      {/* INCOME CARD */}
      <div className="bg-green-50 p-4 rounded-lg">
        <h3>This Season Income</h3>
        <p className="text-2xl font-bold">₹{income}</p>
        <p>vs Baseline: +87%</p>
      </div>
      
      {/* ACTIVE ORDERS */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3>Active Orders</h3>
        <p className="text-2xl font-bold">{activeOrders.length}</p>
        <p>In progress</p>
      </div>
      
      {/* WALLET */}
      <div className="bg-purple-50 p-4 rounded-lg">
        <h3>Wallet Balance</h3>
        <p className="text-2xl font-bold">₹{walletBalance}</p>
        <p>Available</p>
      </div>
      
      {/* ALERTS */}
      <div className="bg-yellow-50 p-4 rounded-lg">
        <h3>Alerts</h3>
        <p className="text-2xl font-bold">{alerts.length}</p>
        <p>New notifications</p>
      </div>
      
      {/* ORDERS DETAIL */}
      <div className="col-span-4 bg-white p-4 rounded-lg">
        <h3>Recent Orders</h3>
        <table className="w-full">
          <thead>
            <tr>
              <th>Product</th>
              <th>Buyer</th>
              <th>Volume</th>
              <th>Status</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            {activeOrders.slice(0, 5).map(order => (
              <tr key={order.id}>
                <td>{order.product}</td>
                <td>{order.buyer}</td>
                <td>{order.volume}kg</td>
                <td>{order.status}</td>
                <td>₹{order.totalValue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

---

## API SERVICE LAYER

### marketplaceService.js
```javascript
import api from './api';

export const marketplaceService = {
  // PRODUCTS
  listProduct: (productData) =>
    api.post('/marketplace/products', productData),
  
  getProduct: (productId) =>
    api.get(`/marketplace/products/${productId}`),
  
  updateProduct: (productId, updates) =>
    api.put(`/marketplace/products/${productId}`, updates),
  
  // PRICES
  getPriceIntelligence: (commodity) =>
    api.get(`/marketplace/prices`, { params: { commodity } }),
  
  updatePrice: (productId, price) =>
    api.put(`/marketplace/products/${productId}/price`, { price }),
  
  // BUYERS
  findBuyers: (productId) =>
    api.get(`/marketplace/buyers`, { params: { productId } }),
  
  // ORDERS
  createOrder: (orderData) =>
    api.post('/marketplace/orders', orderData),
  
  getOrders: (farmerId) =>
    api.get(`/marketplace/orders`, { params: { farmerId } })
};
```

### storageService.js
```javascript
import api from './api';

export const storageService = {
  getNodes: () =>
    api.get('/storage/nodes'),
  
  bookStorage: (bookingData) =>
    api.post('/storage/booking', bookingData),
  
  getTemperature: (nodeId) =>
    api.get(`/storage/${nodeId}/temperature`),
  
  calculateCost: (duration, temp) =>
    api.post('/storage/cost-calc', { duration, temp }),
  
  trackDispatch: (bookingId) =>
    api.get(`/storage/dispatch/${bookingId}`)
};
```

---

## RESPONSIVE DESIGN (TailwindCSS)

```css
/* Mobile First Approach */

/* Mobile: < 640px */
.dashboard {
  @apply grid grid-cols-1 gap-4 p-4;
}

/* Tablet: >= 640px */
@media (min-width: 640px) {
  .dashboard {
    @apply grid grid-cols-2 gap-4 p-6;
  }
}

/* Desktop: >= 1024px */
@media (min-width: 1024px) {
  .dashboard {
    @apply grid grid-cols-4 gap-6 p-8;
  }
}

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {
  .card {
    @apply bg-slate-800 text-white;
  }
}
```

---

## REAL-TIME FEATURES (Socket.IO)

```javascript
import io from 'socket.io-client';

const socket = io(process.env.REACT_APP_API_URL);

// LISTEN FOR ORDER UPDATES
socket.on('order:updated', (order) => {
  useMarketplaceStore.setState(state => ({
    incomingOrders: state.incomingOrders.map(o =>
      o.id === order.id ? order : o
    )
  }));
});

// LISTEN FOR PAYMENT UPDATES
socket.on('payment:settled', (payment) => {
  usePaymentStore.setState(state => ({
    transactions: [...state.transactions, payment],
    walletBalance: state.walletBalance + payment.amount
  }));
});

// LISTEN FOR WEATHER ALERTS
socket.on('weather:alert', (alert) => {
  useFarmerStore.setState(state => ({
    alerts: [...state.alerts, alert]
  }));
});

// LISTEN FOR TEMPERATURE DEVIATIONS
socket.on('storage:temperature-deviation', (deviation) => {
  useFarmerStore.setState(state => ({
    alerts: [...state.alerts, {
      type: 'CRITICAL',
      message: `Temperature deviation in storage: ${deviation.temp}°C`
    }]
  }));
});
```

---

## AUTHENTICATION & AUTHORIZATION

```javascript
// hooks/useAuth.js
export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      api.get('/api/auth/me').then(res => {
        setUser(res.data);
      });
    }
    setLoading(false);
  }, []);
  
  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
  };
  
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };
  
  return { user, loading, login, logout };
}
```

---

## PERFORMANCE OPTIMIZATION

```javascript
// Code Splitting & Lazy Loading
const MarketplacePage = React.lazy(() => import('@/pages/MarketplacePage'));
const StoragePage = React.lazy(() => import('@/pages/StoragePage'));
const LabsPage = React.lazy(() => import('@/pages/LabsPage'));

// API Caching
const apiCache = new Map();
const getCached = (key, fetcher, ttl = 5 * 60 * 1000) => {
  const cached = apiCache.get(key);
  if (cached && Date.now() - cached.time < ttl) {
    return Promise.resolve(cached.data);
  }
  
  return fetcher().then(data => {
    apiCache.set(key, { data, time: Date.now() });
    return data;
  });
};

// Image Optimization
export function OptimizedImage({ src, alt }) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      srcSet={`${src}?w=300 300w, ${src}?w=600 600w`}
      sizes="(max-width: 600px) 100vw, 600px"
    />
  );
}
```

---

## TESTING STRATEGY

```javascript
// __tests__/components/ProductCard.test.js
import { render, screen } from '@testing-library/react';
import { ProductCard } from '@/components/marketplace/ProductCard';

test('renders product card with price', () => {
  const product = {
    id: '1',
    name: 'Bhut Jolokia',
    price: 150,
    quality: 'Grade 1'
  };
  
  render(<ProductCard product={product} />);
  
  expect(screen.getByText('Bhut Jolokia')).toBeInTheDocument();
  expect(screen.getByText('₹150/kg')).toBeInTheDocument();
});
```

---

**FRONTEND IS FULLY DEPENDENT ON BACKEND ARCHITECTURE**

Each component maps to 1+ backend layers. Every API call connects to the corresponding service endpoint. State management mirrors the backend schema.

**The Frontend is NOT the User Interface — it's the OPERATIONAL CONTROL PANEL for all 24 backend layers.**
