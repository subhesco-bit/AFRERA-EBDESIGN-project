# PAGE-027: /cooperative/join

**Phase:** 5.2 (Major Pages)  
**Component:** JoinCooperativePage  
**Priority:** P1 - High  
**Status:** Specification Complete  

## Page Specification

### Route
```
/cooperative/join
```

### Purpose
Cooperative membership application page for farmers to apply for cooperative membership.

### Dependencies
- `frontend/src/services/api.js` - API client
- `frontend/src/components/Forms/` - Form components
- Frontend routing (React Router v6)
- State management (Zustand)

## Component Structure

### Key Sections
- **Cooperative Info**: Cooperative details preview
- **Membership Type**: Select membership tier
- **Share Purchase**: Select share quantity
- **Farm Details**: Farm information
- **References**: Reference contacts
- **Terms**: Terms and conditions

### Layout
- Multi-step form
- Sidebar with cooperative info
- Responsive design

### API Integration
- Load cooperative details
- Submit membership application
- Calculate share cost

## Implementation Checklist
- [ ] Create page component
- [ ] Design multi-step form
- [ ] Add share calculator
- [ ] Wire API calls
- [ ] Add form validation
- [ ] Test responsive design
- [ ] Add unit tests

---

*Generated for Phase 5.2 Major Pages Implementation*