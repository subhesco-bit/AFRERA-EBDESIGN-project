# PAGE-010: /loans/:id

**Phase:** 5.1 (Critical Pages)  
**Component:** LoanDetailPage  
**Priority:** P0 - Critical  
**Status:** Specification Complete  

## Page Specification

### Route
```
/loans/:id
```

### Purpose
Loan detail page showing loan status, repayment schedule, EMI breakdown, and action buttons for loan management.

### Dependencies
- `frontend/src/services/api.js` - API client
- `frontend/src/components/` - UI components
- Frontend routing (React v6)
- State management (Zustand)

## Component Structure

### Imports
```jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import Button from '../components/Button';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';
import EMIBreakdown from '../components/EMIBreakdown';
import RepaymentSchedule from '../components/RepaymentSchedule';
import LoadingSpinner from '../components/LoadingSpinner';
```

### State Management
```jsx
const [loan, setLoan] = useState(null);
const [loading, setLoading] = useState(true);
const [activeTab, setActiveTab] = useState('overview');
```

### Page Sections

#### 1. Loan Header
- Loan number
- Loan status badge
- Application date
- Loan amount
- Interest rate
- Term
- Action buttons (pay EMI, request changes)

#### 2. Overview Tab
- Loan summary card
- Credit score at application
- Risk assessment
- Approval status
- Disbursement information

#### 3. Repayment Schedule Tab
- EMI breakdown table
- Payment due dates
- Payment status (paid, pending, overdue)
- Outstanding balance
- Prepayment options

#### 4. Documents Tab
- Loan agreement download
- Repayment schedule download
- Collateral documents
- Tax documents
- Communication history

#### 5. Activity Timeline Tab
- Application timeline
- Approval process events
- Disbursement events
- Payment history
- Status change events

#### 6. Actions Sidebar
- Pay EMI button
- Request prepayment
- Contact support
- View amortization schedule
- Download statements

### API Integration
```jsx
useEffect(() => {
  const loadLoan = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/v1/loans/${id}/status`);
      setLoan(response.data);
    } catch (err) {
      console.error('Failed to load loan details:', err);
    } finally {
      setLoading(false);
    }
  };
  loadLoan();
}, [id]);

const handlePayment = async (amount) => {
  try {
    await api.post('/api/v1/payments/process', {
      transaction_type: 'loan',
      transaction_id: id,
      amount: amount,
      payment_method: 'upi'
    });
    // Reload loan data
    loadLoan();
  } catch (err) {
    console.error('Payment failed:', err);
  }
};
```

### Layout Requirements
- **Header**: Breadcrumb navigation, back button
- **Main Content**: Loan details with tabs
- **Sidebar**: Quick actions, summary
- **Footer**: Support contact, related information
- **Responsive**: Stacked layout on mobile, side-by-side on desktop

### Styling
- Tab-based content organization
- Status badge color coding
- EMI breakdown visualization
- Repayment schedule table
- Loading skeletons during data fetch
- Action button prominence

### Accessibility
- Semantic loan information structure
- ARIA labels for tabs
- Keyboard navigation for tables
- Screen reader compatibility
- Status badge ARIA labels
- Focus management for modals

### Error Handling
- Loan not found state
- API error display
- Network error handling
- Payment error handling

### Success Behavior
- Real-time status updates
- Payment confirmation
- Tab switching animations
- Action feedback messages

### Special Features
- **Real-time Updates**: WebSocket integration for status changes
- **EMI Calculator**: Built-in prepayment calculator
- **Payment History**: Complete payment timeline
- **Document Generation**: PDF statement generation
- **SMS Reminders**: Optional EMI due date reminders

## Implementation Checklist
- [ ] Create page component file in `frontend/src/pages/LoanDetailPage.jsx`
- [ ] Design layout with tabs and sidebar
- [ ] Import required components
- [ ] Wire API calls via api.js service
- [ ] Add state management for tabs and actions
- [ ] Add error handling and loading states
- [ ] Add routing in `frontend/src/config/routes.js`
- [ ] Test responsive design (mobile, tablet, desktop)
- [ ] Test accessibility (WCAG 2.1 AA)
- [ ] Add unit test in `frontend/src/pages/__tests__/LoanDetailPage.test.js`

---

*Generated for Phase 5.1 Critical Pages Implementation*