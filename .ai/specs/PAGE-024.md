# PAGE-024: /marketplace/listings/create

**Phase:** 5.2 (Major Pages)  
**Component:** CreateListingPage  
**Priority:** P1 - High  
**Status:** Specification Complete  

## Page Specification

### Route
```
/marketplace/listings/create
```

### Purpose
Create marketplace listing page for sellers to list products for sale with pricing, delivery options, and auction settings.

### Dependencies
- `frontend/src/services/api.js` - API client
- `frontend/src/components/Forms/` - Form components
- Frontend routing (React Router v6)
- State management (Zustand)

## Component Structure

### Key Sections
- **Product Selection**: Choose product to list
- **Listing Details**: Title, description, pricing
- **Inventory Settings**: Quantity, availability
- **Delivery Options**: Pickup, delivery methods
- **Auction Settings**: (optional) Start price, duration
- **Preview**: Listing preview before publish

### Layout
- Multi-step form with progress indicator
- Sidebar with preview
- Responsive design

### API Integration
- Load user products
- Create listing
- Upload images
- Preview listing

## Implementation Checklist
- [ ] Create page component
- [ ] Design multi-step form
- [ ] Add preview sidebar
- [ ] Wire API calls
- [ ] Add form validation
- [ ] Test responsive design
- [ ] Add unit tests

---

*Generated for Phase 5.2 Major Pages Implementation*