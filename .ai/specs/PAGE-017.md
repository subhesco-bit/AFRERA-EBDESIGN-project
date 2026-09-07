# PAGE-017: /insurance/claims

**Phase:** 5.1 (Critical Pages)  
**Component:** ClaimsPage  
**Priority:** P0 - Critical  
**Status:** Specification Complete  

## Page Specification

### Route
```
/insurance/claims
```

### Purpose
Insurance claims listing page for users to view their claims, file new claims, and track claim status.

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
import ClaimCard from '../components/ClaimCard';
import FilterPanel from '../components/FilterPanel';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';
import LoadingSpinner from '../components/LoadingSpinner';
```

### State Management
```jsx
const [claims, setClaims] = useState([]);
const [loading, setLoading] = useState(true);
const [filters, setFilters] = useState({
  status: [],
  claimType: [],
  dateRange: null,
  policyId: null
});
const [pagination, setPagination] = useState({
  page: 1,
  limit: 20,
  total: 0
});
```

### Page Sections

#### 1. Page Header
- Page title ("My Claims")
- Claim statistics summary
- File new claim button
- Breadcrumb navigation

#### 2. Filter Panel
- Status filter (submitted, under_review, approved, rejected, paid)
- Claim type filter (crop_damage, natural_disaster, theft, accident, other)
- Date range picker
- Policy filter
- Quick filters (active, pending, completed)

#### 3. Claim List
- Claim cards with:
  - Claim number
- Claim type badge
- Policy reference
- Claim amount
- Claim status badge
- Submitted date
- Estimated loss
- Action buttons (view, add evidence, withdraw)

#### 4. Claim Statistics
- Total claims
- Active claims
- Approved claims
- Rejected claims
- Total claimed amount
- Total paid amount

#### 5. Empty State
- No claims found message
- File new claim button
- Clear filters button

### API Integration
```jsx
useEffect(() => {
  const loadClaims = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/v1/insurance/claims', {
        params: {
          ...filters,
          page: pagination.page,
          limit: pagination.limit
        }
      });
      setClaims(response.data.claims);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.total
      }));
    } catch (err) {
      console.error('Failed to load claims:', err);
    } finally {
      setLoading(false);
    }
  };
  loadClaims();
}, [filters, pagination.page]);
```

### Layout Requirements
- **Header**: Page title, statistics, filters toggle
- **Main Content**: Filter sidebar + claim list
- **Sidebar**: Collapsible filter panel
- **Footer**: Pagination, quick links
- **Responsive**: Hidden filters on mobile (drawer), stacked layout

### Styling
- Card-based claim display
- Status badge color coding
- Clean list layout
- Loading skeletons during data fetch
- Responsive grid/list breakpoints
- Hover effects on claim cards

### Accessibility
- Semantic claim list structure
- ARIA labels for filters
- Keyboard navigation for claim cards
- Screen reader compatibility
- Status badge ARIA labels
- Focus management for mobile filters

### Error Handling
- No claims found state
- API error display
- Network error handling
- Filter error handling

### Success Behavior
- Real-time filter updates
- Sort state preservation
- URL parameter updates
- Smooth transitions between states

### Special Features
- **Quick Claim**: Fast claim filing with pre-filled data
- **Evidence Upload**: Additional evidence submission
- **Claim Status Tracking**: Real-time status updates
- **Export Claims**: Download claim history
- **Claim Comparison**: Compare with similar claims

## Implementation Checklist
- [ ] Create page component file in `frontend/src/pages/ClaimsPage.jsx`
- [ ] Design layout with filter panel and list
- [ ] Import required components
- [ ] Wire API calls via api.js service
- [ ] Add state management for filters and pagination
- [ ] Add error handling and loading states
- [ ] Add routing in `frontend/src/config/routes.js`
- [ ] Test responsive design (mobile, tablet, desktop)
- [ ] Test accessibility (WCAG 2.1 AA)
- [ ] Add unit test in `frontend/src/pages/__tests__/ClaimsPage.test.js`

---

*Generated for Phase 5.1 Critical Pages Implementation*