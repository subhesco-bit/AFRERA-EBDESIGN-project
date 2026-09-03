# PAGE-013: /shipments

**Phase:** 5.1 (Critical Pages)  
**Component:** ShipmentListPage  
**Priority:** P0 - Critical  
**Status:** Specification Complete  

## Page Specification

### Route
```
/shipments
```

### Purpose
Shipment listing page for logistics management, showing all shipments with tracking status and filtering capabilities.

### Dependencies
- `frontend/src/services/api.js` - API client
- `frontend/src/components/` - UI components
- Frontend routing (React Router v6)
- State management (Zustand)

## Component Structure

### Imports
```jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import ShipmentCard from '../components/ShipmentCard';
import FilterPanel from '../components/FilterPanel';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';
import LoadingSpinner from '../components/LoadingSpinner';
```

### State Management
```jsx
const [shipments, setShipments] = useState([]);
const [loading, setLoading] = useState(true);
const [filters, setFilters] = useState({
  status: [],
  dateRange: null,
  origin: null,
  destination: null,
  carrier: null
});
const [pagination, setPagination] = useState({
  page: 1,
  limit: 20,
  total: 0
});
```

### Page Sections

#### 1. Page Header
- Page title ("Shipments")
- Shipment statistics summary
- Create new shipment button
- Breadcrumb navigation

#### 2. Filter Panel
- Status filter (pending, picked_up, in_transit, delivered, cancelled)
- Date range picker
- Origin location filter
- Destination location filter
- Carrier filter
- Shipment type filter (standard, express, specialized)

#### 3. Shipment List
- Shipment cards with:
  - Shipment number
  - Order reference
  - Origin and destination
  - Status badge
  - Carrier information
  - Track button
  - View details button

#### 4. Shipment Statistics
- Total shipments
- In-transit shipments
- Delivered shipments
- Delayed shipments
- Average delivery time

#### 5. Empty State
- No shipments found message
- Create shipment button
- Clear filters button

### API Integration
```jsx
useEffect(() => {
  const loadShipments = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/v1/shipments', {
        params: {
          ...filters,
          page: pagination.page,
          limit: pagination.limit
        }
      });
      setShipments(response.data.shipments);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.total
      }));
    } catch (err) {
      console.error('Failed to load shipments:', err);
    } finally {
      setLoading(false);
    }
  };
  loadShipments();
}, [filters, pagination.page]);
```

### Layout Requirements
- **Header**: Page title, statistics, filters toggle
- **Main Content**: Filter sidebar + shipment list
- **Sidebar**: Collapsible filter panel
- **Footer**: Pagination, quick links
- **Responsive**: Hidden filters on mobile (drawer), stacked layout

### Styling
- Card-based shipment display
- Status badge color coding
- Clean list layout
- Loading skeletons during data fetch
- Responsive grid/list breakpoints
- Hover effects on shipment cards

### Accessibility
- Semantic shipment list structure
- ARIA labels for filters
- Keyboard navigation for shipment cards
- Screen reader compatibility
- Status badge ARIA labels
- Focus management for mobile filters

### Error Handling
- No shipments found state
- API error display
- Network error handling
- Filter error handling

### Success Behavior
- Real-time filter updates
- Sort state preservation
- URL parameter updates
- Smooth transitions between states

### Special Features
- **Quick Track**: One-click tracking for shipments
- **Bulk Actions**: Bulk status updates
- **Export Shipments**: Download shipment history
- **Map View**: Geographic shipment display
- **Delay Alerts**: Delayed shipment notifications

## Implementation Checklist
- [ ] Create page component file in `frontend/src/pages/ShipmentListPage.jsx`
- [ ] Design layout with filter panel and list
- [ ] Import required components
- [ ] Wire API calls via api.js service
- [ ] Add state management for filters and pagination
- [ ] Add error handling and loading states
- [ ] Add routing in `frontend/src/config/routes.js`
- [ ] Test responsive design (mobile, tablet, desktop)
- [ ] Test accessibility (WCAG 2.1 AA)
- [ ] Add unit test in `frontend/src/pages/__tests__/ShipmentListPage.test.js`

---

*Generated for Phase 5.1 Critical Pages Implementation*