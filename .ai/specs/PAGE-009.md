# PAGE-009: /loans/apply

**Phase:** 5.1 (Critical Pages)  
**Component:** LoanApplicationPage  
**Priority:** P0 - Critical  
**Status:** Specification Complete  

## Page Specification

### Route
```
/loans/apply
```

### Purpose
Loan application page for farmers to apply for agricultural loans with credit assessment and document submission.

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
import Textarea from '../components/Textarea';
import Select from '../components/Select';
import FileUpload from '../components/FileUpload';
import EMICalculator from '../components/EMICalculator';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
```

### State Management
```jsx
const [loading, setLoading] = useState(false);
const [submitting, setSubmitting] = useState(false);
const [step, setStep] = useState(1);
const [creditScore, setCreditScore] = useState(null);
const { user } = useAuthStore();
```

### Form Sections

#### 1. Loan Type Selection (Step 1)
- Loan purpose (required, select)
- Loan amount (required, number, with slider)
- Loan term (required, select: 6, 12, 18, 24 months)
- EMI calculator preview

#### 2. Farmer Information (Step 2)
- Farm details (auto-populated if available)
- Land ownership documents (upload)
- Farm size in acres (required, number)
- Annual income (required, number)
- Existing loans (multi-input)

#### 3. Collateral Information (Step 3)
- Collateral type (select: land, equipment, crops, livestock)
- Collateral value (required, number)
- Collateral documents (upload)
- Guarantor information (optional)

#### 4. Loan Purpose (Step 4)
- Detailed purpose description (required, textarea)
- Crop planning details (optional)
- Input purchase list (optional)
- Working capital requirements (optional)

#### 5. Document Upload (Step 5)
- Identity proof (upload, required)
- Address proof (upload, required)
- Land documents (upload, required)
- Bank statements (upload, required)
- Tax returns (upload, optional)
- Other supporting documents (upload, optional)

#### 6. Review & Submit (Step 6)
- Application summary
- Terms and conditions
- Credit score display
- EMI breakdown
- Submit button

### API Integration
```jsx
const handleSubmit = async (data) => {
  setSubmitting(true);
  try {
    const response = await api.post('/api/v1/loans/apply', {
      ...data,
      farmer_id: user.farmer_id
    });
    
    // Show success and redirect
    navigate(`/loans/${response.data.loan_id}`);
  } catch (err) {
    console.error('Loan application failed:', err);
  } finally {
    setSubmitting(false);
  }
};

const checkCreditScore = async () => {
  try {
    const response = await api.post('/api/v1/credit-score/evaluate', {
      farmer_id: user.farmer_id,
      evaluation_type: 'loan_application'
    });
    setCreditScore(response.data.credit_score);
  } catch (err) {
    console.error('Credit check failed:', err);
  }
};
```

### Layout Requirements
- **Header**: Page title, progress indicator
- **Main Content**: Multi-step form with progress bar
- **Sidebar**: EMI calculator, tips, help
- **Footer**: Support contact, cancel button
- **Responsive**: Single column on mobile, two-column on desktop

### Styling
- Multi-step form with progress indicator
- Step-by-step validation
- EMI calculator preview
- Document upload with progress
- Success/error message banners
- Loading states during API calls

### Accessibility
- Semantic form structure
- ARIA labels for form fields
- Keyboard navigation for multi-step form
- Screen reader compatibility
- Progress announcement for step changes
- Form validation error announcements

### Error Handling
- Form validation errors
- API error display
- Document upload error handling
- Credit check error handling
- Network error handling

### Success Behavior
- Multi-step progress tracking
- Credit score display
- EMI calculation preview
- Application summary review
- Submit confirmation

### Special Features
- **EMI Calculator**: Built-in EMI calculation
- **Credit Score**: Real-time credit assessment
- **Document Upload**: Drag-and-drop with progress
- **Save Draft**: Save application as draft
- **Auto-fill**: Pre-fill from existing data

## Implementation Checklist
- [ ] Create page component file in `frontend/src/pages/LoanApplicationPage.jsx`
- [ ] Design layout with multi-step form
- [ ] Import required components
- [ ] Wire API calls via api.js service
- [ ] Add form handling and state management
- [ ] Add error handling and loading states
- [ ] Add routing in `frontend/src/config/routes.js`
- [ ] Test responsive design (mobile, tablet, desktop)
- [ ] Test accessibility (WCAG 2.1 AA)
- [ ] Add unit test in `frontend/src/pages/__tests__/LoanApplicationPage.test.js`

---

*Generated for Phase 5.1 Critical Pages Implementation*