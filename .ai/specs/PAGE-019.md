# PAGE-019: /data/export

**Phase:** 5.1 (Critical Pages)  
**Component:** DataExportPage  
**Priority:** P0 - Critical  
**Status:** Specification Complete  

## Page Specification

### Route
```
/data/export
```

### Purpose
GDPR data export page for users to request their personal data in various formats for data portability compliance.

### Dependencies
- `frontend/src/services/api.js` - API client
- `frontend/src/components/` - UI components
- Frontend routing (React Router v6)
- State management (Zustand)

## Component Structure

### Imports
```jsx
import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import Button from '../components/Button';
import Card from '../components/Card';
import Checkbox from '../components/Checkbox';
import Select from '../components/Select';
import DateRangePicker from '../components/DateRangePicker';
import LoadingSpinner from '../components/LoadingSpinner';
```

### State Management
```jsx
const [exportConfig, setExportConfig] = useState({
  export_format: 'json',
  data_categories: ['profile', 'orders', 'payments'],
  include_deleted: false,
  date_range: null,
  compression: true
});
const [loading, setLoading] = useState(false);
const [exportId, setExportId] = useState(null);
const [exportStatus, setExportStatus] = useState(null);
const [downloadUrl, setDownloadUrl] = useState(null);
```

### Page Sections

#### 1. Export Header
- Page title ("Data Export")
- GDPR compliance notice
- Last export date
- Export history button

#### 2. Data Category Selection
- Profile information (checkbox)
- Order history (checkbox)
- Payment history (checkbox)
- Loan applications (checkbox)
- Insurance policies (checkbox)
- Claims history (checkbox)
- Consent records (checkbox)
- Activity logs (checkbox)

#### 3. Export Format Selection
- JSON (recommended)
- CSV
- PDF
- XLSX

#### 4 Date Range Selection
- Start date picker
- End date picker
- Include deleted data toggle
- Compression option

#### 5. Export Summary
- Selected categories
- Estimated file size
- Estimated processing time
- Export terms agreement

#### 6. Export Status
- Processing indicator
- Ready state with download button
- Download expiration countdown
- Request new export button

#### 7. Export History
- Previous exports list
- Download links
- Expiration dates
- File sizes

### API Integration
```jsx
const requestExport = async () => {
  setLoading(true);
  try {
    const response = await api.post('/api/v1/data/export', exportConfig);
    setExportId(response.data.export_id);
    setExportStatus('processing');
    
    // Poll for completion
    pollExportStatus(response.data.export_id);
  } catch (err) {
    console.error('Export request failed:', err);
    setLoading(false);
  }
};

const pollExportStatus = async (id) => {
  const interval = setInterval(async () => {
    try {
      const response = await api.get(`/api/v1/data/export/${id}/status`);
      setExportStatus(response.data.status);
      
      if (response.data.status === 'ready') {
        setDownloadUrl(response.data.download_url);
        clearInterval(interval);
        setLoading(false);
      }
    } catch (err) {
      console.error('Export status check failed:', err);
      clearInterval(interval);
      setLoading(false);
    }
  }, 5000);
};
```

### Layout Requirements
- **Header**: Page title, compliance notice, history button
- **Main Content**: Export configuration form
- **Sidebar**: Export history, data retention info
- **Footer**: Support contact, terms links
- **Responsive**: Single column on mobile, two-column on desktop

### Styling
- Form-based layout with clear sections
- GDPR compliance notices
- Progress indicator for large exports
- Download button prominence
- Loading states during API calls
- File size estimation display

### Accessibility
- Semantic form structure
- ARIA labels for checkboxes
- Keyboard navigation for form
- Screen reader compatibility
- Form validation error announcements
- GDPR accessibility compliance

### Error Handling
- Form validation errors
- API error display
- Network error handling
- Export limit error handling
- Data retention policy errors

### Success Behavior
- Real-time status updates
- Download button activation
- Expiration countdown display
- Export history update
- Email notification on completion

### Special Features
- **Format Selection**: Multiple export formats
- **Category Selection**: Granular data category control
- **Date Range**: Flexible date range selection
- **Compression**: File compression option
- **Export History**: View and download previous exports
- **Retention Policy**: Display data retention information

## Implementation Checklist
- [ ] Create page component file in `frontend/src/pages/DataExportPage.jsx`
- [ ] Design layout with form and history
- [ ] Import required components
- [ ] Wire API calls via api.js service
- [ ] Add state management for export process
- [ ] Add error handling and loading states
- [ ] Add routing in `frontend/src/config/routes.js`
- [ ] Test responsive design (mobile, tablet, desktop)
- [ ] Test accessibility (WCAG 2.1 AA)
- [ ] Add unit test in `frontend/src/pages/__tests__/DataExportPage.test.js`

---

*Generated for Phase 5.1 Critical Pages Implementation*