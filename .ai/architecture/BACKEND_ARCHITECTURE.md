# BACKEND ARCHITECTURE

**Project:** Subhesco/EBDESIGN Agricultural Digital Operating System  
**Last Updated:** 24 August 2026

## Technology Stack

**Runtime:** Node.js 20+  
**Framework:** Express.js 4.18.2  
**API Style:** RESTful  
**Authentication:** JWT, OAuth2  
**Real-time:** Socket.IO 4.6.1

## Services

### Service Architecture
**Total Services:** 140+  
**New Services (Today):** 13

### Service Categories

**Core Services:**
- authService - Authentication and authorization
- userService - User management (M002)
- organizationService - Organization management (M003)
- roleService - Role management (M004)
- permissionService - Permission management (M005)

**Business Services:**
- productService - Product catalog
- orderService - Order processing
- financialService - Financial operations
- logisticsService - Logistics coordination
- insuranceService - Insurance policies

**Rural Services:**
- farmerService - Farmer management (M020)
- villageService - Village management (M021)
- agricultureService - Agriculture management (M022)
- cropService - Crop management (M023)
- livestockService - Livestock management (M024)

**AI Services:**
- aiService - Original AI decision engine
- claudeAICoordinator - Claude AI orchestration (NEW)
- libraryKnowledgeService - Library integration (NEW)
- aiCollaborationService - Devin-Claude tracking (NEW)

**Security Services:**
- mfaService - Multi-factor authentication (NEW)
- gdprService - GDPR compliance (NEW)

**Platform Services:**
- platformCoreService - Platform foundation (M001) (MODIFIED)

**Configuration Services:**
- unifiedConfigService - Configuration management (NEW)

### Service Pattern
**Location:** `backend/src/services/`  
**Pattern:** Class-based services  
**Constructor:** Initialize dependencies  
**Methods:** CRUD operations, business logic  
**Export:** `module.exports = new ServiceClass()`

## Controllers

### Controller Architecture
**Pattern:** Service-based routing  
**Implementation:** Routes directly call service methods  
**Separation:** No separate controller layer (routes act as controllers)

### Route Controllers
**Location:** `backend/src/routes/`  
**Total Routes:** 107 route files  
**New Routes (Today):** 6

**Route Categories:**
- Authentication routes
- User management routes
- Product routes
- Order routes
- Financial routes
- Logistics routes
- Insurance routes
- AI routes (NEW)
- Collaboration routes (NEW)
- Library routes (NEW)
- MFA routes (NEW)
- GDPR routes (NEW)
- Platform routes (MODIFIED)

## Routes

### Route Configuration
**Entry Point:** `backend/src/index.js`  
**Router:** Express Router  
**Middleware:** Applied at route level

### Route Structure
```
/api/v1/auth - Authentication
/api/v1/users - User management
/api/v1/organizations - Organization management
/api/v1/products - Product catalog
/api/v1/orders - Order processing
/api/v1/ai - Unified AI (NEW)
/api/v1/ai-collaboration - AI collaboration (NEW)
/api/v1/library - Library knowledge (NEW)
/api/v1/mfa - MFA (NEW)
/api/v1/privacy - GDPR (NEW)
/api/v1/platform - Platform core (MODIFIED)
```

### Route Middleware
**Applied:**
- CORS
- Rate limiting
- Authentication (JWT)
- Authorization (RBAC)
- Validation
- Error handling
- Logging

## Business Logic

### Service Layer
**Location:** `backend/src/services/`  
**Responsibility:** Business logic, data processing, external API calls

### Business Logic Examples
**Authentication:**
- Token generation and validation
- Password hashing
- MFA verification
- Session management

**Financial:**
- Credit scoring
- Loan eligibility calculation
- EMI calculation
- Risk assessment

**AI:**
- Request orchestration
- Library knowledge integration
- Agent selection
- Context management

## Models

### Data Access Pattern
**Implementation:** Direct database queries in services  
**ORM:** None (using pg library directly)  
**Connection Pool:** PostgreSQL connection pool

### Database Connection
**File:** `backend/src/database/connection.js`  
**Pool:** PostgreSQL connection pool  
**Configuration:** Environment variables

## Middleware

### Middleware Stack
**Location:** `backend/src/middleware/`  
**Total Middleware:** 10+

### Middleware Types
**Security:**
- helmet - Security headers
- cors - CORS configuration
- compression - Response compression

**Authentication:**
- authMiddleware - JWT verification
- mfaMiddleware - MFA verification (NEW)

**Rate Limiting:**
- rateLimit - Request rate limiting
- slowDown - Slow down on repeated requests

**Validation:**
- express-validator - Request validation

**Logging:**
- morgan - HTTP request logging
- winston - Application logging

**Error Handling:**
- errorHandler - Global error handler
- notFoundHandler - 404 handler

## Validation

### Request Validation
**Library:** express-validator 7.0.1  
**Implementation:** Middleware before route handlers  
**Validation:** Schema-based validation

### Validation Examples
**User Registration:**
- Email format validation
- Password strength validation
- Required field validation

**Product Creation:**
- Price validation (>= 0)
- Stock validation (>= 0)
- Required fields validation

## Authentication

### JWT Authentication
**Implementation:** JSON Web Tokens  
**Secret:** JWT_SECRET environment variable  
**Access Token:** 15 minutes expiry  
**Refresh Token:** 7 days expiry

### Authentication Flow
1. User submits credentials
2. Validate credentials
3. Generate JWT tokens
4. Return tokens to client
5. Client includes token in requests
6. Middleware validates token
7. Allow/deny access

### OAuth2
**Providers:** Google, Facebook  
**Implementation:** Passport.js  
**Status:** Configured but not enabled

## Authorization

### Role-Based Access Control
**Implementation:** Middleware checks user role  
**Roles:** admin, farmer, fpo, corporate, consumer, logistics, horeca  
**Permissions:** Database-defined  
**Storage:** roles, permissions, user_roles, role_permissions tables

### Authorization Flow
1. User authenticated
2. Middleware extracts user role
3. Middleware checks role permissions
4. Allow/deny access based on permissions

## Error Handling

### Error Handling Strategy
**Global Handler:** Catches all errors  
**Response Format:** Consistent JSON error responses  
**Logging:** Winston logs all errors

### Error Types
**Validation Errors:** 400 Bad Request  
**Authentication Errors:** 401 Unauthorized  
**Authorization Errors:** 403 Forbidden  
**Not Found Errors:** 404 Not Found  
**Server Errors:** 500 Internal Server Error

## Logging

### Logging Configuration
**Library:** Winston 3.11.0  
**Levels:** error, warn, info, http, debug  
**Transports:** Console, file  
**Development:** Console logging  
**Production:** File logging

### Log Types
**Access Logs:** HTTP requests (morgan)
**Application Logs:** Application events (winston)
**Error Logs:** Errors and exceptions
**Audit Logs:** Sensitive operations

## Background Processing

### Message Queue
**Library:** Bull 4.12.0 (Redis-based)  
**Purpose:** Async job processing  
**Status:** Configured but not actively used

### Background Jobs
**Email Sending:** Async email jobs  
**Report Generation:** Async report generation  
**Data Sync:** Async data synchronization

## Integrations

### Database Integrations
**PostgreSQL:** Primary relational database  
**MongoDB:** Document storage  
**Redis:** Caching and message queue  
**Elasticsearch:** Full-text search

### External API Integrations
**Anthropic Claude AI:** AI services (NEW, not configured)  
**Twilio:** SMS/WhatsApp (NEW, not configured)  
**Government APIs:** Agricultural schemes (not implemented)

### Internal Service Integrations
**Claude AI Coordinator:** Central AI orchestration (NEW)  
**Library Knowledge Service:** Library integration (NEW)  
**AI Collaboration Service:** Devin-Claude tracking (NEW)

## API Design

### RESTful Conventions
**GET:** Retrieve resources  
**POST:** Create resources  
**PUT:** Update resources  
**DELETE:** Delete resources  
**PATCH:** Partial updates

### Response Format
**Success:** `{ success: true, data: {}, metadata: {} }`  
**Error:** `{ success: false, error: "message", code: "CODE" }`

### Pagination
**Query Params:** page, limit, sort, filter  
**Response:** `{ data: [], pagination: { total, page, limit, pages } }`

## Security

### Security Measures
**Headers:** Helmet.js security headers  
**CORS:** Configured for specific origins  
**Rate Limiting:** Per-IP rate limiting  
**Input Validation:** Request validation  
**SQL Injection:** Parameterized queries  
**XSS Protection:** Input sanitization  
**CSRF Protection:** Token-based (planned)

### Secrets Management
**Environment Variables:** All secrets in environment  
**Production:** Secrets manager planned  
**Development:** .env files (not committed)

## Performance

### Connection Pooling
**PostgreSQL:** Connection pool (min 2, max 20)  
**MongoDB:** Connection pool  
**Redis:** Connection pool

### Caching
**Redis:** API response caching  
**In-Memory:** Session caching  
**HTTP Caching:** Cache headers

### Compression
**Library:** compression middleware  
**Response:** Gzip compression

---

*This document provides a comprehensive view of the backend architecture.*

