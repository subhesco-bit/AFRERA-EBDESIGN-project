# PAGE-007: /orders/:id

**Phase:** 5.1 (Critical Pages)  
**Component:** OrderDetailPage  
**Priority:** P0 - Critical  
**Status:** Specification Complete  

## Page Specification

### Route
```
/orders/:id
```

### Purpose
Detailed order information page showing order items, status, timeline, and action buttons for order management.

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
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import Button from '../components/Button';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';
import Timeline from '../components/Timeline';
import OrderItems from '../components/OrderItems';
import LoadingSpinner from '../components/LoadingSpinner';
```

### State Management
```jsx
const [order, setOrder] = useState(null);
const [loading, setLoading] = useState(true);
const [cancelling, setCancelling] = useState(false);
const [activeTab, setActiveTab] = useState('details');
```

### Page Sections

#### 1. Order Header
- Order number
- Order date
- Order status badge
- Order total
- Action buttons (cancel, reorder, track)

#### 2. Order Details Tab
- Order items list with images
- Quantity and price per item
- Subtotal, tax, shipping, total
- Billing address
- Shipping address
- Payment method
- Payment status

#### 3. Order Timeline Tab
- Order status timeline
- Date and time stamps
- Status descriptions
- Expected delivery date
- Current location (if shipped)

#### 4. Order Documents Tab
- Invoice download
- Receipt download
- Shipping label download
- Tax documents

#### 5. Order Actions
- Cancel order button (if cancellable)
- Request refund button
- Contact support button
- Reorder button (if completed)
- Track shipment button

#### 6. Order Summary Sidebar
- Order summary card
- Quick actions
- Related products
- Seller information

### API Integration
```jsx
useEffect(() => {
  const loadOrder = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/v1/orders/${id}`);
      setOrder(response.data);
    } catch (err) {
      console.error('Failed to load order:', err);
    } finally {
      setLoading(false);
    }
  };
  loadOrder();
}, [id]);

const handleCancelOrder = async () => {
  setCancelling(true);
  try {
    await api.post(`/api/v1/orders/${id}/cancel`, {
      reason: 'Customer requested cancellation'
    });
    // Reload order data
    loadOrder();
  } catch (err) {
    console.error('Failed to cancel order:', err);
  } finally {
    setCancelling(false);
  }
};
```

### Layout Requirements
- **Header**: Breadcrumb navigation, back button
- **Main Content**: Order details with tabs
- **Sidebar**: Order summary, quick actions
- **Footer**: Related orders, support links
- **Responsive**: Stacked layout on mobile, side-by-side on desktop

### Styling
- Tab-based content organization
- Timeline visualization
- Status badge color coding
- Clean order items display
- Loading skeletons during data fetch
- Action button prominence

### Accessibility
- Semantic order information structure
- ARIA labels for tabs
- Keyboard navigation for timeline
- Screen reader compatibility
- Status badge ARIA labels
- Focus management for modals

### Error Handling
- Order not found state
- API error display
- Network error handling
- Cancellation error handling

### Success Behavior
- Real-time status updates
- Cancellation confirmation
- Tab switching animations
- Action feedback messages

### Special Features
- **Real-time Updates**: WebSocket integration for status changes
- **Document Generation**: PDF invoice generation
- **Refund Request**: Integrated refund flow
- **Live Tracking**: Real-time shipment tracking
- **Chat Support**: Live chat with seller

## Implementation Checklist
- [ ] Create page component file in `frontend/src/pages/OrderDetailPage.jsx`
- [ ] Design layout with tabs and sidebar
- [ ] Import required components
- [ ] Wire API calls via api.js service
- [ ] Add state management for tabs and actions
- [ ] Add error handling and loading states
- [ ] Add routing in `frontend/src/config/routes.js`
- [ ] Test responsive design (mobile, tablet, desktop)
- [ ] Test accessibility (WCAG 2.1 AA)
- [ ] Add unit test in `frontend/src/pages/__tests__/OrderDetailPage.test.js`

---

*Generated for Phase 5.1 Critical Pages Implementation*