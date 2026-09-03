# PAGE-018: /mfa/setup

**Phase:** 5.1 (Critical Pages)  
**Component:** MFASetupPage  
**Priority:** P0 - Critical  
**Status:** Specification Complete  

## Page Specification

### Route
```
/mfa/setup
```

### Purpose
Multi-factor authentication setup page for enabling MFA on user accounts with TOTP or SMS verification methods.

### Dependencies
- `frontend/src/services/api.js` - API client
- `frontend/src/components/` - UI components
- Frontend routing (React Router v6)
- State management (Zustand)

## Component Structure

### Imports
```jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';
import QRCodeDisplay from '../components/QRCodeDisplay';
import BackupCodesDisplay from '../components/BackupCodesDisplay';
import LoadingSpinner from '../components/LoadingSpinner';
```

### State Management
```jsx
const [step, setStep] = useState(1);
const [method, setMethod] = useState('totp');
const [qrCode, setQrCode] = useState(null);
const [backupCodes, setBackupCodes] = useState([]);
const [verificationCode, setVerificationCode] = useState('');
const [loading, setLoading] = useState(false);
const [success, setSuccess] = useState(false);
```

### Page Sections

#### 1. Method Selection (Step 1)
- TOTP option (recommended)
- SMS option
- Method comparison features
- Help links

#### 2. TOTP Setup (Step 2, conditional)
- QR code display
- Secret key display (one-time)
- Authenticator app download links
- Setup instructions
- Test verification field

#### 3. SMS Setup (Step 2, conditional)
- Phone number input
- Send verification code button
- OTP input field
- Resend code option

#### 4. Verification (Step 3)
- Verification code input
- Verify button
- Error message display
- Retry options

#### 5. Backup Codes (Step 4)
- Backup codes display
- Download codes button
- Security warning
- Regenerate codes option

#### 6. Completion (Step 5)
- Success message
- Backup codes final display
- Enable MFA confirmation
- Security tips
- Return to settings button

### API Integration
```jsx
const setupMFA = async () => {
  setLoading(true);
  try {
    const response = await api.post('/api/v1/mfa/setup', {
      method: method,
      phone_number: phoneNumber
    });
    
    if (method === 'totp') {
      setQrCode(response.data.qr_code);
      setBackupCodes(response.data.backup_codes);
      setStep(2);
    } else {
      setStep(3); // SMS verification
    }
  } catch (err) {
    console.error('MFA setup failed:', err);
  } finally {
    setLoading(false);
  }
};

const verifyMFA = async () => {
  setLoading(true);
  try {
    const response = await api.post('/api/v1/mfa/verify', {
      code: verificationCode,
      method: method,
      setup_token: setupToken
    });
    
    setSuccess(true);
    setStep(5);
  } catch (err) {
    console.error('MFA verification failed:', err);
  } finally {
    setLoading(false);
  }
};
```

### Layout Requirements
- **Header**: Page title, progress indicator
- **Main Content**: Multi-step setup flow
- **Sidebar**: Security tips, help links
- **Footer**: Cancel button, support contact
- **Responsive**: Single column on mobile, centered on desktop

### Styling
- Multi-step form with progress indicator
- QR code display with copy option
- Backup codes grid display
- Security warning banners
- Loading states during API calls
- Success confirmation state

### Accessibility
- Semantic form structure
- ARIA labels for steps
- Keyboard navigation for multi-step form
- Screen reader compatibility
- Form validation error announcements
- Security announcement for backup codes

### Error Handling
- Setup error handling
- Verification error handling
- API error display
- Network error handling
- Invalid code handling

### Success Behavior
- Multi-step progress tracking
- QR code copy confirmation
- Backup codes download confirmation
- MFA enable confirmation
- Redirect to settings after completion

### Special Features
- **QR Code Copy**: One-click QR code copy
- **Backup Codes Download**: Download as text/JSON
- **Backup Codes Regenerate**: Regenerate with confirmation
- **Security Guide**: Security best practices
- **Recovery Options**: Account recovery if device lost

## Implementation Checklist
- [ ] Create page component file in `frontend/src/pages/MFASetupPage.jsx`
- [ ] Design layout with multi-step flow
- [ ] Import required components
- [ ] Wire API calls via api.js service
- [ ] Add state management for setup process
- [ ] Add error handling and loading states
- [ ] Add routing in `frontend/src/config/routes.js`
- [ ] Test responsive design (mobile, tablet, desktop)
- [ ] Test accessibility (WCAG 2.1 AA)
- [ ] Add unit test in `frontend/src/pages/__tests__/MFASetupPage.test.js`

---

*Generated for Phase 5.1 Critical Pages Implementation*