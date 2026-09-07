# PAGE-006: /orders

**Phase:** 5.1 (Critical Pages)  
**Component:** OrderListPage  
**Priority:** P0 - Critical  
**Status:** Specification Complete  

## Page Specification

### Route
```
/orders
```

### Purpose
Order listing page for users to view their order history, track orders, and manage order actions.

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
import OrderCard from '../components/OrderCard';
import FilterPanel from '../components/FilterPanel';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';
import LoadingSpinner from '../components/LoadingSpinner';
```

### State Management
```jsx
const [orders, setOrders] = useState([]);
const [loading, setLoading] = useState(true);
const [filters, setFilters] = useState({
  status: [],
  dateRange: null,
  amountRange: null
});
const [pagination, setPagination] = useState({
  page: 1,
  limit: 20,
  total: 0
});
```

### Page Sections

#### 1. Page Header
- Page title ("My Orders")
- Order statistics summary
- Create new order button
- Breadcrumb navigation

#### 2. Filter Panel
- Status filter (pending, confirmed, shipped, delivered, cancelled)
- Date range picker
- Amount range slider
- Order type filter (regular, bulk)
- Quick filters (active, completed, cancelled)

#### 3. Order List
- Order cards with:
  - Order number and date
  - Product images and names
  - Order status badge
  - Total amount
  - Action buttons (view, track, cancel)
  - Reorder button (for completed orders)

#### 4. Order Statistics
- Total orders
- Total spent
- Active orders count
- Completed orders count
- Cancelled orders count

#### 5. Empty State
- No orders found message
- Start shopping button
- Clear filters button

### API Integration
```jsx
useEffect(() => {
  const loadOrders = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/v1/orders', {
        params: {
          ...filters,
          page: pagination.page,
          limit: pagination.limit
        }
      });
      setOrders(response.data.orders);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.total
      }));
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };
  loadOrders();
}, [filters, pagination.page]);
```

### Layout Requirements
- **Header**: Page title, statistics, filters toggle
- **Main Content**: Filter sidebar + order list
- **Sidebar**: Collapsible filter panel
- **Footer**: Pagination, quick links
- **Responsive**: Hidden filters on mobile (drawer), stacked layout

### Styling
- Card-based order display
- Status badge color coding
- Clean list layout
- Loading skeletons during data fetch
- Responsive grid/list breakpoints
- Hover effects on order cards

### Accessibility
- Semantic order list structure
- ARIA labels for filters
- Keyboard navigation for order cards
- Screen reader compatibility
- Status badge ARIA labels
- Focus management for mobile filters

### Error Handling
- No orders found state
- API error display
- Network error handling
- Filter error handling

### Success Behavior
- Real-time filter updates
- Sort state preservation
- URL parameter updates
- Smooth transitions between states

### Special Features
- **Quick Actions**: Bulk actions on multiple orders
- **Export Orders**: Download order history
- **Print Invoices**: Generate PDF invoices
- **Reorder**: Quick reorder from history
- **Order Search**: Search by order number

## Implementation Checklist
- [ ] Create page component file in `frontend/src/pages/OrderListPage.jsx`
- [ ] Design layout with filter panel and list
- [ ] Import required components
- [ ] Wire API calls via api.js service
- [ ] Add state management for filters and pagination
- [ ] Add error handling and loading states
- [ ] Add routing in `frontend/src/config/routes.js`
- [ ] Test responsive design (mobile, tablet, desktop)
- [ ] Test accessibility (WCAG 2.1 AA)
- [ ] Add unit test in `frontend/src/pages/__tests__/OrderListPage.test.js`

---

*Generated for Phase 5.1 Critical Pages Implementation*