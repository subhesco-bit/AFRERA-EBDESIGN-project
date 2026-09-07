# SYSTEM ARCHITECTURE

**Project:** SVESCO/EBDESIGN Agricultural Digital Operating System  
**Version:** 1.0  
**Last Updated:** 24 August 2026

## Architectural Overview

### Pattern: Microservices with Unified AI Layer

The SVESCO/EBDESIGN platform follows a microservices architecture with a unified AI orchestration layer that enables Claude AI integration across all services.

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Layer                           │
│                  React 18 + Vite + Zustand                    │
│                Radix UI + TailwindCSS                         │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP/WebSocket
┌──────────────────────▼──────────────────────────────────────┐
│                  API Gateway Layer                          │
│              Express.js + Socket.IO                          │
│         Authentication + Rate Limiting + CORS                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
┌───────▼──────┐ ┌────▼─────┐ ┌─────▼──────┐
│   Business   │ │    AI     │ │  Library   │
│   Services  │ │ Orchest.  │ │ Knowledge  │
│   (140)      │ │  Claude   │ │  Service   │
└──────┬───────┘ └────┬─────┘ └─────┬──────┘
       │              │              │
       └──────────────┼──────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
┌───────▼─────┐ ┌────▼────┐ ┌─────▼─────┐
│ PostgreSQL  │ │ MongoDB │ │   Redis    │
│ (Relational)│ │(Document)│ │  (Cache)   │
└─────────────┘ └─────────┘ └───────────┘
```

## Service Architecture

### Core Services (Historical Baseline)

**Identity & Access:**
- `authService` - JWT authentication, OAuth2 integration
- `userService` - User management (M002)
- `organizationService` - Organization management (M003)
- `roleService` - Role management (M004)
- `permissionService` - Permission management (M005)

**Business Services:**
- `productService` - Product catalog and inventory
- `orderService` - Order processing and management
- `financialService` - Loans, advances, credit scoring
- `logisticsService` - Shipment tracking and logistics
- `insuranceService` - Policies and claims management

**Rural Services (Recent Development):**
- `farmerService` - Farmer management (M020)
- `villageService` - Village management (M021)
- `agricultureService` - Agriculture management (M022)
- `cropService` - Crop management (M023)
- `livestockService` - Livestock management (M024)

**AI & Intelligence:**
- `aiService` - Original AI decision engine
- `claudeAICoordinator` - Unified Claude AI orchestration (NEW)
- `libraryKnowledgeService` - Library knowledge integration (NEW)
- `aiCollaborationService` - Devin-Claude collaboration (NEW)

**Compliance & Security (Recent):**
- `mfaService` - Multi-factor authentication (NEW)
- `gdprService` - GDPR compliance (NEW)
- `platformCoreService` - Platform core (M001) (NEW)

### New Integration Layer

**AI Collaboration System:**
- Shared project context in `.ai/`
- Mutual work tracking protocol
- Handoff mechanism between agents
- Continuous synchronization

**Library Integration:**
- Content hashing for integrity
- AI-powered search and retrieval
- Knowledge base for Claude AI context

## Database Architecture

### PostgreSQL Schema (523 Tables)

**Core Tables:**
- `users` - User accounts and authentication
- `organizations` - Enterprise organization management
- `roles` - Role definitions
- `permissions` - Permission definitions
- `user_roles` - User-role assignments
- `role_permissions` - Role-permission assignments

**Business Tables:**
- `products` - Product catalog with GI certification
- `orders` - Orders and order items
- `farmers` - Farmer profiles with FDI scores
- `fpos` - Farmer Producer Organizations
- `loans` - Loan applications and EMI schedules
- `policies` - Insurance policies
- `claims` - Insurance claims
- `shipments` - Logistics shipments

**New Tables (Recent):**
- `mfa_secrets` - MFA configuration and backup codes
- `gdpr_consents` - User consent tracking
- `gdpr_requests` - Privacy requests (export, deletion)
- `platform_metrics` - Platform health and statistics
- `ai_session_context` - AI conversation context
- `ai_usage_logs` - AI usage tracking
- `library_knowledge` - Library knowledge index
- `library_content_hashes` - Content integrity verification
- `ai_collaboration_log` - Devin-Claude work tracking

### MongoDB Collections

**Document Storage:**
- User sessions and preferences
- Audit logs and events
- Cache data and temporary storage
- AI conversation history

### Redis Data Structures

**Caching:**
- User sessions and authentication tokens
- API response caching
- Real-time data synchronization
- Rate limiting counters

## API Architecture

### Route Structure (107 Route Files)

**Core Routes:**
- `/api/v1/auth` - Authentication endpoints
- `/api/v1/users` - User management
- `/api/v1/organizations` - Organization management
- `/api/v1/products` - Product catalog
- `/api/v1/orders` - Order processing

**New Routes (Recent):**
- `/api/v1/mfa` - Multi-factor authentication
- `/api/v1/privacy` - GDPR compliance
- `/api/v1/platform` - Platform core
- `/api/v1/ai` - Unified AI endpoints
- `/api/v1/library` - Library knowledge
- `/api/v1/ai-collaboration` - Devin-Claude collaboration

### API Design Patterns

**RESTful Conventions:**
- `GET /resource` - List resources
- `GET /resource/:id` - Get specific resource
- `POST /resource` - Create resource
- `PUT /resource/:id` - Update resource
- `DELETE /resource/:id` - Delete resource

**Response Format:**
```json
{
  "success": true|false,
  "data": {},
  "error": "Error message if success=false",
  "metadata": {}
}
```

## Frontend Architecture

### Component Structure

**UI Components (Radix UI + TailwindCSS):**
- Form components with validation
- Data tables with sorting/filtering
- Modal dialogs and overlays
- Navigation and routing
- Real-time updates via Socket.IO

**Page Components (123/150 Complete):**
- Dashboard pages
- Management pages (users, products, orders)
- Reporting and analytics pages
- Settings and configuration pages

**New Components (Recent):**
- `MFASetup` - MFA configuration UI
- `GDPRConsent` - Privacy consent management
- `AIChat` - Unified AI chat interface
- `PlatformDashboard` - Platform monitoring
- `LibraryBrowser` - Library knowledge browser
- `AICollaborationDashboard` - AI collaboration monitoring

### State Management

**Zustand Stores:**
- Auth store - User authentication state
- UI store - UI state and preferences
- Data store - Cached API responses
- AI store - AI conversation state

### Routing

**React Router v6:**
- Protected routes with authentication
- Role-based route access
- Lazy loading for performance
- Route-based code splitting

## AI Integration Architecture

### Claude AI Orchestration

**Unified Coordinator Pattern:**
```javascript
claudeAICoordinator.coordinateAIRequest({
  requestType: 'conversational|analytical|automation',
  query: 'User query',
  context: 'Additional context',
  userId: 'User ID',
  sessionId: 'Session ID',
  agentPreference: 'farmer-advisor|business-analyst|...'
})
```

**Agent Types:**
- `farmer-advisor` - Agricultural guidance
- `business-analyst` - Business intelligence
- `operations-manager` - Process optimization
- `governance-agent` - Compliance and governance

**Context Sources:**
- Library knowledge base
- User session history
- Database context
- Real-time data

### Devin-Claude Collaboration

**Work Tracking:**
- Both agents log work to shared system
- Handoff mechanism for task transfer
- Continuous synchronization protocol
- Shared project intelligence in `.ai/`

**Integration Points:**
- Claude AI coordinator logs all AI work
- Devin implementation tracked in collaboration system
- Both agents can review each other's work
- Handoff records ensure continuity

## Security Architecture

### Authentication & Authorization

**JWT-Based Authentication:**
- Access tokens: 15 minutes expiry
- Refresh tokens: 7 days expiry
- Token refresh with automatic retry

**Role-Based Access Control (RBAC):**
- Hierarchical role system
- Permission-based access control
- Route-level authorization middleware

**Multi-Factor Authentication:**
- TOTP-based 2FA support
- Backup codes for recovery
- SMS-based verification (Twilio integration)

### Data Security

**Encryption:**
- Password hashing with bcrypt
- Sensitive data encryption at rest (planned)
- TLS for data in transit

**Audit Logging:**
- Winston structured logging
- Audit trail for sensitive operations
- AI usage tracking

## Deployment Architecture

### Container Strategy

**Docker Configuration:**
- Backend: Node.js container
- Frontend: Nginx container serving static files
- PostgreSQL: Official PostgreSQL container
- MongoDB: Official MongoDB container
- Redis: Official Redis container

**Docker Compose:**
- Local development environment
- Service orchestration
- Volume management for persistence

### CI/CD Pipeline

**GitHub Actions:**
- Automated testing on push
- Build validation
- Deployment staging
- Production deployment (manual approval)

## Performance Architecture

### Caching Strategy

**Redis Caching:**
- API response caching
- Session storage
- Real-time data synchronization
- Rate limiting

### Database Optimization

**PostgreSQL:**
- Indexing strategy
- Query optimization
- Connection pooling
- Read replicas (planned)

**MongoDB:**
- Document indexing
- Query optimization
- Sharding strategy (planned)

## Monitoring Architecture

### Logging

**Winston Logger:**
- Structured logging
- Multiple transports (console, file)
- Log levels: error, warn, info, http, debug
- Centralized log aggregation (planned)

### Monitoring (Planned)

**Prometheus + Grafana:**
- Metrics collection
- Performance monitoring
- Alerting
- Dashboard visualization

## Scalability Architecture

### Horizontal Scaling

**Backend:**
- Stateless service design
- Load balancer support
- Database connection pooling
- Message queue for async processing

**Frontend:**
- Static file serving via CDN
- Code splitting and lazy loading
- Service worker for offline support (planned)

---

*This architecture document must be updated when structural changes are made to the system.*
