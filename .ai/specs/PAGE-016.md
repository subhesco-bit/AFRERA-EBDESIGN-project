# PAGE-016: /insurance/policies/:id

**Phase:** 5.1 (Critical Pages)  
**Component:** PolicyDetailPage  
**Priority:** P0 - Critical  
**Status:** Specification Complete  

## Page Specification

### Route
```
/insurance/policies/:id
```

### Purpose
Detailed policy information page showing coverage details, premium breakdown, beneficiaries, and action buttons for policy management.

### Dependencies
- `frontend/src/services/api.js` - API client
- `frontend/src/components/` - UI components
- Frontend routing (React Router v6)
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
import BeneficiaryList from '../components/BeneficiaryList';
import DocumentViewer from '../components/DocumentViewer';
import LoadingSpinner from '../components/LoadingSpinner';
```

### State Management
```jsx
const [policy, setPolicy] = useState(null);
const [loading, setLoading] = useState(true);
const [activeTab, setActiveTab] = useState('overview');
```

### Page Sections

#### 1. Policy Header
- Policy number
- Policy type badge
- Coverage amount
- Premium amount
- Policy status badge
- Policy period
- Action buttons (claim, renew, download)

#### 2. Overview Tab
- Policy summary card
- Coverage details
- Insurer information
- Premium breakdown
- Policy documents

#### 3. Coverage Details Tab
- Covered risks and perils
- Coverage limits
- Exclusions
- Deductibles
- Terms and conditions

#### 4. Beneficiaries Tab
- Beneficiary list
- Add beneficiary button
- Edit beneficiary button
- Remove beneficiary button
- Beneficiary share percentages

#### 5. Documents Tab
- Policy document (download)
- Insurance certificate (download)
- Receipts (download)
- Communication history
- Claim history

#### 6. Actions Sidebar
- File claim button
- Renew policy button
- Update policy button
- Cancel policy button
- Contact insurer button
- Download certificate

### API Integration
```jsx
useEffect(() => {
  const loadPolicy = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/v1/insurance/policies/${id}`);
      setPolicy(response.data);
    } catch (err) {
      console.error('Failed to load policy details:', err);
    } finally {
      setLoading(false);
    }
  };
  loadPolicy();
}, [id]);

const handleFileClaim = async () => {
  navigate(`/insurance/claims/file?policy_id=${id}`);
};

const handleRenewPolicy = async () => {
  try {
    await api.post(`/api/v1/insurance/policies/${id}/renew`);
    // Show success and reload
    loadPolicy();
  } catch (err) {
    console.error('Policy renewal failed:', err);
  }
};
```

### Layout Requirements
- **Header**: Breadcrumb navigation, back button
- **Main Content**: Policy details with tabs
- **Sidebar**: Quick actions, summary
- **Footer**: Related policies, support links
- **Responsive**: Stacked layout on mobile, side-by-side on desktop

### Styling
- Tab-based content organization
- Status badge color coding
- Beneficiary list with sharing visualization
- Document viewer for PDFs
- Loading skeletons during data fetch
- Action button prominence

### Accessibility
- Semantic policy information structure
- ARIA labels for tabs
- Keyboard navigation for beneficiary list
- Screen reader compatibility
- Status badge ARIA labels
- Focus management for modals

### Error Handling
- Policy not found state
- API error display
- Network error handling
- Beneficiary update error handling

### Success Behavior
- Real-time status updates
- Beneficiary update confirmation
- Document download confirmation
- Action feedback messages

### Special Features
- **Beneficiary Management**: Add/edit/remove beneficiaries
- **Certificate Download**: PDF certificate generation
- **Quick Claim**: Fast claim filing
- **Premium Calculator**: Estimate renewal premium
- **Claim History**: View past claims

## Implementation Checklist
- [ ] Create page component file in `frontend/src/pages/PolicyDetailPage.jsx`
- [ ] Design layout with tabs and sidebar
- [ ] Import required components
- [ ] Wire API calls via api.js service
- [ ] Add state management for tabs and actions
- [ ] Add error handling and loading states
- [ ] Add routing in `frontend/src/config/routes.js`
- [ ] Test responsive design (mobile, tablet, desktop)
- [ ] Test accessibility (WCAG 2.1 AA)
- [ ] Add unit test in `frontend/src/pages/__tests__/PolicyDetailPage.test.js`

---

*Generated for Phase 5.1 Critical Pages Implementation*