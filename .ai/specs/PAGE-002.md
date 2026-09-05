# PAGE-002: /auth/settings

**Phase:** 5.1 (Critical Pages)  
**Component:** AuthSettingsPage  
**Priority:** P0 - Critical  
**Status:** Specification Complete  

## Page Specification

### Route
```
/auth/settings
```

### Purpose
User authentication settings page for managing account security, preferences, and authentication methods including MFA.

### Dependencies
- `frontend/src/services/api.js` - API client
- `frontend/src/components/Forms/` - Form components
- Frontend routing (React Router v6)
- State management (Zustand)

## Component Structure

### Imports
```jsx
import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import Button from '../components/Button';
import Input from '../components/Input';
import Toggle from '../components/Toggle';
import Card from '../components/Card';
import Alert from '../components/Alert';
import MFAPanel from '../components/MFA/MFAPanel';
```

### State Management
```jsx
const [loading, setLoading] = useState(false);
const [saving, setSaving] = useState(false);
const [success, setSuccess] = useState(null);
const [userSettings, setUserSettings] = useState({
  email: '',
  phone: '',
  mfa_enabled: false,
  mfa_method: null,
  notification_preferences: {}
});
```

### Sections

#### 1. Profile Information
- Email address (read-only, display)
- Phone number (editable, with verification)
- Profile completion percentage
- Account creation date

#### 2. Security Settings
- **Password Management**:
  - Change password (button to open modal)
  - Last password change date
  - Password strength indicator

- **MFA Settings**:
  - MFA status (enabled/disabled)
  - MFA method (TOTP/SMS)
  - Setup MFA button (opens MFA setup flow)
  - View backup codes (if MFA enabled)
  - Regenerate backup codes

#### 3. Notification Preferences
- Email notifications (toggle)
- SMS notifications (toggle)
- Push notifications (toggle)
- Marketing communications (toggle)
- Order updates (toggle)
- Price alerts (toggle)

#### 4. Session Management
- Active sessions list
- Revoke session button
- Revoke all sessions button
- Current device indicator

#### 5. Privacy Settings
- Profile visibility (toggle)
- Activity tracking (toggle)
- Data sharing preferences (toggle)
- Delete account button (with confirmation)

### API Integration
```jsx
const loadSettings = async () => {
  setLoading(true);
  try {
    const response = await api.get('/api/v1/auth/settings');
    setUserSettings(response.data);
  } catch (err) {
    console.error('Failed to load settings:', err);
  } finally {
    setLoading(false);
  }
};

const updateSettings = async (section, data) => {
  setSaving(true);
  try {
    await api.put('/api/v1/auth/settings', { section, ...data });
    setSuccess('Settings updated successfully');
    loadSettings(); // Reload settings
  } catch (err) {
    console.error('Failed to update settings:', err);
  } finally {
    setSaving(false);
  }
};
```

### Layout Requirements
- **Header**: Page title, breadcrumb navigation
- **Main Content**: Settings sections as cards
- **Navigation**: Tab-based or accordion-based section navigation
- **Footer**: Support link, logout button
- **Responsive**: Single column on mobile, two-column on desktop

### Styling
- Card-based layout for each section
- Toggle switches for boolean settings
- Clear section separation
- Success/error message banners
- Loading states during API calls
- Danger zone styling for destructive actions

### Accessibility
- Semantic section structure
- ARIA labels for interactive elements
- Keyboard navigation for tabs/accordions
- Screen reader compatibility
- High contrast colors
- Focus management for modals

### Error Handling
- API error display with user-friendly messages
- Form validation errors
- Network error handling
- Permission error handling

### Success Behavior
- Display success banner after updates
- Auto-hide success messages after 5 seconds
- Real-time setting updates
- Confirmation dialogs for destructive actions

### Special Features
- **MFA Integration**: Embedded MFA setup panel
- **Session Management**: Visual display of active sessions
- **Account Deletion**: Multi-step confirmation process
- **Backup Codes**: Secure display with copy functionality

## Implementation Checklist
- [ ] Create page component file in `frontend/src/pages/AuthSettingsPage.jsx`
- [ ] Design layout with tabbed/accordion navigation
- [ ] Import required components
- [ ] Wire API calls via api.js service
- [ ] Add form handling and state management
- [ ] Add error handling and loading states
- [ ] Add routing in `frontend/src/config/routes.js`
- [ ] Test responsive design (mobile, tablet, desktop)
- [ ] Test accessibility (WCAG 2.1 AA)
- [ ] Add unit test in `frontend/src/pages/__tests__/AuthSettingsPage.test.js`

---

*Generated for Phase 5.1 Critical Pages Implementation*