# PAGE-005: /products/category/:cat

**Phase:** 5.1 (Critical Pages)  
**Component:** ProductCategoryPage  
**Priority:** P0 - Critical  
**Status:** Specification Complete  

## Page Specification

### Route
```
/products/category/:cat
```

### Purpose
Category-specific product listing page with filtering, sorting, and grid display of products within a specific category.

### Dependencies
- `frontend/src/services/api.js` - API client
- `frontend/src/components/` - UI components
- Frontend routing (React Router v6)
- State management (Zustand)

## Component Structure

### Imports
```jsx
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { api } from '../services/api';
import ProductCard from '../components/ProductCard';
import FilterPanel from '../components/FilterPanel';
import SortDropdown from '../components/SortDropdown';
import Pagination from '../components/Pagination';
import LoadingSpinner from '../components/LoadingSpinner';
```

### State Management
```jsx
const [products, setProducts] = useState([]);
const [loading, setLoading] = useState(true);
const [filters, setFilters] = useState({
  priceRange: [0, 10000],
  qualityGrade: [],
  certifications: [],
  location: null
});
const [sortBy, setSortBy] = useState('relevance');
const [pagination, setPagination] = useState({
  page: 1,
  limit: 24,
  total: 0
});
```

### Page Sections

#### 1. Category Header
- Category name and description
- Product count
- Breadcrumb navigation
- Category image/banner

#### 2. Filter Panel
- Price range slider
- Quality grade checkboxes
- Certification checkboxes
- Location filter
- State/Region filter
- Organic only toggle
- In stock only toggle

#### 3. Sort Options
- Relevance (default)
- Price (low to high)
- Price (high to low)
- Newest
- Rating
- Best selling

#### 4. Product Grid
- Responsive grid layout (2-4 columns)
- Product cards with:
  - Product image
  - Product name
  - Price
  - Rating
  - Seller info
  - Add to cart button
  - Wishlist button

#### 5. Pagination
- Page numbers
- Previous/Next buttons
- Results per page selector

#### 6. Empty State
- No products found message
- Clear filters button
- Browse other categories link

### API Integration
```jsx
useEffect(() => {
  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/v1/products', {
        params: {
          category_id: cat,
          ...filters,
          sort_by: sortBy,
          page: pagination.page,
          limit: pagination.limit
        }
      });
      setProducts(response.data.products);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.total
      }));
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };
  loadProducts();
}, [cat, filters, sortBy, pagination.page]);
```

### Layout Requirements
- **Header**: Category banner, title, filters toggle
- **Main Content**: Filter sidebar + product grid
- **Sidebar**: Collapsible filter panel
- **Footer**: Pagination, category links
- **Responsive**: Hidden filters on mobile (drawer), stacked layout

### Styling
- Clean grid layout
- Card-based product display
- Filter panel with clear sections
- Loading skeletons during data fetch
- Responsive grid breakpoints
- Hover effects on product cards

### Accessibility
- Semantic product grid structure
- ARIA labels for filters
- Keyboard navigation for product cards
- Screen reader compatibility
- Focus management for mobile filters
- Alt text for product images

### Error Handling
- No products found state
- API error display
- Network error handling
- Filter error handling

### Success Behavior
- Real-time filter updates
- Sort state preservation
- URL parameter updates
- Smooth transitions between states

### Special Features
- **Filter Persistence**: Save filter preferences
- **Quick Filters**: Predefined filter combinations
- **Compare Products**: Select and compare feature
- **Wishlist View**: Filter by wishlist items
- **Map View**: Geographic product display

## Implementation Checklist
- [ ] Create page component file in `frontend/src/pages/ProductCategoryPage.jsx`
- [ ] Design layout with filter panel and grid
- [ ] Import required components
- [ ] Wire API calls via api.js service
- [ ] Add state management for filters and sorting
- [ ] Add error handling and loading states
- [ ] Add routing in `frontend/src/config/routes.js`
- [ ] Test responsive design (mobile, tablet, desktop)
- [ ] Test accessibility (WCAG 2.1 AA)
- [ ] Add unit test in `frontend/src/pages/__tests__/ProductCategoryPage.test.js`

---

*Generated for Phase 5.1 Critical Pages Implementation*