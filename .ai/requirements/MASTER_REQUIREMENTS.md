# MASTER REQUIREMENTS

**Project:** Subhesco/EBDESIGN Agricultural Digital Operating System  
**Last Updated:** 24 August 2026

## Confidence Levels
- CONFIRMED FROM CODE: Verified by inspecting source code
- CONFIRMED FROM DOCUMENTATION: Verified by reading project docs
- CONFIRMED FROM GIT HISTORY: Verified by analyzing commits
- INFERRED: Deduced from implementation patterns
- UNKNOWN: Cannot be determined
- REQUIRES VALIDATION: Needs testing/verification

## Business Requirements

### CONFIRMED REQUIREMENTS

**BR-001: Multi-Vertical Agricultural Platform**
- Source: README.md, DOCUMENTATION/
- Status: CONFIRMED FROM DOCUMENTATION
- Description: Platform must support marketplace, finance, logistics, insurance, and AI services
- Implementation: 140+ services across all verticals

**BR-002: Northeast India Focus**
- Source: README.md
- Status: CONFIRMED FROM DOCUMENTATION
- Description: Platform designed for Northeast India farmers and agricultural cooperatives
- Implementation: Farmer portal, FPO integration, regional schemes

**BR-003: Direct Farmer-to-Consumer Marketplace**
- Source: README.md
- Status: CONFIRMED FROM DOCUMENTATION
- Description: Enable farmers to sell directly to consumers
- Implementation: Product catalog, orders, GI certification

**BR-004: Financial Inclusion**
- Source: README.md
- Status: CONFIRMED FROM DOCUMENTATION
- Description: Provide loans, credit scoring, and financial services
- Implementation: Financial service, loan applications, EMI management

**BR-005: Logistics and Supply Chain**
- Source: README.md
- Status: CONFIRMED FROM DOCUMENTATION
- Description: Multimodal cold-chain logistics with tracking
- Implementation: Logistics service, shipment tracking, vehicles

**BR-006: Insurance Services**
- Source: README.md
- Status: CONFIRMED FROM DOCUMENTATION
- Description: Crop, transit, and warehouse insurance
- Implementation: Insurance service, policies, claims

**BR-007: AI Decision Support**
- Source: README.md, AI integration
- Status: CONFIRMED FROM CODE
- Description: AI-powered decision making, recommendations, and analytics
- Implementation: Claude AI coordinator, library knowledge service

## Functional Requirements

### CONFIRMED REQUIREMENTS

**FR-001: User Authentication**
- Source: Code inspection
- Status: CONFIRMED FROM CODE
- Description: Users must be able to register, login, and logout
- Implementation: JWT authentication, OAuth2 support

**FR-002: Role-Based Access Control**
- Source: Code inspection
- Status: CONFIRMED FROM CODE
- Description: Different user roles with different permissions
- Implementation: RBAC with roles, permissions, middleware

**FR-003: Product Management**
- Source: Code inspection
- Status: CONFIRMED FROM CODE
- Description: CRUD operations for products
- Implementation: Product service, product routes

**FR-004: Order Processing**
- Source: Code inspection
- Status: CONFIRMED FROM CODE
- Description: Create, manage, and fulfill orders
- Implementation: Order service, order routes

**FR-005: Farmer Profile Management**
- Source: Code inspection
- Status: CONFIRMED FROM CODE
- Description: Manage farmer profiles and FDI scores
- Implementation: Farmer service, FDI calculation

**FR-006: Multi-Factor Authentication**
- Source: New code (today)
- Status: CONFIRMED FROM CODE
- Description: Support TOTP, SMS, and backup codes
- Implementation: MFA service, TOTP (speakeasy), SMS (Twilio)

**FR-007: GDPR Compliance**
- Source: New code (today)
- Status: CONFIRMED FROM CODE
- Description: Consent management, data export, data deletion
- Implementation: GDPR service, consent tracking

**FR-008: AI Chat Interface**
- Source: New code (today)
- Status: CONFIRMED FROM CODE
- Description: Conversational AI interface for users
- Implementation: AI chat component, Claude AI coordinator

**FR-009: Library Knowledge Integration**
- Source: New code (today)
- Status: CONFIRMED FROM CODE
- Description: Search and retrieve library knowledge
- Implementation: Library knowledge service, library browser

**FR-010: Devin-Claude Collaboration**
- Source: New code (today)
- Status: CONFIRMED FROM CODE
- Description: Track work and handoffs between AIs
- Implementation: AI collaboration service, collaboration dashboard

### INFERRED REQUIREMENTS

**FR-011: Real-Time Updates**
- Source: Socket.IO presence
- Status: INFERRED
- Description: Real-time notifications and updates
- Implementation: Socket.IO configured, usage not verified

**FR-012: Search Functionality**
- Source: Elasticsearch presence
- Status: INFERRED
- Description: Full-text search across platform
- Implementation: Elasticsearch configured, usage not verified

## Non-Functional Requirements

### CONFIRMED REQUIREMENTS

**NFR-001: Scalability**
- Source: Microservices architecture
- Status: CONFIRMED FROM CODE
- Description: System must scale horizontally
- Implementation: Microservices architecture, connection pooling

**NFR-002: Security**
- Source: Security middleware
- Status: CONFIRMED FROM CODE
- Description: Secure authentication, authorization, data protection
- Implementation: JWT, RBAC, Helmet, CORS, rate limiting

**NFR-003: Performance**
- Source: Caching, compression
- Status: CONFIRMED FROM CODE
- Description: Fast response times
- Implementation: Redis caching, Gzip compression, connection pooling

**NFR-004: Reliability**
- Source: Error handling, logging
- Status: CONFIRMED FROM CODE
- Description: System must be reliable and fault-tolerant
- Implementation: Error handling, Winston logging, connection pooling

### INFERRED REQUIREMENTS

**NFR-005: Availability**
- Source: Production deployment focus
- Status: INFERRED
- Description: High availability
- Implementation: Not verified, no redundancy configured

**NFR-006: Maintainability**
- Source: Code structure
- Status: INFERRED
- Description: Code must be maintainable
- Implementation: Modular architecture, service separation

## Technical Requirements

### CONFIRMED REQUIREMENTS

**TR-001: Node.js 20+**
- Source: package.json
- Status: CONFIRMED FROM CODE
- Description: Backend must run on Node.js 20+
- Implementation: Node.js 20+ specified in engines

**TR-002: React 18**
- Source: package.json
- Status: CONFIRMED FROM CODE
- Description: Frontend must use React 18
- Implementation: React 18.2.0

**TR-003: PostgreSQL 15+**
- Source: Migration files
- Status: CONFIRMED FROM CODE
- Description: Must use PostgreSQL 15+
- Implementation: PostgreSQL dependencies, migration files

**TR-004: MongoDB**
- Source: package.json
- Status: CONFIRMED FROM CODE
- Description: Must use MongoDB for document storage
- Implementation: MongoDB 6.3.0

**TR-005: Redis**
- Source: package.json
- Status: CONFIRMED FROM CODE
- Description: Must use Redis for caching
- Implementation: ioredis 5.3.2

**TR-006: Docker Support**
- Source: Dockerfile present
- Status: CONFIRMED FROM CODE
- Description: Must support Docker deployment
- Implementation: Dockerfile, docker-compose.yml

### INFERRED REQUIREMENTS

**TR-007: RESTful API**
- Source: Express routes
- Status: INFERRED
- Description: API must follow RESTful conventions
- Implementation: RESTful route patterns observed

## Security Requirements

### CONFIRMED REQUIREMENTS

**SR-001: JWT Authentication**
- Source: Code inspection
- Status: CONFIRMED FROM CODE
- Description: Use JWT for authentication
- Implementation: jsonwebtoken 9.0.2

**SR-002: Password Hashing**
- Source: Code inspection
- Status: CONFIRMED FROM CODE
- Description: Hash passwords with bcrypt
- Implementation: bcryptjs 2.4.3

**SR-003: Input Validation**
- Source: Code inspection
- Status: CONFIRMED FROM CODE
- Description: Validate all inputs
- Implementation: express-validator 7.0.1

**SR-004: SQL Injection Prevention**
- Source: Code inspection
- Status: CONFIRMED FROM CODE
- Description: Prevent SQL injection
- Implementation: Parameterized queries (pg library)

**SR-005: Rate Limiting**
- Source: Code inspection
- Status: CONFIRMED FROM CODE
- Description: Rate limit API requests
- Implementation: express-rate-limit 7.1.5

**SR-006: MFA Support**
- Source: New code (today)
- Status: CONFIRMED FROM CODE
- Description: Support multi-factor authentication
- Implementation: speakeasy 2.0.0, Twilio 5.0.0

**SR-007: GDPR Compliance**
- Source: New code (today)
- Status: CONFIRMED FROM CODE
- Description: Comply with GDPR requirements
- Implementation: GDPR service, consent tracking

## Performance Requirements

### INFERRED REQUIREMENTS

**PR-001: Response Time**
- Source: Caching implementation
- Status: INFERRED
- Description: API responses < 200ms (cached)
- Implementation: Redis caching, connection pooling

**PR-002: Concurrent Users**
- Source: Connection pooling
- Status: INFERRED
- Description: Support 1000+ concurrent users
- Implementation: Connection pooling (max 20 connections)

**PR-003: Bundle Size**
- Source: Build warning
- Status: REQUIRES VALIDATION
- Description: Optimize bundle size (< 1000 kB chunks)
- Implementation: Code splitting needed

## Integration Requirements

### CONFIRMED REQUIREMENTS

**IR-001: Anthropic Claude AI**
- Source: New code (today)
- Status: CONFIRMED FROM CODE
- Description: Integrate Claude AI for decision support
- Implementation: @anthropic-ai/sdk 0.27.0

**IR-002: Twilio SMS**
- Source: New code (today)
- Status: CONFIRMED FROM CODE
- Description: Integrate Twilio for SMS verification
- Implementation: twilio 5.0.0

**IR-003: Library System**
- Source: New code (today)
- Status: CONFIRMED FROM CODE
- Description: Integrate EBDESIGN library
- Implementation: Library knowledge service

### INFERRED REQUIREMENTS

**IR-004: Government Schemes**
- Source: Documentation
- Status: INFERRED
- Description: Integrate government agricultural schemes
- Implementation: Not implemented

## Deployment Requirements

### CONFIRMED REQUIREMENTS

**DR-001: Docker Deployment**
- Source: Dockerfile
- Status: CONFIRMED FROM CODE
- Description: Support Docker deployment
- Implementation: Dockerfile, docker-compose.yml

**DR-002: Environment Configuration**
- Source: .env files
- Status: CONFIRMED FROM CODE
- Description: Support environment-based configuration
- Implementation: .env, .env.production

### INFERRED REQUIREMENTS

**DR-003: CI/CD Pipeline**
- Source: GitHub Actions workflow
- Status: INFERRED
- Description: Automated CI/CD pipeline
- Implementation: GitHub Actions workflow exists, not fully configured

**DR-004: Production Deployment**
- Source: Production configuration
- Status: INFERRED
- Description: Production deployment process
- Implementation: Not fully documented

## Testing Requirements

### CONFIRMED REQUIREMENTS

**TQ-001: Unit Testing Framework**
- Source: package.json
- Status: CONFIRMED FROM CODE
- Description: Unit testing framework configured
- Implementation: Jest 29.7.0

**TQ-002: Integration Testing Framework**
- Source: package.json
- Status: CONFIRMED FROM CODE
- Description: Integration testing framework configured
- Implementation: Supertest 6.3.3

### INFERRED REQUIREMENTS

**TQ-003: Test Coverage**
- Source: No tests written
- Status: REQUIRES VALIDATION
- Description: Achieve 80% test coverage
- Implementation: 0% coverage currently

**TQ-004: E2E Testing**
- Source: No E2E framework
- Status: INFERRED
- Description: End-to-end testing
- Implementation: Not configured

## Future Requirements

### PLANNED REQUIREMENTS

**FR-011: Mobile Applications**
- Source: README.md roadmap
- Status: PLANNED
- Description: Mobile apps for farmers
- Implementation: Capacitor configured, not implemented

**FR-012: Advanced AI Models**
- Source: README.md roadmap
- Status: PLANNED
- Description: Additional AI models
- Implementation: Not implemented

**FR-013: Blockchain Integration**
- Source: README.md roadmap
- Status: PLANNED
- Description: Blockchain for supply chain
- Implementation: Not implemented

**FR-014: Voice Assistant**
- Source: README.md roadmap
- Status: PLANNED
- Description: Voice assistant integration
- Implementation: Not implemented

---

*This document reconstructs requirements from existing code, documentation, and implementation.*

