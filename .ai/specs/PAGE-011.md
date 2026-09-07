# PAGE-011: /finance/emi-calc

**Phase:** 5.1 (Critical Pages)  
**Component:** EMICalculatorPage  
**Priority:** P0 - Critical  
**Status:** Specification Complete  

## Page Specification

### Route
```
/finance/emi-calc
```

### Purpose
EMI calculator page for loan planning and repayment estimation. Provides interactive calculator with amortization schedule visualization.

### Dependencies
- `frontend/src/services/api.js` - API client
- `frontend/src/components/` - UI components
- Frontend routing (React Router v6)
- State management (Zustand)

## Component Structure

### Imports
```jsx
import { useState } from 'react';
import EMICalculator from '../components/EMICalculator';
import Chart from '../components/Chart';
import Card from '../components/Card';
import Input from '../components/Input';
import Slider from '../components/Slider';
import Button from '../components/Button';
```

### State Management
```jsx
const [loanParams, setLoanParams] = useState({
  principal: 50000,
  interestRate: 12.5,
  tenureMonths: 12,
  processingFee: 500,
  prepaymentEnabled: false,
  prepaymentPenaltyRate: 2.0
});
const [calculation, setCalculation] = useState(null);
```

### Page Sections

#### 1. Calculator Header
- Page title
- Quick preset buttons (common loan amounts)
- Reset button

#### 2. Loan Parameters
- Principal amount (number input + slider)
- Interest rate (number input + slider)
- Loan tenure (number input + select)
- Processing fee (number input)
- Prepayment options (toggle + inputs)

#### 3. EMI Results
- Monthly EMI amount
- Total payment amount
- Total interest payable
- Payment summary card

#### 4. Amortization Schedule
- Amortization schedule table
- Principal vs interest breakdown
- Balance remaining over time
- Year-wise summary

#### 5. Charts
- Payment breakdown pie chart
- Balance reduction line chart
- Interest vs principal over time

#### 6. Comparison
- Compare different loan options
- Save calculation
- Export results

### API Integration
```jsx
const calculateEMI = async () => {
  try {
    const response = await api.post('/api/v1/emi/calculate', loanParams);
    setCalculation(response.data);
  } catch (err) {
    console.error('EMI calculation failed:', err);
    // Fallback to client-side calculation
    setCalculation(calculateClientSide(loanParams));
  }
};

const calculateClientSide = (params) => {
  // Client-side EMI calculation fallback
  const r = params.interestRate / 12 / 100;
  const emi = params.principal * r * Math.pow(1 + r, params.tenureMonths) / (Math.pow(1 + r, params.tenureMonths) - 1);
  return {
    monthly_emi: emi,
    total_payable: emi * params.tenureMonths,
    total_interest: (emi * params.tenureMonths) - params.principal
  };
};
```

### Layout Requirements
- **Header**: Page title, quick presets
- **Main Content**: Calculator + results
- **Sidebar**: Saved calculations, comparison
- **Footer**: Export options, help
- **Responsive**: Stacked layout on mobile, side-by-side on desktop

### Styling
- Calculator form with sliders
- Results card with highlighting
- Chart visualization
- Clean table layout
- Interactive sliders with real-time updates
- Mobile-optimized controls

### Accessibility
- Semantic calculator structure
- ARIA labels for sliders
- Keyboard navigation for inputs
- Screen reader compatibility
- Chart accessibility (alternative text)
- Form validation error announcements

### Error Handling
- Input validation errors
- Calculation error handling
- API error fallback to client-side
- Network error handling

### Success Behavior
- Real-time calculation updates
- Visual result highlighting
- Chart updates
- Save confirmation

### Special Features
- **Real-time Calculation**: Instant EMI updates on parameter change
- **Chart Visualization**: Visual breakdown of payments
- **Comparison Mode**: Compare multiple loan options
- **Export**: Export results to PDF/Excel
- **Presets**: Quick-select common loan configurations

## Implementation Checklist
- [ ] Create page component file in `frontend/src/pages/EMICalculatorPage.jsx`
- [ ] Design layout with calculator and results
- [ ] Import required components
- [ ] Wire API calls via api.js service
- [ ] Add state management for calculation
- [ ] Add error handling and loading states
- [ ] Add routing in `frontend/src/config/routes.js`
- [ ] Test responsive design (mobile, tablet, desktop)
- [ ] Test accessibility (WCAG 2.1 AA)
- [ ] Add unit test in `frontend/src/pages/__tests__/EMICalculatorPage.test.js`

---

*Generated for Phase 5.1 Critical Pages Implementation*