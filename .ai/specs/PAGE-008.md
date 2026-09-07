# PAGE-008: /orders/:id/track

**Phase:** 5.1 (Critical Pages)  
**Component:** OrderTrackingPage  
**Priority:** P0 - Critical  
**Status:** Specification Complete  

## Page Specification

### Route
```
/orders/:id/track
```

### Purpose
Real-time order tracking page showing shipment location, delivery progress, and timeline for in-transit orders.

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
import { api } from '../services/api';
import MapView from '../components/MapView';
import Timeline from '../components/Timeline';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
```

### State Management
```jsx
const [trackingData, setTrackingData] = useState(null);
const [loading, setLoading] = useState(true);
const [refreshing, setRefreshing] = useState(false);
const [mapCenter, setMapCenter] = useState(null);
```

### Page Sections

#### 1. Tracking Header
- Order number and basic info
- Current status badge
- Estimated delivery date
- Refresh button
- Share tracking link

#### 2. Live Map
- Interactive map showing current location
- Route visualization
- Delivery destination marker
- Current location marker
- Map controls (zoom, layers)

#### 3. Tracking Timeline
- Order status timeline
- Date and time stamps
- Location updates
- Status descriptions
- Expected milestones

#### 4. Shipment Details
- Carrier information
- Tracking number
- Service type
- Weight and dimensions
- Special handling instructions

#### 5. Delivery Information
- Delivery address
- Contact information
- Delivery instructions
- Expected time window
- Signature requirement

#### 6. Alerts and Notifications
- Delivery delay alerts
- Address change alerts
- Exception notifications
- Weather-related delays

### API Integration
```jsx
useEffect(() => {
  const loadTrackingData = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/v1/orders/${id}/track`);
      setTrackingData(response.data);
      setMapCenter({
        lat: response.data.current_location.lat,
        lng: response.data.current_location.lng
      });
    } catch (err) {
      console.error('Failed to load tracking data:', err);
    } finally {
      setLoading(false);
    }
  };
  loadTrackingData();
  
  // Set up auto-refresh every 30 seconds
  const interval = setInterval(loadTrackingData, 30000);
  return () => clearInterval(interval);
}, [id]);

const handleRefresh = async () => {
  setRefreshing(true);
  await loadTrackingData();
  setRefreshing(false);
};
```

### Layout Requirements
- **Header**: Tracking title, refresh button, share button
- **Main Content**: Map + timeline
- **Sidebar**: Shipment details, delivery info
- **Footer**: Support contact, related orders
- **Responsive**: Stacked layout on mobile, side-by-side on desktop

### Styling
- Full-width map display
- Timeline visualization
- Status badge color coding
- Loading skeletons during data fetch
- Real-time update indicators
- Mobile-optimized map controls

### Accessibility
- Semantic tracking information structure
- ARIA labels for map controls
- Keyboard navigation for timeline
- Screen reader compatibility
- Status badge ARIA labels
- Map accessibility (alternative text)

### Error Handling
- Tracking not available state
- API error display
- Network error handling
- Map loading error handling

### Success Behavior
- Real-time location updates
- Auto-refresh functionality
- Status change notifications
- Map centering on location

### Special Features
- **Real-time Updates**: WebSocket integration for live tracking
- **Push Notifications**: Delivery status alerts
- **Share Tracking**: Shareable tracking link
- **SMS Updates**: Optional SMS notifications
- **ETA Calculation**: Dynamic estimated arrival time

## Implementation Checklist
- [ ] Create page component file in `frontend/src/pages/OrderTrackingPage.jsx`
- [ ] Design layout with map and timeline
- [ ] Import required components
- [ ] Wire API calls via api.js service
- [ ] Add state management for tracking data
- [ ] Add error handling and loading states
- [ ] Add routing in `frontend/src/config/routes.js`
- [ ] Test responsive design (mobile, tablet, desktop)
- [ ] Test accessibility (WCAG 2.1 AA)
- [ ] Add unit test in `frontend/src/pages/__tests__/OrderTrackingPage.test.js`

---

*Generated for Phase 5.1 Critical Pages Implementation*