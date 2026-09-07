# PAGE-026: /cooperative

**Phase:** 5.2 (Major Pages)  
**Component:** CooperativePage  
**Priority:** P1 - High  
**Status:** Specification Complete  

## Page Specification

### Route
```
/cooperative
```

### Purpose
Cooperative information page showing cooperative details, membership status, and share information.

### Dependencies
- `frontend/src/services/api.js` - API client
- `frontend/src/components/` - UI components
- Frontend routing (React Router v6)
- State management (Zustand)

## Component Structure

### Key Sections
- **Cooperative Info**: Name, description, members
- **Membership Status**: Current status, join button
- **Share Information**: Share value, ownership
- **Dividend History**: Recent dividend payments
- **Activities**: Recent cooperative activities
- **Documents**: Cooperative documents

### Layout
- Header with cooperative branding
- Information cards grid
- Responsive design

### API Integration
- Load cooperative details
- Load membership status
- Load share information
- Load dividend history

## Implementation Checklist
- [ ] Create page component
- [ ] Design information layout
- [ ] Add share visualization
- [ ] Wire API calls
- [ ] Add state management
- [ ] Test responsive design
- [ ] Add unit tests

---

*Generated for Phase 5.2 Major Pages Implementation*