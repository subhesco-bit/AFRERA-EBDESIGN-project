# PAGE-003: /products/:id

**Phase:** 5.1 (Critical Pages)  
**Component:** ProductDetailPage  
**Priority:** P0 - Critical  
**Status:** Specification Complete  

## Page Specification

### Route
```
/products/:id
```

### Purpose
Detailed product information page displaying product details, specifications, pricing, and action buttons for buyers and sellers.

### Dependencies
- `frontend/src/services/api.js` - API client
- `frontend/src/components/` - UI components
- Frontend routing (React Router v6)
- State management (Zustand)

## Component Structure

### Imports
```jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import Button from '../components/Button';
import Card from '../components/Card';
import Badge from '../components/Badge';
import ImageGallery from '../components/ImageGallery';
import ReviewList from '../components/ReviewList';
import LoadingSpinner from '../components/LoadingSpinner';
```

### State Management
```jsx
const [product, setProduct] = useState(null);
const [loading, setLoading] = useState(true);
const [quantity, setQuantity] = useState(1);
const [activeTab, setActiveTab] = useState('details');
const { addToCart } = useCartStore();
const { user } = useAuthStore();
```

### Page Sections

#### 1. Product Header
- Product images gallery (main image + thumbnails)
- Product name
- SKU/Product ID
- Badges (organic, GI tag, quality grade)
- Average rating with star display
- Review count
- Seller information with link

#### 2. Product Details Tab
- Product description
- Specifications table
- Variants/Options
- Certification badges
- Origin information
- Harvest date
- Nutritional information (if applicable)

#### 3. Pricing & Availability
- Base price per unit
- Bulk pricing tiers
- Available quantity
- Unit information
- Delivery options
- Location indicator

#### 4. Reviews Tab
- Review summary with rating distribution
- Review list with filtering
- Review submission form
- Rating breakdown

#### 5. Seller Information
- Seller profile card
- Seller rating
- Seller verification status
- Response time
- Contact seller button
- View seller's other products

#### 6. Action Buttons
- Add to cart button
- Buy now button
- Add to wishlist button
- Share product button
- Report product button

### API Integration
```jsx
useEffect(() => {
  const loadProduct = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/v1/products/${id}`);
      setProduct(response.data);
    } catch (err) {
      console.error('Failed to load product:', err);
    } finally {
      setLoading(false);
    }
  };
  loadProduct();
}, [id]);

const handleAddToCart = async () => {
  try {
    await addToCart(product.id, quantity);
    // Show success notification
  } catch (err) {
    console.error('Failed to add to cart:', err);
  }
};
```

### Layout Requirements
- **Header**: Breadcrumb navigation, back button
- **Main Content**: Two-column layout (images left, details right)
- **Sidebar**: Seller information, related products
- **Footer**: Related products, categories
- **Responsive**: Stacked layout on mobile, side-by-side on desktop

### Styling
- Clean product showcase design
- High-quality image gallery
- Tab-based content organization
- Price highlighting
- Action button prominence
- Loading skeletons during data fetch

### Accessibility
- Semantic product information structure
- ARIA labels for interactive elements
- Keyboard navigation for image gallery
- Screen reader compatibility
- Alt text for all images
- Focus management for modals

### Error Handling
- Product not found state
- Network error handling
- API error display
- Image loading error handling
- Out of stock handling

### Success Behavior
- Add to cart confirmation
- Wishlist toggle feedback
- Share modal display
- Review submission confirmation

### Special Features
- **Image Gallery**: Zoom functionality, multiple angles
- **Bulk Pricing**: Tiered pricing display
- **Wishlist**: Add/remove from favorites
- **Similar Products**: Related product recommendations
- **Live Stock**: Real-time inventory updates

## Implementation Checklist
- [ ] Create page component file in `frontend/src/pages/ProductDetailPage.jsx`
- [ ] Design layout with image gallery and details
- [ ] Import required components
- [ ] Wire API calls via api.js service
- [ ] Add form handling and state management
- [ ] Add error handling and loading states
- [ ] Add routing in `frontend/src/config/routes.js`
- [ ] Test responsive design (mobile, tablet, desktop)
- [ ] Test accessibility (WCAG 2.1 AA)
- [ ] Add unit test in `frontend/src/pages/__tests__/ProductDetailPage.test.js`

---

*Generated for Phase 5.1 Critical Pages Implementation*