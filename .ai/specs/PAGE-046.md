# PAGE-046: /settings/profile

**Phase:** 5.2 (Major Pages)  
**Component**: ProfileSettingsPage  
**Priority:** P1 - High  
**Status:** Specification Complete  

## Page Specification

### Route
```
/settings/profile
```

### Purpose
Profile settings page for updating user profile information, avatar, and personal details.

### Dependencies
- `frontend/src/services/api.js` - API client
- `frontend/src/components/Forms/` - Form components
- Frontend routing (React Router v6)
- State management (Zustand)

## Component Structure

### Key Sections
- **Profile Photo**: Avatar upload
- **Personal Information**: Name, contact
- **Address**: Address details
- **Business Information**: Business details
- **Bio**: Personal bio
- **Preferences**: Profile preferences

### Layout
- Form-based layout
- Avatar upload prominent
- Responsive design

### API Integration
- Load profile
- Update profile
- Upload avatar

## Implementation Checklist
- [ ] Create page component
- [ ] Design profile form
- [ ] Add avatar upload
- [ ] Wire API calls
- [ ] Add form validation
- [ ] Test responsive design
- [ ] Add unit tests

---

*Generated for Phase 5.2 Major Pages Implementation*