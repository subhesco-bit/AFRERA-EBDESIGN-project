# PAGE-012: /finance/payment

**Phase:** 5.1 (Critical Pages)  
**Component:** PaymentPage  
**Priority:** P0 - Critical  
**Status:** Specification Complete  

## Page Specification

### Route
```
/finance/payment
```

### Purpose
Payment processing page for completing transactions, EMI payments, and other financial transactions with multiple payment methods.

### Dependencies
- `frontend/src/services/api.js` - API client
- `frontend/src/components/` - UI components
- Frontend routing (React Router v6)
- State management (Zustand)

## Component Structure

### Imports
```jsx
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import Button from '../components/Button';
import Card from '../components/Card';
import PaymentMethodSelector from '../components/PaymentMethodSelector';
import CardPaymentForm from '../components/CardPaymentForm';
import UPIPaymentForm from '../components/UPIPaymentForm';
import LoadingSpinner from '../components/LoadingSpinner';
```

### State Management
```jsx
const [paymentData, setPaymentData] = useState(null);
const [loading, setLoading] = useState(true);
const [processing, setProcessing] = useState(false);
const [selectedMethod, setSelectedMethod] = useState('upi');
const { user } = useAuthStore();
const [searchParams] = setSearchParams(useSearchParams());
```

### Page Sections

#### 1. Payment Header
- Transaction type indicator
- Amount to pay
- Transaction reference
- Cancel button

#### 2. Payment Method Selection
- UPI (default)
- Credit/Debit Card
- Net Banking
- Wallet
- Cash on Delivery (if applicable)

#### 3. Payment Details Form
- Method-specific form fields
- Save payment method option
- Auto-fill for registered methods

#### 4. Order/Transaction Summary
- Order items or loan details
- Amount breakdown
- Additional charges
- Total amount to pay

#### 5. Payment Processing
- Processing indicator
- Success state
- Failure state with retry option

#### 6. Security Features
- SSL indicator
- Security badges
- PCI compliance notice
- Save card option

### API Integration
```jsx
useEffect(() => {
  const loadPaymentData = async () => {
    setLoading(true);
    try {
      const transactionType = searchParams.get('type') || 'order';
      const transactionId = searchParams.get('id');
      
      const response = await api.get(`/api/v1/payments/details`, {
        params: { transaction_type: transactionType, transaction_id }
      });
      setPaymentData(response.data);
    } catch (err) {
      console.error('Failed to load payment data:', err);
    } finally {
      setLoading(false);
    }
  };
  loadPaymentData();
}, [searchParams]);

const handlePayment = async (paymentDetails) => {
  setProcessing(true);
  try {
    const response = await api.post('/api/v1/payments/process', {
      transaction_type: paymentData.type,
      transaction_id: paymentData.id,
      amount: paymentData.amount,
      payment_method: selectedMethod,
      payment_details: paymentDetails
    });
    
    // Show success and redirect
    navigate(`/payments/${response.data.payment.id}/success`);
  } catch (err) {
    console.error('Payment failed:', err);
    setProcessing(false);
  }
};
```

### Layout Requirements
- **Header**: Payment title, amount, cancel button
- **Main Content**: Payment method + form
- **Sidebar**: Transaction summary, support
- **Footer**: Security badges, help
- **Responsive**: Stacked layout on mobile, side-by-side on desktop

### Style
- Clean payment form design
- Payment method cards with icons
- Summary card with highlighting
- Processing state indicators
- Security badges prominently displayed
- Mobile-optimized payment forms

### Accessibility
- Semantic payment form structure
- ARIA labels for payment fields
- Keyboard navigation for payment methods
- Screen reader compatibility
- Form validation error announcements
- Security announcements

### Error Handling
- Form validation errors
- Payment processing errors
- Network error handling
- Card payment errors
- UPI payment errors

### Success Behavior
- Payment processing animation
- Success confirmation
- Receipt generation
- Redirect to success page
- Save payment method option

### Special Features
- **Saved Payment Methods**: Quick select from saved cards/UPI IDs
- **Instant Payments**: Instant UPI payments
- **Secure Card Handling**: PCI DSS compliant
- **Payment History**: View recent payments
- **Receipt Download**: PDF receipt generation

## Implementation Checklist
- [ ] Create page component file in `frontend/src/pages/PaymentPage.jsx`
- [ ] Design layout with payment methods and forms
- [ ] Import required components
- [ ] Wire API calls via api.js service
- [ ] Add state management for payment processing
- [ ] Add error handling and loading states
- [ ] Add routing in `frontend/src/config/routes.js`
- [ ] Test responsive design (mobile, tablet, desktop)
- [ ] Test accessibility (WCAG 2.1 AA)
- [ ] Add unit test in `frontend/src/pages/__tests__/PaymentPage.test.js`

---

*Generated for Phase 5.1 Critical Pages Implementation*