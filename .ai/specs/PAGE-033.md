# PAGE-033: /iot/devices/register

**Phase:** 5.2 (Major Pages)  
**Component**: RegisterDevicePage  
**Priority:** P1 - High  
**Status:** Specification Complete  

## Page Specification

### Route
```
/iot/devices/register
```

### Purpose
IoT device registration page for adding new devices to the platform.

### Dependencies
- `frontend/src/services/api.js` - API client
- `frontend/src/components/Forms/` - Form components
- Frontend routing (React Router v6)
- State management (Zustand)

## Component Structure

### Key Sections
- **Device Type Selection**: Choose device type
- **Device Information**: Manufacturer, model, serial
- **Location Setup**: Farm, field, coordinates
- **Capabilities**: Sensors, actuators
- **Configuration**: Sampling rate, thresholds
- **Setup Instructions**: Device setup guide

### Layout
- Multi-step form
- Setup instructions sidebar
- Responsive design

### API Integration
- Register device
- Generate device credentials
- Load farm locations

## Implementation Checklist
- [ ] Create page component
- [ ] Design multi-step form
- [ ] Add setup instructions
- [ ] Wire API calls
- [ ] Add form validation
- [ ] Test responsive design
- [ ] Add unit tests

---

*Generated for Phase 5.2 Major Pages Implementation*