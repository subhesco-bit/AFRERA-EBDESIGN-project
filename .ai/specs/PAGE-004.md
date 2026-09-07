# PAGE-004: /products/:id/edit

**Phase:** 5.1 (Critical Pages)  
**Component:** ProductEditPage  
**Priority:** P0 - Critical  
**Status:** Specification Complete  

## Page Specification

### Route
```
/products/:id/edit
```

### Purpose
Product editing page for sellers to update product information, pricing, and specifications.

### Dependencies
- `frontend/src/services/api.js` - API client
- `frontend/src/components/Forms/` - Form components
- Frontend routing (React Router v6)
- State management (Zustand)

## Component Structure

### Imports
```jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import Button from '../components/Button';
import Input from '../components/Input';
import Textarea from '../components/Textarea';
import Select from '../components/Select';
import FileUpload from '../components/FileUpload';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
```

### State Management
```jsx
const [loading, setLoading] = useState(true);
const [saving, setSaving] = useState(false);
const [error, setError] = useState(null);
const [success, setSuccess] = useState(null);
const { user } = useAuthStore();
const [uploadedImages, setUploadedImages] = useState([]);
```

### Form Sections

#### 1. Basic Information
- Product name (required, text)
- SKU/Product ID (auto-generated, read-only)
- Category (required, select)
- State/Region (required, select)
- Unit (required, select)
- Active status (toggle)

#### 2. Pricing
- Base price (required, number)
- Currency (read-only, defaults to INR)
- Bulk pricing tiers (dynamic form)
- Discount percentage (optional, number)

#### 3. Description
- Short description (required, text, 150 chars)
- Long description (required, textarea)
- Key features (multi-input)
- Use cases (multi-input)

#### 4. Specifications
- Quality grade (select)
- Varieties (multi-select)
- Seasonal availability (multi-select)
- Nutritional information (conditional, form)
- Storage requirements (optional, text)
- Shelf life days (optional, number)

#### 5. Images
- Main image upload (required)
- Additional images upload (up to 10)
- Image reordering
- Image deletion

#### 6. Certifications
- Organic certification (toggle + upload)
- GI tag (toggle + upload)
- Fair trade (toggle + upload)
- Other certifications (multi-select + upload)

#### 7. Inventory
- Available quantity (required, number)
- Reorder threshold (optional, number)
- Stock status (select: in_stock, low_stock, out_of_stock)

### API Integration
```jsx
useEffect(() => {
  const loadProduct = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/v1/products/${id}`);
      reset(response.data);
      setUploadedImages(response.data.images || []);
    } catch (err) {
      setError('Failed to load product');
    } finally {
      setLoading(false);
    }
  };
  loadProduct();
}, [id]);

const handleSubmit = async (data) => {
  setSaving(true);
  setError(null);
  
  try {
    await api.put(`/api/v1/products/${id}/update`, {
      ...data,
      images: uploadedImages
    });
    setSuccess('Product updated successfully');
    // Navigate back after delay
    setTimeout(() => navigate(`/products/${id}`), 2000);
  } catch (err) {
    setError(err.response?.data?.error?.message || 'Update failed');
  } finally {
    setSaving(false);
  }
};
```

### Layout Requirements
- **Header**: Page title, breadcrumb, cancel button
- **Main Content**: Form with sections
- **Sidebar**: Preview card, quick actions
- **Footer**: Save, save & continue, cancel buttons
- **Responsive**: Single column on mobile, two-column on desktop

### Styling
- Form-based layout with clear sections
- Section headers with icons
- Image upload with preview
- Real-time validation feedback
- Success/error message banners
- Loading states during API calls

### Accessibility
- Semantic form structure
- ARIA labels for form fields
- Keyboard navigation support
- Screen reader compatibility
- Form validation error announcements
- High contrast colors

### Error Handling
- Form validation errors
- API error display
- Image upload error handling
- Network error handling
- Permission error handling

### Success Behavior
- Display success banner
- Auto-redirect after successful update
- Show preview in sidebar
- Update timestamp

### Special Features
- **Image Management**: Drag-and-drop upload, reordering, deletion
- **Bulk Pricing**: Dynamic tiered pricing form
- **Preview Sidebar**: Real-time product preview
- **Auto-save**: Draft saving functionality
- **Version History**: View previous versions

## Implementation Checklist
- [ ] Create page component file in `frontend/src/pages/ProductEditPage.jsx`
- [ ] Design layout with form sections
- [ ] Import required components
- [ ] Wire API calls via api.js service
- [ ] Add form handling and state management
- [ ] Add error handling and loading states
- [ ] Add routing in `frontend/src/config/routes.js`
- [ ] Test responsive design (mobile, tablet, desktop)
- [ ] Test accessibility (WCAG 2.1 AA)
- [ ] Add unit test in `frontend/src/pages/__tests__/ProductEditPage.test.js`

---

*Generated for Phase 5.1 Critical Pages Implementation*