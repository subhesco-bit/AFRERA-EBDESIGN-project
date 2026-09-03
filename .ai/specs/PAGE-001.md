# PAGE-001: /auth/register

**Phase:** 5.1 (Critical Pages)  
**Component:** RegisterPage  
**Priority:** P0 - Critical  
**Status:** Specification Complete  

## Page Specification

### Route
```
/auth/register
```

### Purpose
User registration page for new account creation. Supports farmer, buyer, and admin account types with role-specific information collection.

### Dependencies
- `frontend/src/services/api.js` - API client
- `frontend/src/components/Forms/` - Form components
- Frontend routing (React Router v6)
- State management (Zustand)

## Component Structure

### Imports
```jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import Checkbox from '../components/Checkbox';
import LoadingSpinner from '../components/LoadingSpinner';
```

### State Management
```jsx
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
const [step, setStep] = useState(1); // Multi-step registration
const { register } = useAuthStore();
```

### Form Fields
- **Basic Information** (Step 1):
  - First name (required, text)
  - Last name (required, text)
  - Email (required, email)
  - Phone (required, phone)
  - Password (required, password with validation)
  - Confirm password (required, password)

- **Account Type** (Step 2):
  - Account type (required, select: farmer, buyer, admin)
  - Organization name (optional, text, for buyer/admin)
  - PAN number (optional, text, for buyer/admin)

- **Farmer-Specific** (Step 3, conditional):
  - Farm location (required, text)
  - Farm size in acres (required, number)
  - Primary crops (required, multi-select)
  - Farming experience in years (required, number)

- **Terms & Privacy** (Step 4):
  - Terms of service acceptance (required, checkbox)
  - Privacy policy acceptance (required, checkbox)
  - Marketing communications (optional, checkbox)

### API Integration
```jsx
const handleSubmit = async (data) => {
  setLoading(true);
  setError(null);
  
  try {
    const response = await api.post('/api/v1/auth/register', {
      ...data,
      account_type: accountType,
      farmer_details: farmerDetails
    });
    
    // Auto-login after successful registration
    await register(response.data.user, response.data.tokens);
    navigate('/dashboard');
  } catch (err) {
    setError(err.response?.data?.error?.message || 'Registration failed');
  } finally {
    setLoading(false);
  }
};
```

### Validation Rules
- Email format validation
- Password strength (minimum 8 characters, 1 uppercase, 1 lowercase, 1 number)
- Phone number format (Indian mobile format)
- Password confirmation match
- Required field validation
- Account type conditional validation

### Layout Requirements
- **Header**: Platform logo, branding, login link
- **Main Content**: Centered registration form container
- **Progress Indicator**: Step progress bar for multi-step form
- **Footer**: Links to terms, privacy, support
- **Responsive**: Full-width on mobile, centered card on desktop

### Styling
- Clean, modern design with TailwindCSS
- Card-based layout with shadow
- Input field focus states
- Loading states during API calls
- Error message display with red text
- Success state with confetti animation

### Accessibility
- Semantic HTML structure
- ARIA labels for form fields
- Keyboard navigation support
- Screen reader compatibility
- High contrast ratio (WCAG 2.1 AA)
- Focus indicators

### Error Handling
- Form validation errors
- API error display
- Network error handling
- Duplicate email detection
- Server-side validation feedback

### Success Behavior
- Display success message
- Auto-redirect to dashboard
- Send welcome email (server-side)
- Initialize user session
- Track registration completion

### Testing Requirements
- Unit test for form validation
- Integration test for API calls
- E2E test for complete registration flow
- Accessibility audit
- Responsive design testing on 3+ screen sizes

## Implementation Checklist
- [ ] Create page component file in `frontend/src/pages/RegisterPage.jsx`
- [ ] Design layout with multi-step form
- [ ] Import required components
- [ ] Wire API calls via api.js service
- [ ] Add form handling and state management
- [ ] Add error handling and loading states
- [ ] Add routing in `frontend/src/config/routes.js`
- [ ] Test responsive design (mobile, tablet, desktop)
- [ ] Test accessibility (WCAG 2.1 AA)
- [ ] Add unit test in `frontend/src/pages/__tests__/RegisterPage.test.js`

---

*Generated for Phase 5.1 Critical Pages Implementation*