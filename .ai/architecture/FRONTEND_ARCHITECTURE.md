# FRONTEND ARCHITECTURE

**Project:** Subhesco/EBDESIGN Agricultural Digital Operating System  
**Last Updated:** 24 August 2026

## Technology Stack

**Framework:** React 18.2.0  
**Build Tool:** Vite 5.0.8  
**State Management:** Zustand 4.4.7  
**Routing:** React Router v6.20.0  
**Data Fetching:** Axios 1.6.2, @tanstack/react-query 5.0.0  
**UI Library:** Radix UI components  
**Styling:** TailwindCSS 3.3.6  
**Icons:** Lucide React 0.294.0  
**Forms:** React Hook Form 7.48.2, Zod 3.22.4  
**Real-time:** Socket.IO Client 4.6.1

## Pages

### Page Structure
**Total Pages:** 150  
**Completed:** 123  
**Remaining:** 27

### Completed Pages

**Dashboard (15/20):**
- Main dashboard
- User dashboard
- Farmer dashboard
- Admin dashboard
- Analytics dashboard
- Reports dashboard
- Settings dashboard
- (5 more dashboard pages)

**User Management (10/10):**
- User list
- User details
- User creation
- User editing
- Role assignment
- Permission management
- Profile settings
- Account settings
- Activity log
- User analytics

**Product Management (12/12):**
- Product list
- Product details
- Product creation
- Product editing
- Inventory management
- Category management
- GI certification
- Pricing management
- Bulk upload
- Product analytics
- Reviews management
- Quality control

**Order Processing (15/15):**
- Order list
- Order details
- Order creation
- Order editing
- Order fulfillment
- Payment processing
- Shipping management
- Returns processing
- Order analytics
- Customer communication
- Order history
- Bulk operations
- Order templates
- Order workflow
- Order reports

**Financial Services (8/12):**
- Loan applications
- Loan details
- Loan approval
- EMI management
- Credit scoring
- Financial dashboard
- Transaction history
- Payment processing

**Farmer Portal (18/25):**
- Farmer profile
- FDI scoring
- Certifications
- Crop planning
- Financial services
- Advisory services
- Market access
- Community features
- (9 more farmer pages)

**Settings (5/8):**
- General settings
- Security settings
- Notification settings
- Privacy settings
- Integration settings

### Remaining Pages (27)

**Financial Services (4):**
- Investment management
- Insurance management
- Savings accounts
- Financial reports

**Farmer Portal (7):**
- Advanced analytics
- Success stories
- Training modules
- Expert consultation
- Community forums
- Market trends
- Weather services

**Settings (3):**
- Accessibility settings
- Language settings
- Theme settings

**Reports (20):**
- Sales reports
- Inventory reports
- Financial reports
- User reports
- Performance reports
- Custom reports
- Scheduled reports
- Report templates
- Data exports
- Report sharing
- (10 more report pages)

### New Components (Today)

**AI Components:**
- AIChat - Conversational AI interface
- AICollaborationDashboard - AI collaboration monitoring

**Security Components:**
- MFASetup - Multi-factor authentication setup
- GDPRConsent - Privacy consent management

**Platform Components:**
- PlatformDashboard - Platform monitoring

**Library Components:**
- LibraryBrowser - Library knowledge browser

## Routes

### Route Configuration
**File:** `frontend/src/main.jsx` (or router configuration file)  
**Router:** React Router v6  
**Mode:** Browser history

### Route Structure
```
/ - Main dashboard
/login - Login page
/register - Registration page
/dashboard - User dashboard
/admin - Admin dashboard
/products - Product list
/products/:id - Product details
/orders - Order list
/orders/:id - Order details
/farmers - Farmer list
/farmers/:id - Farmer details
/settings - Settings
/settings/security - Security settings
/settings/privacy - Privacy settings
/ai - AI chat (NEW - not yet routed)
/ai/collaboration - AI collaboration (NEW - not yet routed)
/library - Library browser (NEW - not yet routed)
/mfa/setup - MFA setup (NEW - not yet routed)
```

### Protected Routes
**Authentication Required:** All routes except /login, /register  
**Authorization:** Role-based access control for admin routes

## Components

### Component Structure
**Location:** `frontend/src/components/`  
**Total Components:** 50+  
**New Components (Today):** 6

### Component Categories

**Layout Components:**
- Header
- Sidebar
- Footer
- Navigation
- Layout wrapper

**UI Components:**
- Button
- Input
- Select
- Table
- Card
- Modal
- Dialog
- Toast
- Badge
- Avatar

**Form Components:**
- Form
- Field
- Label
- Error
- Validation

**Data Components:**
- DataTable
- DataList
- DataGrid
- Chart
- Graph
- StatCard

**Business Components:**
- ProductCard
- OrderCard
- FarmerCard
- LoanCard
- PolicyCard

**New Components (Today):**
- AI/AIChat
- AI/AICollaborationDashboard
- GDPR/GDPRConsent
- Library/LibraryBrowser
- MFA/MFASetup
- Platform/PlatformDashboard

## State Management

### Zustand Stores
**Auth Store:**
- User authentication state
- Login/logout actions
- Token management

**UI Store:**
- UI state (modals, sidebars)
- Theme state
- Layout state

**Data Store:**
- Cached API responses
- Pagination state
- Filter state

**AI Store:**
- AI conversation state
- Chat history
- Agent selection

### React Query
**Data Fetching:**
- API response caching
- Automatic refetching
- Optimistic updates
- Error handling

## Forms

### Form Validation
**Library:** React Hook Form + Zod  
**Validation:**
- Client-side validation
- Schema validation
- Error handling
- Field-level validation

### Form Types
**Authentication Forms:**
- Login form
- Registration form
- MFA setup form

**Business Forms:**
- Product creation form
- Order creation form
- Farmer profile form
- Loan application form

**Settings Forms:**
- Profile settings form
- Security settings form
- Privacy settings form

## API Integration

### API Client
**Library:** Axios  
**Base URL:** VITE_API_URL environment variable  
**Interceptors:**
- Request interceptor (add auth token)
- Response interceptor (handle errors)
- Refresh token interceptor

### API Endpoints
**Authentication:**
- POST /api/v1/auth/login
- POST /api/v1/auth/register
- POST /api/v1/auth/logout

**Data:**
- GET /api/v1/users
- GET /api/v1/products
- GET /api/v1/orders
- GET /api/v1/farmers

**AI (NEW):**
- POST /api/v1/ai/unified
- GET /api/v1/ai-collaboration/*
- GET /api/v1/library/*

## Authentication

### Authentication Flow
1. User enters credentials
2. POST to /api/v1/auth/login
3. Receive JWT access token + refresh token
4. Store tokens in Zustand store
5. Add token to Axios request header
6. Redirect to dashboard

### Token Refresh
1. Axios response interceptor detects 401
2. POST to /api/v1/auth/refresh
3. Receive new access token
4. Update store and retry original request

### Logout
1. Call POST to /api/v1/auth/logout
2. Clear tokens from store
3. Clear Axios headers
4. Redirect to login

## Authorization

### Role-Based Access Control
**Roles:** admin, farmer, fpo, corporate, consumer, logistics, horeca  
**Permissions:** Defined in database  
**Implementation:** Route-level protection

### Protected Routes
**Implementation:** React Router wrapper  
**Check:** User authentication + role authorization  
**Redirect:** Login page if not authenticated, unauthorized page if not authorized

## User Workflows

### User Registration Workflow
1. Navigate to /register
2. Fill registration form
3. Submit form
4. Create account
5. Redirect to login

### Login Workflow
1. Navigate to /login
2. Enter credentials
3. Submit form
4. Receive tokens
5. Redirect to dashboard

### Product Purchase Workflow
1. Browse products
2. View product details
3. Add to cart
4. Checkout
5. Create order
6. Process payment
7. Order confirmation

### Farmer Onboarding Workflow
1. Register as farmer
2. Complete profile
3. Upload documents
4. Get FDI score
5. Access farmer portal
6. List products
7. Receive orders

## Responsive Behavior

### Breakpoints
**Mobile:** < 640px  
**Tablet:** 640px - 1024px  
**Desktop:** > 1024px

### Responsive Strategy
**TailwindCSS:** Mobile-first responsive design  
**Components:** Responsive props and variants  
**Layout:** Grid and flexbox with responsive breakpoints

## Design System

### Component Library
**Radix UI:** Headless UI components  
**Styling:** TailwindCSS utility classes  
**Theme:** Custom theme configuration

### Design Tokens
**Colors:** Primary, secondary, accent colors  
**Typography:** Font sizes, weights, line heights  
**Spacing:** Spacing scale  
**Border Radius:** Radius scale  
**Shadows:** Shadow scale

## Reusable Components

### Data Table
**Features:** Sorting, filtering, pagination  
**Usage:** Product list, order list, user list

### Form Components
**Features:** Validation, error handling, accessibility  
**Usage:** All forms

### Modal
**Features:** Accessibility, animations, backdrop  
**Usage:** Product details, order details, confirmations

### Toast
**Features:** Auto-dismiss, stacking, types  
**Usage:** Success/error notifications

## Known UI Issues

**Build Warning:** Chunks > 1000 kB  
**Impact:** Large bundle size  
**Status:** Needs optimization  
**Solution:** Code splitting, lazy loading

**Missing Routes:** New components not routed  
**Impact:** Components not accessible  
**Status:** Needs route integration  
**Solution:** Add routes to React Router

---

*This document provides a comprehensive view of the frontend architecture.*

