# PAGE-015: /insurance/policies

**Phase:** 5.1 (Critical Pages)  
**Component:** PolicyListPage  
**Priority:** P0 - Critical  
**Status:** Specification Complete  

## Page Specification

### Route
```
/insurance/policies
```

### Purpose
Insurance policy listing page for users to view their policies, coverage details, and manage insurance options.

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
import PolicyCard from '../components/PolicyCard';
import FilterPanel from '../components/FilterPanel';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';
import LoadingSpinner from '../components/LoadingSpinner';
```

### State Management
```jsx
const [policies, setPolicies] = useState([]);
const [loading, setLoading] = useState(true);
const [filters, setFilters] = useState({
  status: [],
  policyType: [],
  coverageRange: null,
  expiryDate: null
});
const [pagination, setPagination] = useState({
  page: 1,
  limit: 20,
  total: 0
});
```

### Page Sections

#### 1. Page Header
- Page title ("My Policies")
- Policy statistics summary
- Apply for new policy button
- Breadcrumb navigation

#### 2. Filter Panel
- Status filter (active, expired, pending, cancelled)
- Policy type filter (crop, transit, storage, liability)
- Coverage range filter
- Expiry date filter
- Quick filters (active, expiring soon, expired)

#### 3. Policy List
- Policy cards with:
  - Policy number
- Policy type
- Coverage amount
- Premium amount
- Policy status badge
- Policy period
- Action buttons (view, claim, renew)
- Download certificate button

#### 4. Policy Statistics
- Total policies
- Active policies
- Total coverage amount
- Total premium paid
- Expiring soon count

#### 5. Empty State
- No policies found message
- Apply for policy button
- Clear filters button

### API Integration
```jsx
useEffect(() => {
  const loadPolicies = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/v1/insurance/policies', {
        params: {
          ...filters,
          page: pagination.page,
          limit: policy.limit
        }
      });
      setPolicies(response.data.policies);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.total
      }));
    } catch (err) {
      console.error('Failed to load policies:', err);
    } finally {
      setLoading(false);
    }
  };
  loadPolicies();
}, [filters, pagination.page]);
```

### Layout Requirements
- **Header**: Page title, statistics, filters toggle
- **Main Content**: Filter sidebar + policy list
- **Sidebar**: Collapsible filter panel
- **Footer**: Pagination, quick links
- **Responsive**: Hidden filters on mobile (drawer), stacked layout

### Styling
- Card-based policy display
- Status badge color coding
- Clean list layout
- Loading skeletons during data fetch
- Responsive grid/list breakpoints
- Hover effects on policy cards

### Accessibility
- Semantic policy list structure
- ARIA labels for filters
- Keyboard navigation for policy cards
- Screen reader compatibility
- Status badge ARIA labels
- Focus management for mobile filters

### Error Handling
- No policies found state
- API error display
- Network error handling
- Filter error handling

### Success Behavior
- Real-time filter updates
- Sort state preservation
- URL parameter updates
- Smooth transitions between states

### Special Features
- **Quick Renew**: One-click policy renewal
- **Quick Claim**: Fast claim filing
- **Certificate Download**: PDF certificate generation
- **Coverage Comparison**: Compare coverage levels
- **Premium Calculator**: Estimate premium for new coverage

## Implementation Checklist
- [ ] Create page component file in `frontend/src/pages/PolicyListPage.jsx`
- [ ] Design layout with filter panel and list
- [ ] Import required components
- [ ] Wire API calls via api.js service
- [ ] Add state management for filters and pagination
- [ ] Add error handling and loading states
- [ ] Add routing in `frontend/src/config/routes.js`
- [ ] Test responsive design (mobile, tablet, desktop)
- [ ] Test accessibility (WCAG 2.1 AA)
- [ ] Add unit test in `frontend/src/pages/__tests__/PolicyListPage.test.js`

---

*Generated for Phase 5.1 Critical Pages Implementation*