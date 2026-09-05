# PAGE-028: /agriculture

**Phase:** 5.2 (Major Pages)  
**Component:** AgricultureHomePage  
**Priority:** P1 - High  
**Status:** Specification Complete  

## Page Specification

### Route
```
/agriculture
```

### Purpose
Agricultural services homepage showcasing crop planning, weather, advisory, and IoT services.

### Dependencies
- `frontend/src/services/api.js` - API client
- `frontend/src/components/` - UI components
- Frontend routing (React Router v6)
- State management (Zustand)

## Component Structure

### Key Sections
- **Weather Widget**: Current weather and forecast
- **Crop Planning**: Quick access to crop plans
- **Advisory Feed**: Recent AI advisories
- **IoT Devices**: Device status overview
- **Resource Hub**: Access to agricultural resources
- **Seasonal Calendar**: Seasonal activity calendar

### Layout
- Grid-based service cards
- Weather widget prominent
- Responsive design

### API Integration
- Load weather data
- Load crop plans
- Load advisories
- Load IoT device status

## Implementation Checklist
- [ ] Create page component
- [ ] Design service grid
- [ ] Add weather widget
- [ ] Wire API calls
- [ ] Add state management
- [ ] Test responsive design
- [ ] Add unit tests

---

*Generated for Phase 5.2 Major Pages Implementation*